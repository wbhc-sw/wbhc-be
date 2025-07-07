import { z } from 'zod';
import { INVESTMENT_PACKAGES } from '../utils/constants';

export const investorSchema = z.object({
  fullName: z.string().min(2, 'Full Name must be at least 2 characters'),
  phoneNumber: z
    .string()
    .optional()
    .refine(
      (val) => !val || /^\+?[1-9]\d{1,14}$/.test(val),
      'Invalid phone number format'
    ),
  investmentPackage: z.enum(INVESTMENT_PACKAGES),
  city: z.string().min(1, 'City is required'),
}); 