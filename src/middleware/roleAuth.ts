import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { UserRole, JWTPayload } from '../types/investor';

const JWT_SECRET = process.env.JWT_SECRET as string;

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is not set');
}

// Enhanced AuthRequest interface
export interface AuthRequest extends Request {
  user?: JWTPayload;
}

// Role groupings for easier management
export const ROLES_THAT_CAN_READ = [
  UserRole.SUPER_ADMIN,
  UserRole.COMPANY_ADMIN,
  UserRole.SUPER_VIEWER,
  UserRole.COMPANY_VIEWER,
];

export const ROLES_THAT_CAN_CREATE = [
  UserRole.SUPER_ADMIN,
  UserRole.COMPANY_ADMIN,
  UserRole.SUPER_CREATOR,
  UserRole.COMPANY_CREATOR
];

export const ROLES_THAT_CAN_UPDATE = [
  UserRole.SUPER_ADMIN,
  UserRole.COMPANY_ADMIN
];

export const ROLES_THAT_CAN_DELETE = [
  UserRole.SUPER_ADMIN,
  UserRole.COMPANY_ADMIN
];

// Basic JWT authentication (replacement for your current jwtAuth)
export function jwtAuth(req: AuthRequest, res: Response, next: NextFunction): void {
  const token = req.cookies?.admin_jwt;
  if (!token) {
    res.status(401).json({ success: false, error: 'Missing authentication cookie' });
    return;
  }
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ success: false, error: 'Invalid or expired token' });
  }
}

// Role-based access control
export function requireRole(allowedRoles: UserRole[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }
    
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ 
        success: false, 
        error: `Access denied. Required roles: ${allowedRoles.join(', ')}` 
      });
    }
    
    next();
  };
}

// Company-specific access control
export function requireCompanyAccess(req: AuthRequest, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ success: false, error: 'Authentication required' });
  }
  
  const user = req.user;
  
  // Super roles (especially SUPER_ADMIN) don't need company_ID at all
  // Even if they have a companyId in their JWT (e.g., from a previous role),
  // they can access any company or make requests without company_ID
  if ([UserRole.SUPER_ADMIN, UserRole.SUPER_VIEWER, UserRole.SUPER_CREATOR].includes(user.role)) {
    return next();
  }
  
  // For company roles, we need to validate company_ID
  const requestedCompanyId = parseInt(
    req.params.companyId || 
    req.params.companyID || 
    req.body.companyID || 
    req.query.companyID as string
  );
  
  // Company roles can only access their company
  if ([UserRole.COMPANY_ADMIN, UserRole.COMPANY_VIEWER, UserRole.COMPANY_CREATOR].includes(user.role)) {
    if (user.companyId && user.companyId === requestedCompanyId) {
      return next();
    }
    
    // If no specific company requested, allow access to their own company data
    if (!requestedCompanyId && user.companyId) {
      return next();
    }
  }
  
  return res.status(403).json({ 
    success: false, 
    error: 'Access denied. You can only access data from your assigned company.' 
  });
}

// Combined middleware for common patterns
export function requireReadAccess() {
  return [jwtAuth, requireRole(ROLES_THAT_CAN_READ)];
}

export function requireCreateAccess() {
  return [jwtAuth, requireRole(ROLES_THAT_CAN_CREATE)];
}

export function requireUpdateAccess() {
  return [jwtAuth, requireRole(ROLES_THAT_CAN_UPDATE)];
}

export function requireDeleteAccess() {
  return [jwtAuth, requireRole(ROLES_THAT_CAN_DELETE)];
}

// Company-scoped access patterns
export function requireCompanyReadAccess() {
  return [jwtAuth, requireRole(ROLES_THAT_CAN_READ), requireCompanyAccess];
}

export function requireCompanyCreateAccess() {
  return [jwtAuth, requireRole(ROLES_THAT_CAN_CREATE), requireCompanyAccess];
}

export function requireCompanyUpdateAccess() {
  return [jwtAuth, requireRole(ROLES_THAT_CAN_UPDATE), requireCompanyAccess];
}

export function requireCompanyDeleteAccess() {
  return [jwtAuth, requireRole(ROLES_THAT_CAN_DELETE), requireCompanyAccess];
}
