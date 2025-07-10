import { Router, Request, Response, NextFunction } from 'express';
import { investorSchema } from '../middleware/validation';
import { prisma } from '../services/database';
import { sendAdminNotification } from '../services/email';
import xss from 'xss';
// import { INVESTMENT_PACKAGES } from '../utils/constants';
import { jwtAuth } from '../middleware/jwtAuth';

const router = Router();

// console.log('Allowed investment packages:', INVESTMENT_PACKAGES);

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
        investmentPackage: parsed.investmentPackage,
        city: parsed.city,
      },
    });

    // --- Email features temporarily disabled ---
    await sendAdminNotification(investor);
    // await sendInvestorConfirmation(investor);
    await prisma.investor.update({
      where: { id: investor.id },
      data: { emailSentToAdmin: true, emailSentToInvestor: true },
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

// GET / - Return all investor submissions (private, admin only)
router.get('/', jwtAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const investors = await prisma.investor.findMany({
      orderBy: { createdAt: 'desc' },
    });
    res.status(200).json({ success: true, data: investors });
  } catch (err) {
    next(err);
  }
});

export default router; 