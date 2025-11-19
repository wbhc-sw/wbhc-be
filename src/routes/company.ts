import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../services/database';
import { 
  jwtAuth, 
  requireRole, 
  requireCompanyAccess,
  ROLES_THAT_CAN_READ,
  ROLES_THAT_CAN_CREATE,
  ROLES_THAT_CAN_UPDATE,
  ROLES_THAT_CAN_DELETE,
  AuthRequest 
} from '../middleware/roleAuth';
import { UserRole } from '../types/investor';
import { companyCreateSchema, companyUpdateSchema } from '../middleware/validation';
import xss from 'xss';

const router = Router();

// Only SUPER roles should be able to create companies
const COMPANY_CREATE_ROLES = [UserRole.SUPER_ADMIN, UserRole.SUPER_CREATOR];

// Specific roles that can read companies (including SUPER_CREATOR)
const COMPANY_READ_ROLES = [
  UserRole.SUPER_ADMIN,
  UserRole.COMPANY_ADMIN,
  UserRole.SUPER_VIEWER,
  UserRole.COMPANY_VIEWER,
  UserRole.SUPER_CREATOR
];

// @ts-expect-error: Suppress Express 5 type error
router.get('/', jwtAuth, requireRole(COMPANY_READ_ROLES), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const user = req.user!;
    
    let whereClause = {};
    
    // Company-specific roles can only see their company
    if ([UserRole.COMPANY_ADMIN, UserRole.COMPANY_VIEWER, UserRole.COMPANY_CREATOR].includes(user.role)) {
      if (!user.companyId) {
        res.status(403).json({ success: false, error: 'No company assigned to your account' });
        return;
      }
      whereClause = { companyID: user.companyId };
    }
    
    const companies = await prisma.company.findMany({
      where: whereClause,
      select: {
        companyID: true,
        name: true,
        description: true,
        phoneNumber: true,
        url: true,
        createdAt: true,
        updatedAt: true,
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
      },
      orderBy: { createdAt: 'desc' }
    });
    
    res.status(200).json({ success: true, data: companies });
  } catch (err) {
    next(err);
  }
});

// @ts-expect-error: Suppress Express 5 type error
router.get('/:companyID', jwtAuth, requireRole(COMPANY_READ_ROLES), requireCompanyAccess, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { companyID } = req.params;
    const companyId = parseInt(companyID, 10);
    
    if (isNaN(companyId)) {
      res.status(400).json({ success: false, error: 'Invalid company ID' });
      return;
    }
    
    const company = await prisma.company.findUnique({
      where: { companyID: companyId },
      select: {
        companyID: true,
        name: true,
        description: true,
        phoneNumber: true,
        url: true,
        createdAt: true,
        updatedAt: true,
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
    
    if (!company) {
      res.status(404).json({ success: false, error: 'Company not found' });
      return;
    }
    
    res.status(200).json({ success: true, data: company });
  } catch (err) {
    next(err);
  }
});

// @ts-expect-error: Suppress Express 5 type error
router.post('/', jwtAuth, requireRole(COMPANY_CREATE_ROLES), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const user = req.user!;
    
    // Sanitize input
    const sanitized = Object.fromEntries(
      Object.entries(req.body).map(([k, v]) => [k, typeof v === 'string' ? xss(v) : v])
    );
    
    const parsed = companyCreateSchema.parse(sanitized);
    
    // IMPORTANT: Company creators should not be able to create new companies
    // They should only be able to work within their assigned company
    if ([UserRole.COMPANY_ADMIN, UserRole.COMPANY_CREATOR].includes(user.role)) {
      res.status(403).json({ 
        success: false, 
        error: 'Company-specific users cannot create new companies. Only SUPER_ADMIN and SUPER_CREATOR can create companies.' 
      });
      return;
    }
    
    const company = await prisma.company.create({
      data: {
        ...parsed,
        createdBy: user.userId  // Track who created this company
        // updatedBy: Leave as null - not updated yet
      },
      select: {
        companyID: true,
        name: true,
        description: true,
        phoneNumber: true,
        url: true,
        createdAt: true,
        updatedAt: true,
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

// @ts-expect-error: Suppress Express 5 type error
router.put('/:companyID', jwtAuth, requireRole(ROLES_THAT_CAN_UPDATE), requireCompanyAccess, async (req: AuthRequest, res: Response, next: NextFunction) => {
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
      data: {
        ...parsed,
        updatedBy: req.user!.userId  // Track who updated this company
      },
      select: {
        companyID: true,
        name: true,
        description: true,
        phoneNumber: true,
        url: true,
        createdAt: true,
        updatedAt: true,
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

// @ts-expect-error: Suppress Express 5 type error
router.delete('/:companyID', jwtAuth, requireRole(ROLES_THAT_CAN_DELETE), requireCompanyAccess, async (req: AuthRequest, res: Response, next: NextFunction) => {
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
