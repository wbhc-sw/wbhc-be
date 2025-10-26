import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { rateLimiter } from './middleware/rateLimiter';
import { errorHandler } from './middleware/errorHandler';
import investorRouter from './routes/investor';
import { validateEnv } from './services/validation';
import investorAdminRouter from './routes/investorAdmin';
import companyRouter from './routes/company';
import userRouter from './routes/user';
import cookieParser from 'cookie-parser';
// import { FRONTEND_URL } from './utils/constants';

// Load environment variables
dotenv.config();
// console.log('ALL ENV:', process.env);

// Validate required environment variables
validateEnv();

const app = express();
const PORT = process.env.PORT || 4000;

const {
  FRONTEND_URL,
  FRONTEND_2_URL,
  FRONTEND_3_URL,
  FRONTEND_4_URL,
  // NODE_ENV
} = process.env;

console.log([FRONTEND_URL, FRONTEND_2_URL, FRONTEND_3_URL, FRONTEND_4_URL].filter((url): url is string => typeof url === 'string'));

// console.log('EMAIL_SERVICE_USER:', EMAIL_SERVICE_USER);
// console.log('EMAIL_SERVICE_PASS:', EMAIL_SERVICE_PASS);
// console.log('COMPANY_ADMIN_EMAIL:',   COMPANY_ADMIN_EMAIL);
// console.log('COMPANY_NAME:', COMPANY_NAME);

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({
  origin: [FRONTEND_URL, FRONTEND_2_URL, FRONTEND_3_URL, FRONTEND_4_URL].filter((url): url is string => typeof url === 'string'),
  credentials: true,
}));
app.use(helmet());
app.use(morgan('dev'));
app.use(rateLimiter); // This now excludes GET requests
app.use(cookieParser());

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'ok', message: 'API is healthy' });
});

// API routes
app.use('/api/admin/users', userRouter);        // Modern user management routes
app.use('/api/investor-form', investorRouter);
app.use('/api/admin/investor-admin', investorAdminRouter);
app.use('/api/admin/company', companyRouter);

// Error handling middleware
app.use(errorHandler);

// Graceful shutdown
const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

process.on('SIGTERM', () => {
  console.info('SIGTERM signal received. Closing server.');
  server.close(() => {
    console.log('Server closed.');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.info('SIGINT signal received. Closing server.');
  server.close(() => {
    console.log('Server closed.');
    process.exit(0);
  });
}); 