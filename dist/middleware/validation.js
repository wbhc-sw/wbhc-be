"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.companyUpdateSchema = exports.companyCreateSchema = exports.investorAdminUpdateSchema = exports.investorAdminCreateSchema = exports.investorSchema = void 0;
const zod_1 = require("zod");
// import { INVESTMENT_PACKAGES } from '../utils/constants';
exports.investorSchema = zod_1.z.object({
    fullName: zod_1.z.string().min(1, 'Full name is required'),
    phoneNumber: zod_1.z
        .string()
        .min(1, 'Phone number is required')
        .refine((val) => /^[0-9+\-\s()]+$/.test(val), 'Invalid phone number format'),
    companyID: zod_1.z.number().int().positive('Company ID must be a positive integer').optional(),
    sharesQuantity: zod_1.z.number().int().positive('Shares quantity must be a positive integer'),
    calculatedTotal: zod_1.z.number().positive('Calculated total must be a positive number'),
    city: zod_1.z.string().min(1, 'City is required'),
});
exports.investorAdminCreateSchema = zod_1.z.object({
    fullName: zod_1.z.string().min(1, 'Full name is required'),
    phoneNumber: zod_1.z
        .string()
        .optional()
        .refine((val) => !val || /^[0-9+\-\s()]+$/.test(val), 'Invalid phone number format'),
    companyID: zod_1.z.number().int().positive('Company ID must be a positive integer').optional(),
    sharesQuantity: zod_1.z.number().int().positive('Shares quantity must be a positive integer').optional(),
    calculatedTotal: zod_1.z.number().positive('Calculated total must be a positive number').optional(),
    city: zod_1.z.string().min(1, 'City is required'),
    source: zod_1.z.string().optional(),
    notes: zod_1.z.string().optional(),
    investmentAmount: zod_1.z.number().positive('Investment amount must be a positive number').optional(),
    callingTimes: zod_1.z.number().int().min(0, 'Calling times must be non-negative').optional(),
    leadStatus: zod_1.z.string().optional(),
    msgDate: zod_1.z.coerce.date().optional(),
});
exports.investorAdminUpdateSchema = zod_1.z.object({
    fullName: zod_1.z.string().min(1, 'Full name is required').optional(),
    phoneNumber: zod_1.z
        .string()
        .optional()
        .refine((val) => !val || /^[0-9+\-\s()]+$/.test(val), 'Invalid phone number format'),
    companyID: zod_1.z.number().int().positive('Company ID must be a positive integer').optional(),
    sharesQuantity: zod_1.z.number().int().positive('Shares quantity must be a positive integer').optional(),
    calculatedTotal: zod_1.z.number().positive('Calculated total must be a positive number').optional(),
    city: zod_1.z.string().min(1, 'City is required').optional(),
    source: zod_1.z.string().optional(),
    notes: zod_1.z.string().optional(),
    investmentAmount: zod_1.z.number().positive('Investment amount must be a positive number').optional(),
    leadStatus: zod_1.z.string().optional(),
    callingTimes: zod_1.z.number().int().min(0, 'Calling times must be non-negative').optional(),
    msgDate: zod_1.z.coerce.date().optional(),
});
exports.companyCreateSchema = zod_1.z.object({
    name: zod_1.z.string().min(1, 'Company name is required'),
    description: zod_1.z.string().optional(),
    phoneNumber: zod_1.z
        .string()
        .optional()
        .refine((val) => !val || /^[0-9+\-\s()]+$/.test(val), 'Invalid phone number format'),
    url: zod_1.z.string().url('Invalid URL format').optional().or(zod_1.z.literal('')),
});
exports.companyUpdateSchema = zod_1.z.object({
    name: zod_1.z.string().min(1, 'Company name is required').optional(),
    description: zod_1.z.string().optional(),
    phoneNumber: zod_1.z
        .string()
        .optional()
        .refine((val) => !val || /^[0-9+\-\s()]+$/.test(val), 'Invalid phone number format'),
    url: zod_1.z.string().url('Invalid URL format').optional().or(zod_1.z.literal('')),
});
