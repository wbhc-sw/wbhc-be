import { Router, Request, Response, NextFunction } from 'express';
import { investorSchema } from '../middleware/validation';
import { prisma } from '../services/database';
import { sendAdminNotification } from '../services/email';
import xss from 'xss';
import { 
  jwtAuth, 
  requireRole,
  ROLES_THAT_CAN_READ,
  AuthRequest 
} from '../middleware/roleAuth';
import { UserRole } from '../types/investor';

const router = Router();

// @ts-expect-error: Suppress Express 5 type error
router.post('/', async (req, res, next) => {
  try {
    // Sanitize input
    const sanitized = Object.fromEntries(
      Object.entries(req.body).map(([k, v]) => [k, typeof v === 'string' ? xss(v) : v])
    );

    // Validate input
    const parsed = investorSchema.parse(sanitized);

    // Save to DB
    const investor = await prisma.investor.create({
      data: {
        fullName: parsed.fullName,
        phoneNumber: parsed.phoneNumber,
        companyID: parsed.companyID,
        sharesQuantity: parsed.sharesQuantity,
        calculatedTotal: parsed.calculatedTotal,
        city: parsed.city,
      },
    });

    // Send admin notification
    await sendAdminNotification(investor);
    
    // Update email tracking - only admin email was sent
    await prisma.investor.update({
      where: { id: investor.id },
      data: { emailSentToAdmin: true, emailSentToInvestor: false },
    });

    res.status(201).json({
      success: true,
      message: 'Submission received',
      data: { id: investor.id, createdAt: investor.createdAt },
    });
  } catch (err: any) {
    if (err.name === 'ZodError') {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: err.errors,
      });
    }
    next(err);
  }
});

// @ts-expect-error: Suppress Express 5 type error
router.get('/', jwtAuth, requireRole(ROLES_THAT_CAN_READ), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const user = req.user!;
    
    let whereClause = {};
    
    // Company-specific roles can only see their company's investors
    if ([UserRole.COMPANY_ADMIN, UserRole.COMPANY_VIEWER, UserRole.COMPANY_CREATOR].includes(user.role)) {
      if (!user.companyId) {
        return res.status(403).json({ success: false, error: 'No company assigned to your account' });
      }
      whereClause = { companyID: user.companyId };
    }
    
    const investors = await prisma.investor.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      include: {
        company: {
          select: {
            companyID: true,
            name: true
          }
        }
      }
    });
    
    res.status(200).json({ success: true, data: investors });
  } catch (err) {
    next(err);
  }
});

export default router; 