import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../services/database';
import { jwtAuth } from '../middleware/jwtAuth';
import { investorAdminCreateSchema, investorAdminUpdateSchema } from '../middleware/validation';
import { InvestorAdmin } from '../types/investor';
import xss from 'xss';
// import { InvestorAdmin as PrismaInvestorAdmin, Investor as PrismaInvestor } from '@prisma/client';

const router = Router();

// GET /api/admin/investor-admin - Retrieve all admin leads with filtering
router.get('/', jwtAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { search, status, city, companyID } = req.query;
    
    // Build the where clause for filtering
    const whereClause: any = {};
    
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
    
    // Filter by companyID (exact match)
    if (companyID && typeof companyID === 'string' && companyID !== 'all') {
      const companyIdNum = parseInt(companyID, 10);
      if (!isNaN(companyIdNum)) {
        whereClause.companyID = companyIdNum;
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

// POST /api/admin/investor-admin - Create new admin lead
router.post('/', jwtAuth, (req: Request, res: Response, next: NextFunction) => {
  // Sanitize input
  const sanitized = Object.fromEntries(
    Object.entries(req.body).map(([k, v]) => [k, typeof v === 'string' ? xss(v) : v])
  );
  let parsed;
  try {
    parsed = investorAdminCreateSchema.parse(sanitized);
  } catch (err: any) {
    if (err.name === 'ZodError') {
      res.status(400).json({ success: false, error: 'Validation failed', details: err.errors });
      return;
    }
    return next(err);
  }
  prisma.investorAdmin.create({ data: parsed })
    .then((lead: InvestorAdmin) => res.status(201).json({ success: true, data: lead }))
    .catch(next);
});

// PUT /api/admin/investor-admin/:id - Update existing admin lead
router.put('/:id', jwtAuth, (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params;
  const numericId = parseInt(id, 10);
  
  if (isNaN(numericId)) {
    res.status(400).json({ success: false, error: 'Invalid ID format' });
    return;
  }
  
  // Sanitize input
  const sanitized = Object.fromEntries(
    Object.entries(req.body).map(([k, v]) => [k, typeof v === 'string' ? xss(v) : v])
  );
  let parsed;
  try {
    parsed = investorAdminUpdateSchema.parse(sanitized);
  } catch (err: any) {
    if (err.name === 'ZodError') {
      res.status(400).json({ success: false, error: 'Validation failed', details: err.errors });
      return;
    }
    return next(err);
  }
  prisma.investorAdmin.update({ where: { id: numericId }, data: parsed })
    .then((lead: InvestorAdmin) => res.status(200).json({ success: true, data: lead }))
    .catch(next);
});

// POST /api/admin/investor-admin/transfer/:investorId
router.post('/transfer/:investorId', jwtAuth, async (req: Request, res: Response, next: NextFunction) => {
  const { investorId } = req.params;
  const notes = req.body.notes ? xss(req.body.notes) : undefined;

  try {
    const investor = await prisma.investor.findUnique({ where: { id: investorId } });
    if (!investor) {
      res.status(404).json({ success: false, error: 'Investor not found' });
      return;
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
          originalInvestorId: investor.id, // This stays as string since Investor.id is still string
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

// GET /api/admin/investor-admin/statistics - Get investment amount statistics
router.get('/statistics', jwtAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const stats = await prisma.investorAdmin.aggregate({
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