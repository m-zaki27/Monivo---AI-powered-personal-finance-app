import { FunctionsHttpError } from '@supabase/supabase-js';

import { dayKey, startOfDay } from '@/lib/dates';
import { supabase } from '@/lib/supabase';
import type { TransactionType } from '@/schemas/models';

import { ApiError } from './errors';

// Gemini runs in the `ai` Edge Function so its key stays server-side.

/** Maps the function's `{ error }` replies to ApiErrors. */
export async function invokeAi<T>(body: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase.functions.invoke('ai', { body });
  if (!error) return data as T;
  if (error instanceof FunctionsHttpError) {
    const res = error.context as Response;
    const payload = (await res.json().catch(() => null)) as { error?: string } | null;
    throw new ApiError(payload?.error ?? 'Something went wrong. Please try again.', res.status);
  }
  throw new ApiError("We couldn't reach Monivo. Check your connection and try again.", 0);
}

// Today → now; other days → local noon, so the date survives time-zone shifts.
function dayToIso(day: string | null): string {
  if (!day || day === dayKey(new Date())) return new Date().toISOString();
  const [y, m, d] = day.split('-').map(Number);
  return new Date(y!, m! - 1, d!, 12).toISOString();
}

export type ReceiptPhoto = 'sample' | { uri: string; base64: string; mimeType: string };

export interface ReceiptExtraction {
  merchant: string;
  total: number;
  /** ISO */
  date: string;
  categoryId: string;
  /** 0–1 model confidence */
  confidence: number;
}

export async function extractReceipt(photo: ReceiptPhoto): Promise<ReceiptExtraction> {
  if (photo === 'sample') {
    // Offline demo for devices without a camera.
    await new Promise((r) => setTimeout(r, 1500));
    const date = new Date();
    date.setMinutes(date.getMinutes() - 20);
    return { merchant: 'Whole Foods Market', total: 47_12, categoryId: 'cat_groceries', confidence: 0.94, date: date.toISOString() };
  }
  const r = await invokeAi<Omit<ReceiptExtraction, 'date'> & { date: string | null }>({
    action: 'scan',
    imageBase64: photo.base64,
    mimeType: photo.mimeType,
    today: dayKey(new Date()),
  });
  return { ...r, date: dayToIso(r.date) };
}

export interface ParsedItem {
  type: TransactionType;
  amount: number;
  merchant: string;
  categoryId: string;
  date: string;
}

export interface VoiceResult {
  transcript: string;
  items: ParsedItem[];
}

/** Demo transcripts are parsed locally, without Gemini. */
export type VoiceInput = { kind: 'audio'; base64: string; mimeType: string } | { kind: 'demo'; transcript: string };

export async function processVoice(input: VoiceInput): Promise<VoiceResult> {
  if (input.kind === 'demo') return { transcript: input.transcript, items: parseDemoTranscript(input.transcript) };
  const r = await invokeAi<{ transcript: string; items: (Omit<ParsedItem, 'date'> & { date: string | null })[] }>({
    action: 'voice',
    audioBase64: input.base64,
    mimeType: input.mimeType,
    today: dayKey(new Date()),
  });
  return { transcript: r.transcript, items: r.items.map((it) => ({ ...it, date: dayToIso(it.date) })) };
}

/** Voice demo input when no microphone is available. */
export const sampleUtterances = [
  'Spent twelve fifty on lunch at Chipotle and forty two dollars on gas at Shell',
  'Paid eighteen dollars for an Uber to the airport yesterday',
  'Coffee at Starbucks for five forty five',
];

function parseDemoTranscript(text: string): ParsedItem[] {
  const t = text.toLowerCase();
  const now = new Date().toISOString();
  const yesterdayMorning = new Date(startOfDay(new Date()).getTime() - 16 * 3_600_000).toISOString();
  const items: ParsedItem[] = [];
  if (t.includes('chipotle')) items.push({ type: 'expense', amount: 12_50, merchant: 'Chipotle', categoryId: 'cat_food', date: now });
  if (t.includes('shell')) items.push({ type: 'expense', amount: 42_00, merchant: 'Shell', categoryId: 'cat_transport', date: now });
  if (t.includes('uber')) items.push({ type: 'expense', amount: 18_00, merchant: 'Uber', categoryId: 'cat_transport', date: yesterdayMorning });
  if (t.includes('starbucks')) items.push({ type: 'expense', amount: 5_45, merchant: 'Starbucks', categoryId: 'cat_food', date: now });
  return items;
}
