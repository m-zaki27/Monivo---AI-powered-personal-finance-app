import { z } from 'zod';

import { parseToCents } from '@/lib/money';
import { categoryColors, type CategoryColor } from '@/theme/tokens';

import { accountTypeSchema } from './models';

const colorKeys = Object.keys(categoryColors) as [CategoryColor, ...CategoryColor[]];

export const accountFormSchema = z
  .object({
    name: z.string().trim().min(1, 'Give this account a name').max(30, 'Keep it under 30 characters'),
    type: accountTypeSchema,
    institution: z.string().trim().max(40, 'Keep it under 40 characters'),
    last4: z.string().trim().refine((v) => v === '' || /^\d{4}$/.test(v), 'Use the last 4 digits only'),
    color: z.enum(colorKeys),
    /** Create only; for credit cards, the amount owed. */
    startingBalance: z.string(),
    isDefault: z.boolean(),
  })
  .refine((v) => v.startingBalance === '' || parseToCents(v.startingBalance) != null, {
    path: ['startingBalance'],
    message: 'Enter a valid amount',
  });
export type AccountFormValues = z.infer<typeof accountFormSchema>;

export const budgetFormSchema = z.object({
  monthlyLimit: z
    .string()
    .refine((v) => (parseToCents(v) ?? 0) >= 1_00, 'Set a budget of at least 1')
    .refine((v) => (parseToCents(v) ?? 0) <= 1_000_000_00, "That's more than we can track"),
  /** 0.5–1 */
  alertThreshold: z.number().min(0.5).max(1),
  emailAlerts: z.boolean(),
});
export type BudgetFormValues = z.infer<typeof budgetFormSchema>;
