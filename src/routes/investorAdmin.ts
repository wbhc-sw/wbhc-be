import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../services/database';
import { 
  jwtAuth, 
  requireRole,
  ROLES_THAT_CAN_READ,
  ROLES_THAT_CAN_CREATE,
  ROLES_THAT_CAN_UPDATE,
  AuthRequest 
} from '../middleware/roleAuth';
import { UserRole } from '../types/investor';
import { investorAdminCreateSchema, investorAdminUpdateSchema } from '../middleware/validation';
import { InvestorAdmin } from '../types/investor';
import xss from 'xss';

const router = Router();

// @ts-expect-error: Suppress Express 5 type error
router.get('/', jwtAuth, requireRole(ROLES_THAT_CAN_READ), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const user = req.user!;
    const { 
      search, 
      status, 
      city, 
      companyID, 
      source, 
      createdAtFrom, 
      createdAtTo, 
      updatedAtFrom, 
      updatedAtTo, 
      page, 
      limit 
    } = req.query;
    
    // Pagination parameters
    const pageNum = page ? Math.max(1, parseInt(page as string, 10)) : 1;
    const limitNum = limit ? Math.min(100, Math.max(1, parseInt(limit as string, 10))) : 20; // Default 20, max 100
    const skip = (pageNum - 1) * limitNum;
    
    // Build the where clause for filtering
    const whereClause: any = {};
    
    // Company-specific access control
    if ([UserRole.COMPANY_ADMIN, UserRole.COMPANY_VIEWER, UserRole.COMPANY_CREATOR].includes(user.role)) {
      if (!user.companyId) {
        return res.status(403).json({ success: false, error: 'No company assigned to your account' });
      }
      whereClause.companyID = user.companyId;
    }
    
    // Search in fullName and phoneNumber fields
    if (search && typeof search === 'string') {
      const searchTerm = search.trim();
      if (searchTerm) {
        whereClause.OR = [
          {
            fullName: {
              contains: searchTerm,
              mode: 'insensitive'
            }
          },
          {
            phoneNumber: {
              contains: searchTerm,
              mode: 'insensitive'
            }
          }
        ];
      }
    }
    
    // Filter by lead status (exact match)
    if (status && typeof status === 'string' && status !== 'all') {
      whereClause.leadStatus = status;
    }
    
    // Filter by city (exact match)
    if (city && typeof city === 'string' && city !== 'all') {
      whereClause.city = city;
    }
    
    // Filter by source (exact match)
    if (source && typeof source === 'string' && source !== 'all') {
      whereClause.source = source;
    }
    
    // Filter by companyID (exact match) - only for super roles
    if (companyID && typeof companyID === 'string' && companyID !== 'all') {
      const companyIdNum = parseInt(companyID, 10);
      if (!isNaN(companyIdNum)) {
        // Super roles can filter by any company, company roles are already restricted above
        if ([UserRole.SUPER_ADMIN, UserRole.SUPER_VIEWER, UserRole.SUPER_CREATOR].includes(user.role)) {
          whereClause.companyID = companyIdNum;
        }
      }
    }
    
    // Filter by createdAt date range
    if (createdAtFrom || createdAtTo) {
      whereClause.createdAt = {};
      if (createdAtFrom && typeof createdAtFrom === 'string') {
        const fromDate = new Date(createdAtFrom);
        if (!isNaN(fromDate.getTime())) {
          whereClause.createdAt.gte = fromDate;
        }
      }
      if (createdAtTo && typeof createdAtTo === 'string') {
        const toDate = new Date(createdAtTo);
        if (!isNaN(toDate.getTime())) {
          // Set to end of day
          toDate.setHours(23, 59, 59, 999);
          whereClause.createdAt.lte = toDate;
        }
      }
    }
    
    // Filter by updatedAt date range
    if (updatedAtFrom || updatedAtTo) {
      whereClause.updatedAt = {};
      if (updatedAtFrom && typeof updatedAtFrom === 'string') {
        const fromDate = new Date(updatedAtFrom);
        if (!isNaN(fromDate.getTime())) {
          whereClause.updatedAt.gte = fromDate;
        }
      }
      if (updatedAtTo && typeof updatedAtTo === 'string') {
        const toDate = new Date(updatedAtTo);
        if (!isNaN(toDate.getTime())) {
          // Set to end of day
          toDate.setHours(23, 59, 59, 999);
          whereClause.updatedAt.lte = toDate;
        }
      }
    }
    
    // Get total count for pagination metadata
    const total = await prisma.investorAdmin.count({ where: whereClause });
    
    // Get paginated leads
    const leads = await prisma.investorAdmin.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limitNum,
      select: {
        id: true,
        fullName: true,
        phoneNumber: true,
        city: true,
        source: true,
        createdAt: true,
        updatedAt: true,
        emailSentToAdmin: true,
        emailSentToInvestor: true,
        notes: true,
        callingTimes: true,
        leadStatus: true,
        originalInvestorId: true,
        investmentAmount: true,
        calculatedTotal: true,
        sharesQuantity: true,
        companyID: true,
        msgDate: true,
        company: {
          select: {
            name: true
          }
        },
        createdByUser: {
          select: {
            id: true,
            username: true
          }
        },
        updatedByUser: {
          select: {
            id: true,
            username: true
          }
        }
      }
    });
    
    // Calculate total pages
    const totalPages = Math.ceil(total / limitNum);
    
    res.status(200).json({ 
      success: true, 
      data: leads,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages,
        hasNextPage: pageNum < totalPages,
        hasPreviousPage: pageNum > 1
      }
    });
  } catch (error) {
    next(error);
  }
});

