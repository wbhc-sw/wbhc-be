import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../services/database';
import { jwtAuth } from '../middleware/jwtAuth';
import { investorAdminCreateSchema, investorAdminUpdateSchema } from '../middleware/validation';
import { InvestorAdmin } from '../types/investor';
import xss from 'xss';
// import { InvestorAdmin as PrismaInvestorAdmin, Investor as PrismaInvestor } from '@prisma/client';

const router = Router();

// GET /api/admin/investor-admin - Retrieve all admin leads
router.get('/', jwtAuth, (req: Request, res: Response, next: NextFunction) => {
  prisma.investorAdmin.findMany({ orderBy: { createdAt: 'desc' } })
    .then((leads: InvestorAdmin[]) => res.status(200).json({ success: true, data: leads }))
    .catch(next);
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
  prisma.investorAdmin.update({ where: { id }, data: parsed })
    .then((lead: InvestorAdmin) => res.status(200).json({ success: true, data: lead }))
    .catch(next);
});

// POST /api/admin/investor-admin/transfer/:investorId
router.post('/transfer/:investorId', jwtAuth, (req: Request, res: Response, next: NextFunction) => {
  const { investorId } = req.params;
  const notes = req.body.notes ? xss(req.body.notes) : undefined;

  prisma.investor.findUnique({ where: { id: investorId } })
    .then(investor => {
      if (!investor) {
        res.status(404).json({ success: false, error: 'Investor not found' });
        return;
      }
      return prisma.investorAdmin.findFirst({ where: { originalInvestorId: investorId } })
        .then(existing => {
          if (existing) {
            res.status(409).json({ success: false, error: 'Investor already transferred' });
            return;
          }
          return prisma.investorAdmin.create({
            data: {
              fullName: investor.fullName,
              phoneNumber: investor.phoneNumber,
              company: investor.company,
              sharesQuantity: investor.sharesQuantity,
              calculatedTotal: investor.calculatedTotal,
              city: investor.city,
              submissionStatus: investor.submissionStatus,
              createdAt: new Date(),
              updatedAt: new Date(),
              emailSentToAdmin: false,
              emailSentToInvestor: false,
              notes,
              callingTimes: 0,
              leadStatus: 'new',
              originalInvestorId: investor.id,
            }
          }).then(adminLead => {
            res.status(201).json({ success: true, data: adminLead });
          });
        });
    })
    .catch(next);
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