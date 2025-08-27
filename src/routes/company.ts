import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../services/database';
import { jwtAuth } from '../middleware/jwtAuth';
import { companyCreateSchema, companyUpdateSchema } from '../middleware/validation';
import xss from 'xss';

const router = Router();

// GET /api/admin/company - Retrieve all companies
router.get('/', jwtAuth, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const companies = await prisma.company.findMany({
      orderBy: { createdAt: 'desc' }
    });
    res.status(200).json({ success: true, data: companies });
  } catch (err) {
    next(err);
  }
});

// GET /api/admin/company/:companyID - Get company by ID
router.get('/:companyID', jwtAuth, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { companyID } = req.params;
    const companyId = parseInt(companyID, 10);
    
    if (isNaN(companyId)) {
      res.status(400).json({ success: false, error: 'Invalid company ID' });
      return;
    }
    
    const company = await prisma.company.findUnique({
      where: { companyID: companyId }
    });
    
    if (!company) {
      res.status(404).json({ success: false, error: 'Company not found' });
      return;
    }
    
    res.status(200).json({ success: true, data: company });
  } catch (err) {
    next(err);
  }
});

// POST /api/admin/company - Create new company (admin only)
router.post('/', jwtAuth, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Sanitize input
    const sanitized = Object.fromEntries(
      Object.entries(req.body).map(([k, v]) => [k, typeof v === 'string' ? xss(v) : v])
    );
    
    const parsed = companyCreateSchema.parse(sanitized);
    
    const company = await prisma.company.create({
      data: parsed
    });
    
    res.status(201).json({ success: true, data: company });
  } catch (err: any) {
    if (err.name === 'ZodError') {
      res.status(400).json({ 
        success: false, 
        error: 'Validation failed', 
        details: err.errors 
      });
      return;
    }
    next(err);
  }
});

// PUT /api/admin/company/:companyID - Update company
router.put('/:companyID', jwtAuth, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { companyID } = req.params;
    const companyId = parseInt(companyID, 10);
    
    if (isNaN(companyId)) {
      res.status(400).json({ success: false, error: 'Invalid company ID' });
      return;
    }
    
    // Sanitize input
    const sanitized = Object.fromEntries(
      Object.entries(req.body).map(([k, v]) => [k, typeof v === 'string' ? xss(v) : v])
    );
    
    const parsed = companyUpdateSchema.parse(sanitized);
    
    const company = await prisma.company.update({
      where: { companyID: companyId },
      data: parsed
    });
    
    res.status(200).json({ success: true, data: company });
  } catch (err: any) {
    if (err.name === 'ZodError') {
      res.status(400).json({ 
        success: false, 
        error: 'Validation failed', 
        details: err.errors 
      });
      return;
    }
    if (err.code === 'P2025') {
      res.status(404).json({ success: false, error: 'Company not found' });
      return;
    }
    next(err);
  }
});

// DELETE /api/admin/company/:companyID - Delete company
router.delete('/:companyID', jwtAuth, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { companyID } = req.params;
    const companyId = parseInt(companyID, 10);
    
    if (isNaN(companyId)) {
      res.status(400).json({ success: false, error: 'Invalid company ID' });
      return;
    }
    
    const company = await prisma.company.delete({
      where: { companyID: companyId }
    });
    
    res.status(200).json({ success: true, data: company });
  } catch (err: any) {
    if (err.code === 'P2025') {
      res.status(404).json({ success: false, error: 'Company not found' });
      return;
    }
    next(err);
  }
});

export default router;
