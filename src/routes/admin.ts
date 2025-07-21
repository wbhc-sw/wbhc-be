import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const router = Router();

const ADMIN_USERNAME = process.env.ADMIN_USERNAME;
const ADMIN_PASSWORD_HASH = process.env.ADMIN_PASSWORD_HASH;
const JWT_SECRET = process.env.JWT_SECRET as string;
const JWT_EXPIRES_IN = '24h';

if (!ADMIN_USERNAME || !ADMIN_PASSWORD_HASH || !JWT_SECRET) {
  throw new Error('Missing required admin environment variables');
}

// @ts-expect-error: Suppress Express 5 type error
router.post('/login', async (req: Request, res: Response) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ success: false, error: 'Username and password are required' });
  }
  if (username !== ADMIN_USERNAME) {
    return res.status(401).json({ success: false, error: 'Invalid credentials' });
  }
  const valid = await bcrypt.compare(password, ADMIN_PASSWORD_HASH);
  if (!valid) {
    return res.status(401).json({ success: false, error: 'Invalid credentials' });
  }
  const token = jwt.sign({ username }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

  // Set JWT as HttpOnly cookie
  res.cookie('admin_jwt', token, {
    httpOnly: true,
    secure: true, //process.env.NODE_ENV === 'production', // CORRECT: Only secure in production
    sameSite: 'lax', // or 'strict' if you prefer
    path: '/',
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
  });

  return res.status(200).json({ success: true });
});

// Logout endpoint
router.post('/logout', (req: Request, res: Response) => {
  res.cookie('admin_jwt', '', {
    httpOnly: true,
    secure: true, //process.env.NODE_ENV === 'production', // CORRECT: Only secure in production
    sameSite: 'lax', // or 'strict'
    path: '/',
    expires: new Date(0), // Expire the cookie immediately
  });
  res.json({ success: true });
});

export default router; 