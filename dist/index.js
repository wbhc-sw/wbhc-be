"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const dotenv_1 = __importDefault(require("dotenv"));
const rateLimiter_1 = require("./middleware/rateLimiter");
const errorHandler_1 = require("./middleware/errorHandler");
const investor_1 = __importDefault(require("./routes/investor"));
const admin_1 = __importDefault(require("./routes/admin"));
const validation_1 = require("./services/validation");
const investorAdmin_1 = __importDefault(require("./routes/investorAdmin"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
// import { FRONTEND_URL } from './utils/constants';
// Load environment variables
dotenv_1.default.config();
// console.log('ALL ENV:', process.env);
// Validate required environment variables
(0, validation_1.validateEnv)();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 4000;
const { FRONTEND_URL, FRONTEND_2_URL,
// NODE_ENV
 } = process.env;
console.log([FRONTEND_URL, FRONTEND_2_URL].filter((url) => typeof url === 'string'));
// console.log('EMAIL_SERVICE_USER:', EMAIL_SERVICE_USER);
// console.log('EMAIL_SERVICE_PASS:', EMAIL_SERVICE_PASS);
// console.log('COMPANY_ADMIN_EMAIL:',   COMPANY_ADMIN_EMAIL);
// console.log('COMPANY_NAME:', COMPANY_NAME);
// Middleware
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
app.use((0, cors_1.default)({
    origin: [FRONTEND_URL, FRONTEND_2_URL].filter((url) => typeof url === 'string'),
    credentials: true,
}));
app.use((0, helmet_1.default)());
app.use((0, morgan_1.default)('dev'));
app.use(rateLimiter_1.rateLimiter);
app.use((0, cookie_parser_1.default)());
// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok', message: 'API is healthy' });
});
// API routes
app.use('/api/admin', admin_1.default);
app.use('/api/investor-form', investor_1.default);
app.use('/api/admin/investor-admin', investorAdmin_1.default);
// Error handling middleware
app.use(errorHandler_1.errorHandler);
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
