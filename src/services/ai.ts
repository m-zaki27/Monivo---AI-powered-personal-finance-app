import { addDays, startOfDay } from '@/lib/dates';
import type { TransactionType } from '@/schemas/models';

import { respond } from './mockServer';

/**
 * Mock "AI" endpoints. The real versions will send the photo / transcript to
 * the API; screens only depend on these function signatures and return types.
 */

export interface ReceiptExtraction {
  merchant: string;
  total: number;
  /** ISO */
  date: string;
  categoryId: string;
  /** 0–1: how sure the model is. The review screen flags low confidence. */
  confidence: number;
}

const sampleReceipts: Omit<ReceiptExtraction, 'date'>[] = [
  { merchant: 'Whole Foods Market', total: 47_12, categoryId: 'cat_groceries', confidence: 0.94 },
  { merchant: 'Starbucks', total: 6_45, categoryId: 'cat_food', confidence: 0.97 },
  { merchant: 'Target', total: 38_99, categoryId: 'cat_shopping', confidence: 0.81 },
  { merchant: 'Shell', total: 52_30, categoryId: 'cat_transport', confidence: 0.62 },
];

/** Pretends to read a receipt photo. Slower than other calls on purpose: real OCR + LLM takes a moment. */
export async function extractReceipt(_photoUri: string): Promise<ReceiptExtraction> {
  await new Promise((r) => setTimeout(r, 1800));
  return respond(() => {
    const pick = sampleReceipts[Math.floor(Math.random() * sampleReceipts.length)]!;
    const date = new Date();
    date.setMinutes(date.getMinutes() - 20);
    return { ...pick, date: date.toISOString() };
  });
}

/** Scripts the mock "speech recognizer" plays back word by word. */
export const sampleUtterances = [
  'Spent twelve fifty on lunch at Chipotle and forty two dollars on gas at Shell',
  'Paid eighteen dollars for an Uber to the airport yesterday',
  'Got paid two thousand eight hundred fifty from Northwind Labs',
  'Coffee at Starbucks for five forty five',
];

export interface ParsedItem {
  type: TransactionType;
  amount: number;
  merchant: string;
  categoryId: string;
  date: string;
}

/**
 * Pretends to turn speech into transactions. One sentence can hold several
 * ("lunch … and gas …"), so it returns a list.
 */
export function parseTranscript(text: string) {
  return respond<ParsedItem[]>(() => {
    const t = text.toLowerCase();
    const today = new Date();
    const at = (d: Date, h: number) => new Date(startOfDay(d).getTime() + h * 3_600_000).toISOString();
    const items: ParsedItem[] = [];
    if (t.includes('chipotle')) items.push({ type: 'expense', amount: 12_50, merchant: 'Chipotle', categoryId: 'cat_food', date: today.toISOString() });
    if (t.includes('shell')) items.push({ type: 'expense', amount: 42_00, merchant: 'Shell', categoryId: 'cat_transport', date: today.toISOString() });
    if (t.includes('uber')) items.push({ type: 'expense', amount: 18_00, merchant: 'Uber', categoryId: 'cat_transport', date: at(addDays(today, -1), 8) });
    if (t.includes('northwind')) items.push({ type: 'income', amount: 2_850_00, merchant: 'Northwind Labs', categoryId: 'cat_salary', date: today.toISOString() });
    if (t.includes('starbucks')) items.push({ type: 'expense', amount: 5_45, merchant: 'Starbucks', categoryId: 'cat_food', date: today.toISOString() });
    return items;
  });
}
