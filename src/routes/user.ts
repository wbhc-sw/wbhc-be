import { Router, Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../services/database';
import { jwtAuth, requireRole, AuthRequest } from '../middleware/roleAuth';
import { UserRole, CreateUserRequest, UpdateUserRequest, LoginRequest } from '../types/investor';
import { z } from 'zod';
import xss from 'xss';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET as string;
const JWT_EXPIRES_IN = '24h';

// Validation schemas
const createUserSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters'),
  email: z.string().email('Invalid email format'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum([
    UserRole.SUPER_ADMIN,
    UserRole.COMPANY_ADMIN,
    UserRole.SUPER_VIEWER,
    UserRole.COMPANY_VIEWER,
    UserRole.SUPER_CREATOR,
    UserRole.COMPANY_CREATOR
  ]),
  companyId: z.number().int().positive().optional()
});

const updateUserSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters').optional(),
  email: z.string().email('Invalid email format').optional(),
  password: z.string().min(6, 'Password must be at least 6 characters').optional(),
  role: z.enum([
    UserRole.SUPER_ADMIN,
    UserRole.COMPANY_ADMIN,
    UserRole.SUPER_VIEWER,
    UserRole.COMPANY_VIEWER,
    UserRole.SUPER_CREATOR,
    UserRole.COMPANY_CREATOR
  ]).optional(),
  companyId: z.number().int().positive().optional(),
  isActive: z.boolean().optional()
});

const loginSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required')
});

// @ts-expect-error: Suppress Express 5 type error
router.post('/login', async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Sanitize input
    const sanitized = Object.fromEntries(
      Object.entries(req.body).map(([k, v]) => [k, typeof v === 'string' ? xss(v) : v])
    );
    
    const { username, password } = loginSchema.parse(sanitized);
    
    // First, try the new database user system
    const user = await prisma.user.findUnique({
      where: { username },
      include: { company: true }
    });
    
    if (user && user.isActive) {
      const validPassword = await bcrypt.compare(password, user.passwordHash);
      if (validPassword) {
        const token = jwt.sign({
          userId: user.id,
          username: user.username,
          email: user.email,
          role: user.role as UserRole,
          companyId: user.companyId
        }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
        
        // Set JWT as HttpOnly cookie
        res.cookie('admin_jwt', token, {
          httpOnly: true,
          secure: true,
          sameSite: 'lax',
          path: '/',
          maxAge: 24 * 60 * 60 * 1000, // 24 hours
        });
        
        return res.status(200).json({
          success: true,
          user: {
            id: user.id,
            username: user.username,
            email: user.email,
            role: user.role,
            companyId: user.companyId,
            company: user.company
          }
        });
      }
    }
    
    // Fallback to legacy admin credentials (for backward compatibility)
    const ADMIN_USERNAME = process.env.ADMIN_USERNAME;
    const ADMIN_PASSWORD_HASH = process.env.ADMIN_PASSWORD_HASH;
    
    if (ADMIN_USERNAME && ADMIN_PASSWORD_HASH && username === ADMIN_USERNAME) {
      const validLegacyPassword = await bcrypt.compare(password, ADMIN_PASSWORD_HASH);
      if (validLegacyPassword) {
        const token = jwt.sign({
          userId: 'legacy-admin',
          username: ADMIN_USERNAME,
          email: 'admin@legacy.com',
          role: UserRole.SUPER_ADMIN,
          companyId: undefined
        }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
        
        res.cookie('admin_jwt', token, {
          httpOnly: true,
          secure: true,
          sameSite: 'lax',
          path: '/',
          maxAge: 24 * 60 * 60 * 1000,
        });
        
        return res.status(200).json({
          success: true,
          user: {
            id: 'legacy-admin',
            username: ADMIN_USERNAME,
            email: 'admin@legacy.com',
            role: UserRole.SUPER_ADMIN,
            isLegacy: true
          }
        });
      }
    }
    
    return res.status(401).json({ success: false, error: 'Invalid credentials' });
    
  } catch (err: any) {
    if (err.name === 'ZodError') {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: err.errors
      });
    }
    next(err);
  }
});

// POST /api/admin/users/logout - Logout (no @ts-expect-error needed)
router.post('/logout', (req: Request, res: Response) => {
  res.cookie('admin_jwt', '', {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/',
    expires: new Date(0),
  });
  res.json({ success: true });
});

// @ts-expect-error: Suppress Express 5 type error
router.get('/', jwtAuth, requireRole([UserRole.SUPER_ADMIN, UserRole.SUPER_VIEWER]), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        companyId: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        company: {
          select: {
            companyID: true,
            name: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    
    res.status(200).json({ success: true, data: users });
  } catch (err) {
    next(err);
  }
});

