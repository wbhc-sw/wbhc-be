"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const database_1 = require("../services/database");
const jwtAuth_1 = require("../middleware/jwtAuth");
const validation_1 = require("../middleware/validation");
const xss_1 = __importDefault(require("xss"));
// import { InvestorAdmin as PrismaInvestorAdmin, Investor as PrismaInvestor } from '@prisma/client';
const router = (0, express_1.Router)();
// GET /api/admin/investor-admin - Retrieve all admin leads
router.get('/', jwtAuth_1.jwtAuth, (req, res, next) => {
    database_1.prisma.investorAdmin.findMany({ orderBy: { createdAt: 'desc' } })
        .then((leads) => res.status(200).json({ success: true, data: leads }))
        .catch(next);
});
// POST /api/admin/investor-admin - Create new admin lead
router.post('/', jwtAuth_1.jwtAuth, (req, res, next) => {
    // Sanitize input
    const sanitized = Object.fromEntries(Object.entries(req.body).map(([k, v]) => [k, typeof v === 'string' ? (0, xss_1.default)(v) : v]));
    let parsed;
    try {
        parsed = validation_1.investorAdminCreateSchema.parse(sanitized);
    }
    catch (err) {
        if (err.name === 'ZodError') {
            res.status(400).json({ success: false, error: 'Validation failed', details: err.errors });
            return;
        }
        return next(err);
    }
    database_1.prisma.investorAdmin.create({ data: parsed })
        .then((lead) => res.status(201).json({ success: true, data: lead }))
        .catch(next);
});
// PUT /api/admin/investor-admin/:id - Update existing admin lead
router.put('/:id', jwtAuth_1.jwtAuth, (req, res, next) => {
    const { id } = req.params;
    // Sanitize input
    const sanitized = Object.fromEntries(Object.entries(req.body).map(([k, v]) => [k, typeof v === 'string' ? (0, xss_1.default)(v) : v]));
    let parsed;
    try {
        parsed = validation_1.investorAdminUpdateSchema.parse(sanitized);
    }
    catch (err) {
        if (err.name === 'ZodError') {
            res.status(400).json({ success: false, error: 'Validation failed', details: err.errors });
            return;
        }
        return next(err);
    }
    database_1.prisma.investorAdmin.update({ where: { id }, data: parsed })
        .then((lead) => res.status(200).json({ success: true, data: lead }))
        .catch(next);
});
// POST /api/admin/investor-admin/transfer/:investorId
router.post('/transfer/:investorId', jwtAuth_1.jwtAuth, (req, res, next) => {
    const { investorId } = req.params;
    const notes = req.body.notes ? (0, xss_1.default)(req.body.notes) : undefined;
    database_1.prisma.investor.findUnique({ where: { id: investorId } })
        .then(investor => {
        if (!investor) {
            res.status(404).json({ success: false, error: 'Investor not found' });
            return;
        }
        return database_1.prisma.investorAdmin.findFirst({ where: { originalInvestorId: investorId } })
            .then(existing => {
            if (existing) {
                res.status(409).json({ success: false, error: 'Investor already transferred' });
                return;
            }
            return database_1.prisma.investorAdmin.create({
                data: {
                    fullName: investor.fullName,
                    phoneNumber: investor.phoneNumber,
                    companyID: investor.companyID,
                    sharesQuantity: investor.sharesQuantity,
                    calculatedTotal: investor.calculatedTotal,
                    city: investor.city,
                    submissionStatus: investor.submissionStatus,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    emailSentToAdmin: false,
                    emailSentToInvestor: false,
                    notes,
                    callingTimes: 0,
                    leadStatus: 'new',
                    originalInvestorId: investor.id,
                }
            }).then(adminLead => {
                res.status(201).json({ success: true, data: adminLead });
            });
        });
    })
        .catch(next);
});
// GET /api/admin/investor-admin/statistics - Get investment amount statistics
router.get('/statistics', jwtAuth_1.jwtAuth, async (req, res, next) => {
    try {
        const stats = await database_1.prisma.investorAdmin.aggregate({
            _max: { investmentAmount: true },
            _min: { investmentAmount: true },
            _avg: { investmentAmount: true },
            _sum: { investmentAmount: true },
            _count: { investmentAmount: true },
        });
        res.status(200).json({ success: true, data: stats });
    }
    catch (err) {
        next(err);
    }
});
exports.default = router;
