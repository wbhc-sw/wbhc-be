import { z } from 'zod';
// import { INVESTMENT_PACKAGES } from '../utils/constants';

export const investorSchema = z.object({
  fullName: z.string().min(2, 'Full Name must be at least 2 characters'),
  phoneNumber: z
    .string()
    .optional()
    .refine(
      (val) => !val || /^[0-9+\-\s()]+$/.test(val),
      'Invalid phone number format'
    ),
  investmentPackage: z.string().min(1, 'Investment package is required'),
  city: z.string().min(1, 'City is required'),
}); 