import { z } from 'zod';

import { centsToInput, parseToCents } from '@/lib/money';

import { transactionTypeSchema, type TransactionSource, type TransactionType } from './models';

/** One million in cents — a sanity cap that catches a stray extra zero. */
const MAX_CENTS = 1_000_000_00;

/**
 * The form works with what the user typed (amount as a string like "12.5").
 * Converting to integer cents happens once, in `formToDraft`, so a half-typed
 * "12." never becomes a number by accident.
 */
export const transactionFormSchema = z.object({
  type: transactionTypeSchema,
  amount: z
    .string()
    .refine((v) => (parseToCents(v) ?? 0) > 0, 'Enter an amount above zero')
    .refine((v) => (parseToCents(v) ?? 0) <= MAX_CENTS, "That's more than we can track in one go"),
  merchant: z.string().trim().min(1, 'Add who you paid, or who paid you').max(60, 'Keep it under 60 characters'),
  categoryId: z.string().min(1, 'Pick a category'),
  accountId: z.string().min(1, 'Pick an account'),
  /** ISO string */
  date: z.string().min(1),
  note: z.string().trim().max(140, 'Keep notes under 140 characters'),
});
export type TransactionFormValues = z.infer<typeof transactionFormSchema>;

/** The scan review only edits these four; the rest comes from defaults. */
export const receiptReviewSchema = transactionFormSchema.pick({ amount: true, merchant: true, categoryId: true, date: true });
export type ReceiptReviewValues = z.infer<typeof receiptReviewSchema>;

/**
 * A transaction that hasn't been saved yet. Manual entry, receipt scans and
 * voice all produce drafts; the confirm screen saves them. `key` is local only.
 */
export interface Draft {
  key: string;
  type: TransactionType;
  amount: number;
  merchant: string;
  categoryId: string;
  accountId: string;
  date: string;
  note?: string;
  source: TransactionSource;
}

let draftCounter = 0;
export const newDraftKey = () => `draft_${Date.now().toString(36)}_${++draftCounter}`;

export function formToDraft(v: TransactionFormValues, source: TransactionSource, key = newDraftKey()): Draft {
  return {
    key,
    type: v.type,
    amount: parseToCents(v.amount) ?? 0,
    merchant: v.merchant.trim(),
    categoryId: v.categoryId,
    accountId: v.accountId,
    date: v.date,
    note: v.note.trim() || undefined,
    source,
  };
}

export function draftToForm(d: Draft): TransactionFormValues {
  return {
    type: d.type,
    amount: d.amount ? centsToInput(d.amount).replace(/\.00$/, '') : '',
    merchant: d.merchant,
    categoryId: d.categoryId,
    accountId: d.accountId,
    date: d.date,
    note: d.note ?? '',
  };
}
