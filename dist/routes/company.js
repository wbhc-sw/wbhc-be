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
const router = (0, express_1.Router)();
// GET /api/admin/company - Retrieve all companies
router.get('/', async (req, res, next) => {
    try {
        const companies = await database_1.prisma.company.findMany({
            orderBy: { createdAt: 'desc' }
        });
        res.status(200).json({ success: true, data: companies });
    }
    catch (err) {
        next(err);
    }
});
// GET /api/admin/company/:companyID - Get company by ID
router.get('/:companyID', jwtAuth_1.jwtAuth, async (req, res, next) => {
    try {
        const { companyID } = req.params;
        const companyId = parseInt(companyID, 10);
        if (isNaN(companyId)) {
            res.status(400).json({ success: false, error: 'Invalid company ID' });
            return;
        }
        const company = await database_1.prisma.company.findUnique({
            where: { companyID: companyId }
        });
        if (!company) {
            res.status(404).json({ success: false, error: 'Company not found' });
            return;
        }
        res.status(200).json({ success: true, data: company });
    }
    catch (err) {
        next(err);
    }
});
// POST /api/admin/company - Create new company (admin only)
router.post('/', jwtAuth_1.jwtAuth, async (req, res, next) => {
    try {
        // Sanitize input
        const sanitized = Object.fromEntries(Object.entries(req.body).map(([k, v]) => [k, typeof v === 'string' ? (0, xss_1.default)(v) : v]));
        const parsed = validation_1.companyCreateSchema.parse(sanitized);
        const company = await database_1.prisma.company.create({
            data: parsed
        });
        res.status(201).json({ success: true, data: company });
    }
    catch (err) {
        if (err.name === 'ZodError') {
            res.status(400).json({
                success: false,
                error: 'Validation failed',
                details: err.errors
            });
            return;
        }
        next(err);
    }
});
// PUT /api/admin/company/:companyID - Update company
router.put('/:companyID', jwtAuth_1.jwtAuth, async (req, res, next) => {
    try {
        const { companyID } = req.params;
        const companyId = parseInt(companyID, 10);
        if (isNaN(companyId)) {
            res.status(400).json({ success: false, error: 'Invalid company ID' });
            return;
        }
        // Sanitize input
        const sanitized = Object.fromEntries(Object.entries(req.body).map(([k, v]) => [k, typeof v === 'string' ? (0, xss_1.default)(v) : v]));
        const parsed = validation_1.companyUpdateSchema.parse(sanitized);
        const company = await database_1.prisma.company.update({
            where: { companyID: companyId },
            data: parsed
        });
        res.status(200).json({ success: true, data: company });
    }
    catch (err) {
        if (err.name === 'ZodError') {
            res.status(400).json({
                success: false,
                error: 'Validation failed',
                details: err.errors
            });
            return;
        }
        if (err.code === 'P2025') {
            res.status(404).json({ success: false, error: 'Company not found' });
            return;
        }
        next(err);
    }
});
// DELETE /api/admin/company/:companyID - Delete company
router.delete('/:companyID', jwtAuth_1.jwtAuth, async (req, res, next) => {
    try {
        const { companyID } = req.params;
        const companyId = parseInt(companyID, 10);
        if (isNaN(companyId)) {
            res.status(400).json({ success: false, error: 'Invalid company ID' });
            return;
        }
        const company = await database_1.prisma.company.delete({
            where: { companyID: companyId }
        });
        res.status(200).json({ success: true, data: company });
    }
    catch (err) {
        if (err.code === 'P2025') {
            res.status(404).json({ success: false, error: 'Company not found' });
            return;
        }
        next(err);
    }
});
exports.default = router;
