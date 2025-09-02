import rateLimit from 'express-rate-limit';

// Rate limiter that excludes GET requests
export const rateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 50, // limit each IP to 50 requests per windowMs
  message: {
    success: false,
    error: 'Too many requests, please try again later.'
  },
  skip: (req) => req.method === 'GET', // Skip rate limiting for GET requests
});

// Alternative: Rate limiter only for non-GET requests
export const nonGetRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 50, // limit each IP to 50 requests per windowMs
  message: {
    success: false,
    error: 'Too many requests, please try again later.'
  },
  skip: (req) => req.method === 'GET', // Skip rate limiting for GET requests
}); 