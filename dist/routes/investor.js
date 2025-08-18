"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const validation_1 = require("../middleware/validation");
const database_1 = require("../services/database");
const email_1 = require("../services/email");
const xss_1 = __importDefault(require("xss"));
// import { INVESTMENT_PACKAGES } from '../utils/constants';
const jwtAuth_1 = require("../middleware/jwtAuth");
const router = (0, express_1.Router)();
// console.log('Allowed investment packages:', INVESTMENT_PACKAGES);
// @ts-expect-error: Suppress Express 5 type error
router.post('/', async (req, res, next) => {
    try {
        // Sanitize input
        const sanitized = Object.fromEntries(Object.entries(req.body).map(([k, v]) => [k, typeof v === 'string' ? (0, xss_1.default)(v) : v]));
        // Validate input
        const parsed = validation_1.investorSchema.parse(sanitized);
        // Save to DB
        const investor = await database_1.prisma.investor.create({
            data: {
                fullName: parsed.fullName,
                phoneNumber: parsed.phoneNumber,
                company: parsed.company,
                sharesQuantity: parsed.sharesQuantity,
                calculatedTotal: parsed.calculatedTotal,
                city: parsed.city,
            },
        });
        // Send admin notification
        await (0, email_1.sendAdminNotification)(investor);
        // Update email tracking - only admin email was sent
        await database_1.prisma.investor.update({
            where: { id: investor.id },
            data: { emailSentToAdmin: true, emailSentToInvestor: false },
        });
        res.status(201).json({
            success: true,
            message: 'Submission received',
            data: { id: investor.id, createdAt: investor.createdAt },
        });
    }
    catch (err) {
        if (err.name === 'ZodError') {
            return res.status(400).json({
                success: false,
                error: 'Validation failed',
                details: err.errors,
            });
        }
        next(err);
    }
});
// GET / - Return all investor submissions (private, admin only)
router.get('/', jwtAuth_1.jwtAuth, async (req, res, next) => {
    try {
        const investors = await database_1.prisma.investor.findMany({
            orderBy: { createdAt: 'desc' },
        });
        res.status(200).json({ success: true, data: investors });
    }
    catch (err) {
        next(err);
    }
});
exports.default = router;
