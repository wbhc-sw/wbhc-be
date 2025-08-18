"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.investorAdminUpdateSchema = exports.investorAdminCreateSchema = exports.investorSchema = void 0;
const zod_1 = require("zod");
// import { INVESTMENT_PACKAGES } from '../utils/constants';
exports.investorSchema = zod_1.z.object({
    fullName: zod_1.z.string().min(2, 'Full Name must be at least 2 characters'),
    phoneNumber: zod_1.z
        .string()
        .optional()
        .refine((val) => !val || /^[0-9+\-\s()]+$/.test(val), 'Invalid phone number format'),
    company: zod_1.z.string().optional(),
    sharesQuantity: zod_1.z.number().int().min(1, 'Shares quantity must be at least 1').optional(),
    calculatedTotal: zod_1.z.number().positive('Calculated total must be a positive number').optional(),
    city: zod_1.z.string().min(1, 'City is required'),
});
exports.investorAdminCreateSchema = zod_1.z.object({
    fullName: zod_1.z.string().min(2, 'Full Name must be at least 2 characters'),
    phoneNumber: zod_1.z
        .string()
        .optional()
        .refine((val) => !val || /^[0-9+\-\s()]+$/.test(val), 'Invalid phone number format'),
    company: zod_1.z.string().optional(),
    sharesQuantity: zod_1.z.number().int().min(1, 'Shares quantity must be at least 1').optional(),
    calculatedTotal: zod_1.z.number().positive('Calculated total must be a positive number').optional(),
    city: zod_1.z.string().min(1, 'City is required'),
    submissionStatus: zod_1.z.string().optional(),
    notes: zod_1.z.string().optional(),
    callingTimes: zod_1.z.number().int().min(0).optional(),
    leadStatus: zod_1.z.string().optional(),
    originalInvestorId: zod_1.z.string().uuid().optional(),
    investmentAmount: zod_1.z.number().optional(),
});
exports.investorAdminUpdateSchema = zod_1.z.object({
    fullName: zod_1.z.string().min(2).optional(),
    phoneNumber: zod_1.z
        .string()
        .optional()
        .refine((val) => !val || /^[0-9+\-\s()]+$/.test(val), 'Invalid phone number format'),
    company: zod_1.z.string().optional(),
    sharesQuantity: zod_1.z.number().int().min(1).optional(),
    calculatedTotal: zod_1.z.number().positive().optional(),
    city: zod_1.z.string().min(1).optional(),
    submissionStatus: zod_1.z.string().optional(),
    notes: zod_1.z.string().optional(),
    callingTimes: zod_1.z.number().int().min(0).optional(),
    leadStatus: zod_1.z.string().optional(),
    originalInvestorId: zod_1.z.string().uuid().optional(),
    investmentAmount: zod_1.z.number().optional(),
});
