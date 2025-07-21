import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET as string;

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is not set');
}

export interface AuthRequest extends Request {
  user?: any;
}

export function jwtAuth(req: AuthRequest, res: Response, next: NextFunction): void {
  // Read token from cookie instead of Authorization header
  const token = req.cookies?.admin_jwt;
  if (!token) {
    res.status(401).json({ success: false, error: 'Missing authentication cookie' });
    return;
  }
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ success: false, error: 'Invalid or expired token' });
  }
} 