// @ts-expect-error: Suppress Express 5 type error
router.post('/', jwtAuth, requireRole(ROLES_THAT_CAN_CREATE), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const user = req.user!;
    
    // Sanitize input
    const sanitized = Object.fromEntries(
      Object.entries(req.body).map(([k, v]) => [k, typeof v === 'string' ? xss(v) : v])
    );
    
    let parsed = investorAdminCreateSchema.parse(sanitized);
    
    // Validate msgDate is required for creators
    if ([UserRole.SUPER_CREATOR, UserRole.COMPANY_CREATOR].includes(user.role)) {
      if (!parsed.msgDate) {
        res.status(400).json({ 
          success: false, 
          error: 'msgDate is required for creator roles' 
        });
        return;
      }
    }
    
    // IMPORTANT: Company creators can only create leads for their company
    if ([UserRole.COMPANY_ADMIN, UserRole.COMPANY_CREATOR].includes(user.role)) {
      if (!user.companyId) {
        res.status(403).json({ success: false, error: 'No company assigned to your account' });
        return;
      }
      
      // Check if user is trying to create for a different company
      if (parsed.companyID && parsed.companyID !== user.companyId) {
        res.status(403).json({ 
          success: false, 
          error: `Access denied. You can only create leads for company ID ${user.companyId}, but you tried to create for company ID ${parsed.companyID}` 
        });
        return;
      }
      
      // Force the companyID to be user's company (override any provided value)
      parsed.companyID = user.companyId;
    }
    
      // Check for unique phone number
    const existingLead = await prisma.investorAdmin.findFirst({
      where: { phoneNumber: parsed.phoneNumber }
    });
    if (existingLead) {
      res.status(409).json({ success: false, error: 'Phone number already exists for another lead.' });
      return;
    }


    const lead = await prisma.investorAdmin.create({ 
      data: {
        ...parsed,
        createdBy: user.userId,  // Track who created this
        // updatedBy: Leave as null - not updated yet
      },
      select: {
        id: true,
        fullName: true,
        phoneNumber: true,
        city: true,
        source: true,
        createdAt: true,
        updatedAt: true,
        emailSentToAdmin: true,
        emailSentToInvestor: true,
        notes: true,
        callingTimes: true,
        leadStatus: true,
        originalInvestorId: true,
        investmentAmount: true,
        calculatedTotal: true,
        sharesQuantity: true,
        companyID: true,
        msgDate: true,
        company: {
          select: {
            name: true
          }
        },
        createdByUser: {
          select: {
            id: true,
            username: true
          }
        },
        updatedByUser: {
          select: {
            id: true,
            username: true
          }
        }
      }
    });
    res.status(201).json({ success: true, data: lead });
    
  } catch (err: any) {
    if (err.name === 'ZodError') {
      res.status(400).json({ success: false, error: 'Validation failed', details: err.errors });
      return;
    }
    next(err);
  }
});

