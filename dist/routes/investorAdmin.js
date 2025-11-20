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
// @ts-expect-error: Suppress Express 5 type error
router.get('/', roleAuth_1.jwtAuth, (0, roleAuth_1.requireRole)(roleAuth_1.ROLES_THAT_CAN_READ), async (req, res, next) => {
    try {
        const user = req.user;
        const { search, status, city, companyID, source, createdAtFrom, createdAtTo, updatedAtFrom, updatedAtTo, page, limit } = req.query;
        // Pagination parameters
        const pageNum = page ? Math.max(1, parseInt(page, 10)) : 1;
        const limitNum = limit ? Math.min(100, Math.max(1, parseInt(limit, 10))) : 20; // Default 20, max 100
        const skip = (pageNum - 1) * limitNum;
        // Build the where clause for filtering
        const whereClause = {};
        // Company-specific access control
        if ([investor_1.UserRole.COMPANY_ADMIN, investor_1.UserRole.COMPANY_VIEWER, investor_1.UserRole.COMPANY_CREATOR].includes(user.role)) {
            if (!user.companyId) {
                return res.status(403).json({ success: false, error: 'No company assigned to your account' });
            }
            whereClause.companyID = user.companyId;
        }
        // Search in fullName and phoneNumber fields
        if (search && typeof search === 'string') {
            const searchTerm = search.trim();
            if (searchTerm) {
                whereClause.OR = [
                    {
                        fullName: {
                            contains: searchTerm,
                            mode: 'insensitive'
                        }
                    },
                    {
                        phoneNumber: {
                            contains: searchTerm,
                            mode: 'insensitive'
                        }
                    }
                ];
            }
        }
        // Filter by lead status (exact match)
        if (status && typeof status === 'string' && status !== 'all') {
            whereClause.leadStatus = status;
        }
        // Filter by city (exact match)
        if (city && typeof city === 'string' && city !== 'all') {
            whereClause.city = city;
        }
        // Filter by source (exact match)
        if (source && typeof source === 'string' && source !== 'all') {
            whereClause.source = source;
        }
        // Filter by companyID (exact match) - only for super roles
        if (companyID && typeof companyID === 'string' && companyID !== 'all') {
            const companyIdNum = parseInt(companyID, 10);
            if (!isNaN(companyIdNum)) {
                // Super roles can filter by any company, company roles are already restricted above
                if ([investor_1.UserRole.SUPER_ADMIN, investor_1.UserRole.SUPER_VIEWER, investor_1.UserRole.SUPER_CREATOR].includes(user.role)) {
                    whereClause.companyID = companyIdNum;
                }
            }
        }
        // Filter by createdAt date range
        if (createdAtFrom || createdAtTo) {
            whereClause.createdAt = {};
            if (createdAtFrom && typeof createdAtFrom === 'string') {
                const fromDate = new Date(createdAtFrom);
                if (!isNaN(fromDate.getTime())) {
                    whereClause.createdAt.gte = fromDate;
                }
            }
            if (createdAtTo && typeof createdAtTo === 'string') {
                const toDate = new Date(createdAtTo);
                if (!isNaN(toDate.getTime())) {
                    // Set to end of day
                    toDate.setHours(23, 59, 59, 999);
                    whereClause.createdAt.lte = toDate;
                }
            }
        }
        // Filter by updatedAt date range
        if (updatedAtFrom || updatedAtTo) {
            whereClause.updatedAt = {};
            if (updatedAtFrom && typeof updatedAtFrom === 'string') {
                const fromDate = new Date(updatedAtFrom);
                if (!isNaN(fromDate.getTime())) {
                    whereClause.updatedAt.gte = fromDate;
                }
            }
            if (updatedAtTo && typeof updatedAtTo === 'string') {
                const toDate = new Date(updatedAtTo);
                if (!isNaN(toDate.getTime())) {
                    // Set to end of day
                    toDate.setHours(23, 59, 59, 999);
                    whereClause.updatedAt.lte = toDate;
                }
            }
        }
        // Get total count for pagination metadata
        const total = await database_1.prisma.investorAdmin.count({ where: whereClause });
        // Get paginated leads
        const leads = await database_1.prisma.investorAdmin.findMany({
            where: whereClause,
            orderBy: { createdAt: 'desc' },
            skip,
            take: limitNum,
            select: {
                id: true,
                fullName: true,
                phoneNumber: true,
                city: true,
                source: true,
                createdAt: true,
                updatedAt: true,
                emailSentToAdmin: true,
                emailSentToInvestor: true,
                notes: true,
                callingTimes: true,
                leadStatus: true,
                originalInvestorId: true,
                investmentAmount: true,
                calculatedTotal: true,
                sharesQuantity: true,
                companyID: true,
                msgDate: true,
                company: {
                    select: {
                        name: true
                    }
                },
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
        // Calculate total pages
        const totalPages = Math.ceil(total / limitNum);
        res.status(200).json({
            success: true,
            data: leads,
            pagination: {
                page: pageNum,
                limit: limitNum,
                total,
                totalPages,
                hasNextPage: pageNum < totalPages,
                hasPreviousPage: pageNum > 1
            }
        });
    }
    catch (error) {
        next(error);
    }
});
// @ts-expect-error: Suppress Express 5 type error
router.post('/', roleAuth_1.jwtAuth, (0, roleAuth_1.requireRole)(roleAuth_1.ROLES_THAT_CAN_CREATE), async (req, res, next) => {
    try {
        const user = req.user;
        // Sanitize input
        const sanitized = Object.fromEntries(Object.entries(req.body).map(([k, v]) => [k, typeof v === 'string' ? (0, xss_1.default)(v) : v]));
        let parsed = validation_1.investorAdminCreateSchema.parse(sanitized);
        // Validate msgDate is required for creators
        if ([investor_1.UserRole.SUPER_CREATOR, investor_1.UserRole.COMPANY_CREATOR].includes(user.role)) {
            if (!parsed.msgDate) {
                res.status(400).json({
                    success: false,
                    error: 'msgDate is required for creator roles'
                });
                return;
            }
        }
        // IMPORTANT: Company creators can only create leads for their company
        if ([investor_1.UserRole.COMPANY_ADMIN, investor_1.UserRole.COMPANY_CREATOR].includes(user.role)) {
            if (!user.companyId) {
                res.status(403).json({ success: false, error: 'No company assigned to your account' });
                return;
            }
            // Check if user is trying to create for a different company
            if (parsed.companyID && parsed.companyID !== user.companyId) {
                res.status(403).json({
                    success: false,
                    error: `Access denied. You can only create leads for company ID ${user.companyId}, but you tried to create for company ID ${parsed.companyID}`
                });
                return;
            }
            // Force the companyID to be user's company (override any provided value)
            parsed.companyID = user.companyId;
        }
        // Check for unique phone number
        const existingLead = await database_1.prisma.investorAdmin.findFirst({
            where: { phoneNumber: parsed.phoneNumber }
        });
        if (existingLead) {
            res.status(409).json({ success: false, error: 'Phone number already exists for another lead.' });
            return;
        }
        const lead = await database_1.prisma.investorAdmin.create({
            data: {
                ...parsed,
                createdBy: user.userId, // Track who created this
                // updatedBy: Leave as null - not updated yet
            },
            select: {
                id: true,
                fullName: true,
                phoneNumber: true,
                city: true,
                source: true,
                createdAt: true,
                updatedAt: true,
                emailSentToAdmin: true,
                emailSentToInvestor: true,
                notes: true,
                callingTimes: true,
                leadStatus: true,
                originalInvestorId: true,
                investmentAmount: true,
                calculatedTotal: true,
                sharesQuantity: true,
                companyID: true,
                msgDate: true,
                company: {
                    select: {
                        name: true
                    }
                },
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
        res.status(201).json({ success: true, data: lead });
    }
    catch (err) {
        if (err.name === 'ZodError') {
            res.status(400).json({ success: false, error: 'Validation failed', details: err.errors });
            return;
        }
        next(err);
    }
});
// @ts-expect-error: Suppress Express 5 type error
router.put('/:id', roleAuth_1.jwtAuth, (0, roleAuth_1.requireRole)(roleAuth_1.ROLES_THAT_CAN_UPDATE), async (req, res, next) => {
    try {
        const user = req.user;
        const { id } = req.params;
        const numericId = parseInt(id, 10);
        if (isNaN(numericId)) {
            res.status(400).json({ success: false, error: 'Invalid ID format' });
            return;
        }
        // Company admins can only update leads from their company
        if (user.role === investor_1.UserRole.COMPANY_ADMIN && user.companyId) {
            // First check if the lead belongs to their company
            const existingLead = await database_1.prisma.investorAdmin.findUnique({ where: { id: numericId } });
            if (!existingLead) {
                res.status(404).json({ success: false, error: 'Lead not found' });
                return;
            }
            if (existingLead.companyID !== user.companyId) {
                res.status(403).json({ success: false, error: 'Access denied to this lead' });
                return;
            }
        }
        // Sanitize input
        const sanitized = Object.fromEntries(Object.entries(req.body).map(([k, v]) => [k, typeof v === 'string' ? (0, xss_1.default)(v) : v]));
        const parsed = validation_1.investorAdminUpdateSchema.parse(sanitized);
        const lead = await database_1.prisma.investorAdmin.update({
            where: { id: numericId },
            data: {
                ...parsed,
                updatedBy: user.userId, // Track who updated this
            },
            select: {
                id: true,
                fullName: true,
                phoneNumber: true,
                city: true,
                source: true,
                createdAt: true,
                updatedAt: true,
                emailSentToAdmin: true,
                emailSentToInvestor: true,
                notes: true,
                callingTimes: true,
                leadStatus: true,
                originalInvestorId: true,
                investmentAmount: true,
                calculatedTotal: true,
                sharesQuantity: true,
                companyID: true,
                msgDate: true,
                company: {
                    select: {
                        name: true
                    }
                },
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
        res.status(200).json({ success: true, data: lead });
    }
    catch (err) {
        if (err.name === 'ZodError') {
            res.status(400).json({ success: false, error: 'Validation failed', details: err.errors });
            return;
        }
        if (err.code === 'P2025') {
            res.status(404).json({ success: false, error: 'Lead not found' });
            return;
        }
        next(err);
    }
});
// @ts-expect-error: Suppress Express 5 type error
router.post('/transfer/:investorId', roleAuth_1.jwtAuth, (0, roleAuth_1.requireRole)(roleAuth_1.ROLES_THAT_CAN_CREATE), async (req, res, next) => {
    try {
        const user = req.user;
        const { investorId } = req.params;
        const notes = req.body.notes ? (0, xss_1.default)(req.body.notes) : undefined;
        const msgDate = req.body.msgDate ? new Date(req.body.msgDate) : undefined;
        // Validate msgDate is required for creators
        if ([investor_1.UserRole.SUPER_CREATOR, investor_1.UserRole.COMPANY_CREATOR].includes(user.role)) {
            if (!msgDate) {
                res.status(400).json({
                    success: false,
                    error: 'msgDate is required for creator roles'
                });
                return;
            }
        }
        const investor = await database_1.prisma.investor.findUnique({ where: { id: investorId } });
        if (!investor) {
            res.status(404).json({ success: false, error: 'Investor not found' });
            return;
        }
        // Company users can only transfer investors from their company
        if ([investor_1.UserRole.COMPANY_ADMIN, investor_1.UserRole.COMPANY_CREATOR].includes(user.role)) {
            if (!user.companyId || investor.companyID !== user.companyId) {
                res.status(403).json({ success: false, error: 'Access denied to this investor' });
                return;
            }
        }
        const existing = await database_1.prisma.investorAdmin.findFirst({ where: { originalInvestorId: investorId } });
        if (existing) {
            res.status(409).json({ success: false, error: 'Investor already transferred' });
            return;
        }
        // Create the admin lead AND update the investor's transferred status
        const [adminLead] = await database_1.prisma.$transaction([
            database_1.prisma.investorAdmin.create({
                data: {
                    fullName: investor.fullName,
                    phoneNumber: investor.phoneNumber,
                    companyID: investor.companyID,
                    sharesQuantity: investor.sharesQuantity,
                    calculatedTotal: investor.calculatedTotal,
                    city: investor.city,
                    source: investor.source,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    emailSentToAdmin: false,
                    emailSentToInvestor: false,
                    notes,
                    callingTimes: 0,
                    leadStatus: 'new',
                    originalInvestorId: investor.id,
                    msgDate,
                    createdBy: user.userId, // Track who transferred/created this
                    // updatedBy: Leave as null - not updated yet
                },
                select: {
                    id: true,
                    fullName: true,
                    phoneNumber: true,
                    city: true,
                    source: true,
                    createdAt: true,
                    updatedAt: true,
                    emailSentToAdmin: true,
                    emailSentToInvestor: true,
                    notes: true,
                    callingTimes: true,
                    leadStatus: true,
                    originalInvestorId: true,
                    investmentAmount: true,
                    calculatedTotal: true,
                    sharesQuantity: true,
                    companyID: true,
                    msgDate: true,
                    company: {
                        select: {
                            name: true
                        }
                    },
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
            }),
            database_1.prisma.investor.update({
                where: { id: investorId },
                data: { transferred: true }
            })
        ]);
        res.status(201).json({ success: true, data: adminLead });
    }
    catch (error) {
        next(error);
    }
});
// @ts-expect-error: Suppress Express 5 type error
router.get('/statistics', roleAuth_1.jwtAuth, (0, roleAuth_1.requireRole)(roleAuth_1.ROLES_THAT_CAN_READ), async (req, res, next) => {
    try {
        const user = req.user;
        let whereClause = {};
        // Company-specific roles can only see their company's statistics
        if ([investor_1.UserRole.COMPANY_ADMIN, investor_1.UserRole.COMPANY_VIEWER, investor_1.UserRole.COMPANY_CREATOR].includes(user.role)) {
            if (!user.companyId) {
                return res.status(403).json({ success: false, error: 'No company assigned to your account' });
            }
            whereClause = { companyID: user.companyId };
        }
        const stats = await database_1.prisma.investorAdmin.aggregate({
            where: whereClause,
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
