import { z } from 'zod';
// import { INVESTMENT_PACKAGES } from '../utils/constants';

export const investorSchema = z.object({
  fullName: z.string().min(1, 'Full name is required'),
  phoneNumber: z
    .string()
    .min(1, 'Phone number is required')
    .refine(
      (val) => /^[0-9+\-\s()]+$/.test(val),
      'Invalid phone number format'
    ),
  companyID: z.number().int().positive('Company ID must be a positive integer').optional(),
  sharesQuantity: z.number().int().positive('Shares quantity must be a positive integer'),
  calculatedTotal: z.number().positive('Calculated total must be a positive number'),
  city: z.string().min(1, 'City is required'),
});

export const investorAdminCreateSchema = z.object({
  fullName: z.string().min(1, 'Full name is required'),
  phoneNumber: z
    .string()
    .optional()
    .refine(
      (val) => !val || /^[0-9+\-\s()]+$/.test(val),
      'Invalid phone number format'
    ),
  companyID: z.number().int().positive('Company ID must be a positive integer').optional(),
  sharesQuantity: z.number().int().positive('Shares quantity must be a positive integer').optional(),
  calculatedTotal: z.number().positive('Calculated total must be a positive number').optional(),
  city: z.string().min(1, 'City is required'),
  submissionStatus: z.string().optional(),
  notes: z.string().optional(),
  investmentAmount: z.number().positive('Investment amount must be a positive number').optional(),
});

export const investorAdminUpdateSchema = z.object({
  fullName: z.string().min(1, 'Full name is required').optional(),
  phoneNumber: z
    .string()
    .optional()
    .refine(
      (val) => !val || /^[0-9+\-\s()]+$/.test(val),
      'Invalid phone number format'
    ),
  companyID: z.number().int().positive('Company ID must be a positive integer').optional(),
  sharesQuantity: z.number().int().positive('Shares quantity must be a positive integer').optional(),
  calculatedTotal: z.number().positive('Calculated total must be a positive number').optional(),
  city: z.string().min(1, 'City is required').optional(),
  submissionStatus: z.string().optional(),
  notes: z.string().optional(),
  investmentAmount: z.number().positive('Investment amount must be a positive number').optional(),
});

export const companyCreateSchema = z.object({
  name: z.string().min(1, 'Company name is required'),
  description: z.string().optional(),
  phoneNumber: z
    .string()
    .optional()
    .refine(
      (val) => !val || /^[0-9+\-\s()]+$/.test(val),
      'Invalid phone number format'
    ),
  url: z.string().url('Invalid URL format').optional().or(z.literal('')),
});

export const companyUpdateSchema = z.object({
  name: z.string().min(1, 'Company name is required').optional(),
  description: z.string().optional(),
  phoneNumber: z
    .string()
    .optional()
    .refine(
      (val) => !val || /^[0-9+\-\s()]+$/.test(val),
      'Invalid phone number format'
    ),
  url: z.string().url('Invalid URL format').optional().or(z.literal('')),
}); 