// @ts-expect-error: Suppress Express 5 type error
router.put('/:id', jwtAuth, requireRole(ROLES_THAT_CAN_UPDATE), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const user = req.user!;
    const { id } = req.params;
    const numericId = parseInt(id, 10);
    
    if (isNaN(numericId)) {
      res.status(400).json({ success: false, error: 'Invalid ID format' });
      return;
    }
    
    // Check if lead exists and get all fields for comparison
    const existingLead = await prisma.investorAdmin.findUnique({ 
      where: { id: numericId },
      select: { 
        updatedBy: true, 
        companyID: true,
        fullName: true,
        phoneNumber: true,
        city: true,
        source: true,
        emailSentToAdmin: true,
        emailSentToInvestor: true,
        notes: true,
        callingTimes: true,
        leadStatus: true,
        originalInvestorId: true,
        investmentAmount: true,
        calculatedTotal: true,
        sharesQuantity: true,
        msgDate: true
      }
    });
    
    if (!existingLead) {
      res.status(404).json({ success: false, error: 'Lead not found' });
      return;
    }
    
    // Company admins can only update leads from their company
    if (user.role === UserRole.COMPANY_ADMIN && user.companyId) {
      if (existingLead.companyID !== user.companyId) {
        res.status(403).json({ success: false, error: 'Access denied to this lead' });
        return;
      }
    }
    
    // Sanitize input
    const sanitized = Object.fromEntries(
      Object.entries(req.body).map(([k, v]) => [k, typeof v === 'string' ? xss(v) : v])
    );
    
    const parsed = investorAdminUpdateSchema.parse(sanitized);
    
    // Check if there are any actual changes before proceeding
    // This prevents storing empty updates in ActivityLog
    const updatableFields = [
      'fullName', 'phoneNumber', 'city', 'source', 'emailSentToAdmin',
      'emailSentToInvestor', 'notes', 'callingTimes', 'leadStatus',
      'originalInvestorId', 'investmentAmount', 'calculatedTotal',
      'sharesQuantity', 'msgDate'
    ];
    
    let hasChanges = false;
    for (const field of updatableFields) {
      if (field in parsed) {
        const newValue = parsed[field as keyof typeof parsed];
        const oldValue = existingLead[field as keyof typeof existingLead];
        
        // Check if value actually changed
        const changed = 
          newValue !== oldValue && 
          !(newValue == null && oldValue == null) &&
          JSON.stringify(newValue) !== JSON.stringify(oldValue);
        
        if (changed) {
          hasChanges = true;
          break;
        }
      }
    }
    
    // Reject if no changes detected
    if (!hasChanges) {
      res.status(400).json({ 
        success: false, 
        error: 'No changes detected. Please update at least one field before submitting.' 
      });
      return;
    }
    
    // Always set updatedBy to track the last user who updated this
    const updateData: any = { ...parsed };
    updateData.updatedBy = user.userId;  // Track who last updated this
    
    const lead = await prisma.investorAdmin.update({ 
      where: { id: numericId }, 
      data: updateData,
      select: {
        id: true,
        fullName: true,
        phoneNumber: true,
        city: true,
        source: true,
        createdAt: true,
        updatedAt: true,
        emailSentToAdmin: true,
        emailSentToInvestor: true,
        notes: true,
        callingTimes: true,
        leadStatus: true,
        originalInvestorId: true,
        investmentAmount: true,
        calculatedTotal: true,
        sharesQuantity: true,
        companyID: true,
        msgDate: true,
        company: {
          select: {
            name: true
          }
        },
        createdByUser: {
          select: {
            id: true,
            username: true
          }
        },
        updatedByUser: {
          select: {
            id: true,
            username: true
          }
        }
      }
    });
    res.status(200).json({ success: true, data: lead });
    
  } catch (err: any) {
    if (err.name === 'ZodError') {
      res.status(400).json({ success: false, error: 'Validation failed', details: err.errors });
      return;
    }
    if (err.code === 'P2025') {
      res.status(404).json({ success: false, error: 'Lead not found' });
      return;
    }
    next(err);
  }
});

