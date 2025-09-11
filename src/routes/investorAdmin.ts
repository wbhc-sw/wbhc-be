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
    const { search, status, city, companyID } = req.query;
    
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
    
    const leads = await prisma.investorAdmin.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      include: {
        company: {
          select: {
            name: true
          }
        }
      }
    });
    
    res.status(200).json({ success: true, data: leads });
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
    
    const lead = await prisma.investorAdmin.create({ data: parsed });
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
    
    // Company admins can only update leads from their company
    if (user.role === UserRole.COMPANY_ADMIN && user.companyId) {
      // First check if the lead belongs to their company
      const existingLead = await prisma.investorAdmin.findUnique({ where: { id: numericId } });
      if (!existingLead) {
        res.status(404).json({ success: false, error: 'Lead not found' });
        return;
      }
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
    
    const lead = await prisma.investorAdmin.update({ where: { id: numericId }, data: parsed });
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