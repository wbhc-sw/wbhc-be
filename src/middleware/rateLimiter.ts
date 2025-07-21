import rateLimit from 'express-rate-limit';

export const rateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 50, // limit each IP to 5 requests per windowMs
  message: {
    success: false,
    error: 'Too many requests, please try again later.'
  },
}); 