// @ts-expect-error: Suppress Express 5 type error
router.post('/transfer/:investorId', jwtAuth, requireRole(ROLES_THAT_CAN_CREATE), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const user = req.user!;
    const { investorId } = req.params;
    const notes = req.body.notes ? xss(req.body.notes) : undefined;
    const msgDate = req.body.msgDate ? new Date(req.body.msgDate) : undefined;

    // Validate msgDate is required for creators
    if ([UserRole.SUPER_CREATOR, UserRole.COMPANY_CREATOR].includes(user.role)) {
      if (!msgDate) {
        res.status(400).json({ 
          success: false, 
          error: 'msgDate is required for creator roles' 
        });
        return;
      }
    }

    const investor = await prisma.investor.findUnique({ where: { id: investorId } });
    if (!investor) {
      res.status(404).json({ success: false, error: 'Investor not found' });
      return;
    }
    
    // Company users can only transfer investors from their company
    if ([UserRole.COMPANY_ADMIN, UserRole.COMPANY_CREATOR].includes(user.role)) {
      if (!user.companyId || investor.companyID !== user.companyId) {
        res.status(403).json({ success: false, error: 'Access denied to this investor' });
        return;
      }
    }

    const existing = await prisma.investorAdmin.findFirst({ where: { originalInvestorId: investorId } });
    if (existing) {
      res.status(409).json({ success: false, error: 'Investor already transferred' });
      return;
    }

    // Create the admin lead AND update the investor's transferred status
    const [adminLead] = await prisma.$transaction([
      prisma.investorAdmin.create({
        data: {
          fullName: investor.fullName,
          phoneNumber: investor.phoneNumber,
          companyID: investor.companyID,
          sharesQuantity: investor.sharesQuantity,
          calculatedTotal: investor.calculatedTotal,
          city: investor.city,
          source: investor.source,
          createdAt: new Date(),
          updatedAt: new Date(),
          emailSentToAdmin: false,
          emailSentToInvestor: false,
          notes,
          callingTimes: 0,
          leadStatus: 'new',
          originalInvestorId: investor.id,
          msgDate,
          createdBy: user.userId,  // Track who transferred/created this
          // updatedBy: Leave as null - not updated yet
        },
        select: {
          id: true,
          fullName: true,
          phoneNumber: true,
          city: true,
          source: true,
          createdAt: true,
          updatedAt: true,
          emailSentToAdmin: true,
          emailSentToInvestor: true,
          notes: true,
          callingTimes: true,
          leadStatus: true,
          originalInvestorId: true,
          investmentAmount: true,
          calculatedTotal: true,
          sharesQuantity: true,
          companyID: true,
          msgDate: true,
          company: {
            select: {
              name: true
            }
          },
          createdByUser: {
            select: {
              id: true,
              username: true
            }
          },
          updatedByUser: {
            select: {
              id: true,
              username: true
            }
          }
        }
      }),
      prisma.investor.update({
        where: { id: investorId },
        data: { transferred: true }
      })
    ]);

    res.status(201).json({ success: true, data: adminLead });
  } catch (error) {
    next(error);
  }
});

