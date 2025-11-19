"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const database_1 = require("../services/database");
const roleAuth_1 = require("../middleware/roleAuth");
const investor_1 = require("../types/investor");
const validation_1 = require("../middleware/validation");
const xss_1 = __importDefault(require("xss"));
const router = (0, express_1.Router)();
// Only SUPER roles should be able to create companies
const COMPANY_CREATE_ROLES = [investor_1.UserRole.SUPER_ADMIN, investor_1.UserRole.SUPER_CREATOR];
// Specific roles that can read companies (including SUPER_CREATOR)
const COMPANY_READ_ROLES = [
    investor_1.UserRole.SUPER_ADMIN,
    investor_1.UserRole.COMPANY_ADMIN,
    investor_1.UserRole.SUPER_VIEWER,
    investor_1.UserRole.COMPANY_VIEWER,
    investor_1.UserRole.SUPER_CREATOR
];
// @ts-expect-error: Suppress Express 5 type error
router.get('/', roleAuth_1.jwtAuth, (0, roleAuth_1.requireRole)(COMPANY_READ_ROLES), async (req, res, next) => {
    try {
        const user = req.user;
        let whereClause = {};
        // Company-specific roles can only see their company
        if ([investor_1.UserRole.COMPANY_ADMIN, investor_1.UserRole.COMPANY_VIEWER, investor_1.UserRole.COMPANY_CREATOR].includes(user.role)) {
            if (!user.companyId) {
                res.status(403).json({ success: false, error: 'No company assigned to your account' });
                return;
            }
            whereClause = { companyID: user.companyId };
        }
        const companies = await database_1.prisma.company.findMany({
            where: whereClause,
            select: {
                companyID: true,
                name: true,
                description: true,
                phoneNumber: true,
                url: true,
                createdAt: true,
                updatedAt: true,
                createdByUser: {
                    select: {
                        id: true,
                        username: true
                    }
                },
                updatedByUser: {
                    select: {
                        id: true,
                        username: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
        res.status(200).json({ success: true, data: companies });
    }
    catch (err) {
        next(err);
    }
});
// @ts-expect-error: Suppress Express 5 type error
router.get('/:companyID', roleAuth_1.jwtAuth, (0, roleAuth_1.requireRole)(COMPANY_READ_ROLES), roleAuth_1.requireCompanyAccess, async (req, res, next) => {
    try {
        const { companyID } = req.params;
        const companyId = parseInt(companyID, 10);
        if (isNaN(companyId)) {
            res.status(400).json({ success: false, error: 'Invalid company ID' });
            return;
        }
        const company = await database_1.prisma.company.findUnique({
            where: { companyID: companyId },
            select: {
                companyID: true,
                name: true,
                description: true,
                phoneNumber: true,
                url: true,
                createdAt: true,
                updatedAt: true,
                createdByUser: {
                    select: {
                        id: true,
                        username: true
                    }
                },
                updatedByUser: {
                    select: {
                        id: true,
                        username: true
                    }
                }
            }
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
// @ts-expect-error: Suppress Express 5 type error
router.post('/', roleAuth_1.jwtAuth, (0, roleAuth_1.requireRole)(COMPANY_CREATE_ROLES), async (req, res, next) => {
    try {
        const user = req.user;
        // Sanitize input
        const sanitized = Object.fromEntries(Object.entries(req.body).map(([k, v]) => [k, typeof v === 'string' ? (0, xss_1.default)(v) : v]));
        const parsed = validation_1.companyCreateSchema.parse(sanitized);
        // IMPORTANT: Company creators should not be able to create new companies
        // They should only be able to work within their assigned company
        if ([investor_1.UserRole.COMPANY_ADMIN, investor_1.UserRole.COMPANY_CREATOR].includes(user.role)) {
            res.status(403).json({
                success: false,
                error: 'Company-specific users cannot create new companies. Only SUPER_ADMIN and SUPER_CREATOR can create companies.'
            });
            return;
        }
        const company = await database_1.prisma.company.create({
            data: {
                ...parsed,
                createdBy: user.userId // Track who created this company
                // updatedBy: Leave as null - not updated yet
            },
            select: {
                companyID: true,
                name: true,
                description: true,
                phoneNumber: true,
                url: true,
                createdAt: true,
                updatedAt: true,
                createdByUser: {
                    select: {
                        id: true,
                        username: true
                    }
                },
                updatedByUser: {
                    select: {
                        id: true,
                        username: true
                    }
                }
            }
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
// @ts-expect-error: Suppress Express 5 type error
router.put('/:companyID', roleAuth_1.jwtAuth, (0, roleAuth_1.requireRole)(roleAuth_1.ROLES_THAT_CAN_UPDATE), roleAuth_1.requireCompanyAccess, async (req, res, next) => {
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
            data: {
                ...parsed,
                updatedBy: req.user.userId // Track who updated this company
            },
            select: {
                companyID: true,
                name: true,
                description: true,
                phoneNumber: true,
                url: true,
                createdAt: true,
                updatedAt: true,
                createdByUser: {
                    select: {
                        id: true,
                        username: true
                    }
                },
                updatedByUser: {
                    select: {
                        id: true,
                        username: true
                    }
                }
            }
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
// @ts-expect-error: Suppress Express 5 type error
router.delete('/:companyID', roleAuth_1.jwtAuth, (0, roleAuth_1.requireRole)(roleAuth_1.ROLES_THAT_CAN_DELETE), roleAuth_1.requireCompanyAccess, async (req, res, next) => {
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
