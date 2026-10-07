import { z } from 'zod';

import { categoryColors } from '@/theme/tokens';

/**
 * Domain models. Defining them as Zod schemas means the real API's responses
 * can later be validated with `.parse()` — and the TS types come for free.
 */

const cents = z.number().int();
const colorKey = z.enum(Object.keys(categoryColors) as [keyof typeof categoryColors, ...(keyof typeof categoryColors)[]]);

export const transactionTypeSchema = z.enum(['income', 'expense']);
export type TransactionType = z.infer<typeof transactionTypeSchema>;

export const categoryIconSchema = z.enum([
  'coffee',
  'basket',
  'car',
  'bag',
  'film',
  'repeat',
  'zap',
  'heart',
  'home',
  'plane',
  'briefcase',
  'shapes',
]);
export type CategoryIcon = z.infer<typeof categoryIconSchema>;

export const categorySchema = z.object({
  id: z.string(),
  name: z.string(),
  icon: categoryIconSchema,
  color: colorKey,
  kind: transactionTypeSchema,
});
export type Category = z.infer<typeof categorySchema>;

export const accountTypeSchema = z.enum(['cash', 'bank', 'credit']);
export type AccountType = z.infer<typeof accountTypeSchema>;

export const accountSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: accountTypeSchema,
  institution: z.string().optional(),
  last4: z.string().length(4).optional(),
  /** Balance before the first transaction we know about */
  openingBalance: cents,
  color: colorKey,
  isDefault: z.boolean(),
  createdAt: z.string(),
});
export type Account = z.infer<typeof accountSchema>;

/** What the API returns for lists: stored fields + derived ones. */
export type AccountWithBalance = Account & { balance: number; transactionCount: number };

export const transactionSourceSchema = z.enum(['manual', 'scan', 'voice']);
export type TransactionSource = z.infer<typeof transactionSourceSchema>;

export const transactionSchema = z.object({
  id: z.string(),
  type: transactionTypeSchema,
  /** Always positive; `type` carries the sign. */
  amount: cents.positive(),
  merchant: z.string(),
  categoryId: z.string(),
  accountId: z.string(),
  date: z.string(),
  note: z.string().optional(),
  source: transactionSourceSchema,
});
export type Transaction = z.infer<typeof transactionSchema>;

export const budgetSchema = z.object({
  monthlyLimit: cents.positive(),
  /** 0–1, e.g. 0.8 = warn at 80% */
  alertThreshold: z.number().min(0.5).max(1),
  emailAlerts: z.boolean(),
});
export type Budget = z.infer<typeof budgetSchema>;

export const userSchema = z.object({
  id: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  email: z.email(),
  currency: z.string().length(3),
  mfaEnabled: z.boolean(),
  notifications: z.object({
    push: z.boolean(),
    weeklyRecap: z.boolean(),
  }),
});
export type User = z.infer<typeof userSchema>;