// @ts-expect-error: Suppress Express 5 type error
router.get('/:id/history', jwtAuth, requireRole(ROLES_THAT_CAN_READ), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const user = req.user!;
    const { id } = req.params;
    const numericId = parseInt(id, 10);
    
    if (isNaN(numericId)) {
      res.status(400).json({ success: false, error: 'Invalid ID format' });
      return;
    }
    
    // Get the InvestorAdmin record
    const lead = await prisma.investorAdmin.findUnique({
      where: { id: numericId },
      select: {
        id: true,
        fullName: true,
        phoneNumber: true,
        createdAt: true,
        companyID: true,
        createdBy: true,
        createdByUser: {
          select: {
            id: true,
            username: true
          }
        }
      }
    });
    
    if (!lead) {
      res.status(404).json({ success: false, error: 'Lead not found' });
      return;
    }
    
    // Company-specific access control
    if ([UserRole.COMPANY_ADMIN, UserRole.COMPANY_VIEWER, UserRole.COMPANY_CREATOR].includes(user.role)) {
      if (!user.companyId || lead.companyID !== user.companyId) {
        res.status(403).json({ success: false, error: 'Access denied to this lead' });
        return;
      }
    }
    
    // Get creation record - match existing API naming conventions
    const creationRecord = {
      action: 'CREATE' as const,
      createdAt: lead.createdAt,
      createdByUser: lead.createdByUser,
      changes: {
        fullName: lead.fullName,
        phoneNumber: lead.phoneNumber
      }
    };
    
    // Get all update history from ActivityLog
    // requestBody contains all fields that were updated: leadStatus, notes, investmentAmount, etc.
    const updateHistory = await prisma.activityLog.findMany({
      where: {
        resourceType: 'InvestorAdmin',
        resourceId: String(numericId),
        action: 'UPDATE'
      },
      orderBy: {
        createdAt: 'asc'
      },
      select: {
        id: true,
        username: true,
        userRole: true,
        createdAt: true,
        requestBody: true,  // Contains all updated fields including notes, leadStatus, investmentAmount, etc.
        user: {
          select: {
            id: true,
            username: true
          }
        }
      }
    });
    
    // Format update history - match existing API naming conventions
    const formattedUpdates = updateHistory.map(update => ({
      action: 'UPDATE' as const,
      updatedAt: update.createdAt,
      updatedByUser: {
        id: update.user?.id || null,
        username: update.username
      },
      userRole: update.userRole,
      changes: update.requestBody as any  // This includes all fields: leadStatus, notes, investmentAmount, etc.
    }));
    
    // Combine creation and updates
    const history = [creationRecord, ...formattedUpdates];
    
    res.status(200).json({
      success: true,
      data: {
        id: lead.id,
        fullName: lead.fullName,
        history: history,
        totalUpdates: formattedUpdates.length
      }
    });
    
  } catch (error) {
    next(error);
  }
});

// @ts-expect-error: Suppress Express 5 type error
router.get('/statistics', jwtAuth, requireRole(ROLES_THAT_CAN_READ), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const user = req.user!;
    
    let whereClause = {};
    
    // Company-specific roles can only see their company's statistics
    if ([UserRole.COMPANY_ADMIN, UserRole.COMPANY_VIEWER, UserRole.COMPANY_CREATOR].includes(user.role)) {
      if (!user.companyId) {
        return res.status(403).json({ success: false, error: 'No company assigned to your account' });
      }
      whereClause = { companyID: user.companyId };
    }
    
    const stats = await prisma.investorAdmin.aggregate({
      where: whereClause,
      _max: { investmentAmount: true },
      _min: { investmentAmount: true },
      _avg: { investmentAmount: true },
      _sum: { investmentAmount: true },
      _count: { investmentAmount: true },
    });
    
    res.status(200).json({ success: true, data: stats });
  } catch (err) {
    next(err);
  }
});

export default router; 