// @ts-expect-error: Suppress Express 5 type error
router.get('/:id', jwtAuth, requireRole([UserRole.SUPER_ADMIN]), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        companyId: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        company: {
          select: {
            companyID: true,
            name: true
          }
        }
      }
    });
    
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    
    res.status(200).json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
});

// @ts-expect-error: Suppress Express 5 type error
router.post('/', jwtAuth, requireRole([UserRole.SUPER_ADMIN]), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    // Sanitize input
    const sanitized = Object.fromEntries(
      Object.entries(req.body).map(([k, v]) => [k, typeof v === 'string' ? xss(v) : v])
    );
    
    const parsed = createUserSchema.parse(sanitized);
    
    // Check if username or email already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { username: parsed.username },
          { email: parsed.email }
        ]
      }
    });
    
    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: existingUser.username === parsed.username ? 'Username already exists' : 'Email already exists'
      });
    }
    
    // Hash password
    const passwordHash = await bcrypt.hash(parsed.password, 12);
    
    // Create user
    const user = await prisma.user.create({
      data: {
        username: parsed.username,
        email: parsed.email,
        passwordHash,
        role: parsed.role,
        companyId: parsed.companyId
      },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        companyId: true,
        isActive: true,
        createdAt: true,
        company: {
          select: {
            companyID: true,
            name: true
          }
        }
      }
    });
    
    res.status(201).json({ success: true, data: user });
    
  } catch (err: any) {
    if (err.name === 'ZodError') {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: err.errors
      });
    }
    if (err.code === 'P2002') {
      return res.status(400).json({
        success: false,
        error: 'Username or email already exists'
      });
    }
    next(err);
  }
});

// @ts-expect-error: Suppress Express 5 type error
router.put('/:id', jwtAuth, requireRole([UserRole.SUPER_ADMIN]), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    
    // Sanitize input
    const sanitized = Object.fromEntries(
      Object.entries(req.body).map(([k, v]) => [k, typeof v === 'string' ? xss(v) : v])
    );
    
    const parsed = updateUserSchema.parse(sanitized);
    
    // Prepare update data
    const updateData: any = {};
    
    if (parsed.username) updateData.username = parsed.username;
    if (parsed.email) updateData.email = parsed.email;
    if (parsed.role) updateData.role = parsed.role;
    if (parsed.companyId !== undefined) updateData.companyId = parsed.companyId;
    if (parsed.isActive !== undefined) updateData.isActive = parsed.isActive;
    
    // Hash password if provided
    if (parsed.password) {
      updateData.passwordHash = await bcrypt.hash(parsed.password, 12);
    }
    
    const user = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        companyId: true,
        isActive: true,
        updatedAt: true,
        company: {
          select: {
            companyID: true,
            name: true
          }
        }
      }
    });
    
    res.status(200).json({ success: true, data: user });
    
  } catch (err: any) {
    if (err.name === 'ZodError') {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: err.errors
      });
    }
    if (err.code === 'P2025') {
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    if (err.code === 'P2002') {
      return res.status(400).json({
        success: false,
        error: 'Username or email already exists'
      });
    }
    next(err);
  }
});

// @ts-expect-error: Suppress Express 5 type error
router.delete('/:id', jwtAuth, requireRole([UserRole.SUPER_ADMIN]), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    
    // Prevent deleting yourself
    if (req.user?.userId === id) {
      return res.status(400).json({
        success: false,
        error: 'Cannot delete your own account'
      });
    }
    
    const user = await prisma.user.delete({
      where: { id },
      select: {
        id: true,
        username: true,
        email: true
      }
    });
    
    res.status(200).json({ success: true, data: user });
    
  } catch (err: any) {
    if (err.code === 'P2025') {
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    next(err);
  }
});

// @ts-expect-error: Suppress Express 5 type error
router.get('/me/profile', jwtAuth, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }
    
    // Handle legacy admin
    if (req.user.userId === 'legacy-admin') {
      return res.status(200).json({
        success: true,
        data: {
          id: 'legacy-admin',
          username: req.user.username,
          email: req.user.email,
          role: req.user.role,
          isLegacy: true
        }
      });
    }
    
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        companyId: true,
        isActive: true,
        createdAt: true,
        company: {
          select: {
            companyID: true,
            name: true,
            description: true
          }
        }
      }
    });
    
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    
    res.status(200).json({ success: true, data: user });
    
  } catch (err) {
    next(err);
  }
});

export default router;
