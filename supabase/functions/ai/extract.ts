import type { SupabaseClient } from 'npm:@supabase/supabase-js@2';

import { AiError, generateJson } from '../_shared/gemini.ts';

/** Receipt photos and voice notes: turn them into structured transactions. */

type Category = { id: string; name: string; kind: string };

async function categories(sb: SupabaseClient): Promise<Category[]> {
  const { data, error } = await sb.from('categories').select('id, name, kind').order('sort_order');
  if (error || !data) throw new AiError("Couldn't load categories.", 500);
  return data;
}

const isDay = (v: unknown): v is string => typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v);
const toCents = (v: unknown) => Math.round(Number(v) * 100);
const MAX_BASE64 = 14_000_000; // ~10 MB of media; Gemini allows 20 MB per request in total.

function media(body: Record<string, unknown>, field: string, allowed: RegExp) {
  const data = body[field];
  const mimeType = body.mimeType;
  if (typeof data !== 'string' || !data || data.length > MAX_BASE64) throw new AiError('That file is missing or too large.', 400);
  if (typeof mimeType !== 'string' || !allowed.test(mimeType)) throw new AiError("That file type isn't supported.", 400);
  return { mimeType, data };
}

export async function scanReceipt(sb: SupabaseClient, body: Record<string, unknown>) {
  const image = media(body, 'imageBase64', /^image\/(jpeg|png|webp|heic|heif)$/);
  const cats = (await categories(sb)).filter((c) => c.kind === 'expense');

  const r = await generateJson<{
    isReceipt: boolean;
    merchant: string;
    total: number;
    date: string | null;
    categoryId: string;
    confidence: number;
  }>({
    system:
      'You read photos of shopping receipts for a personal finance app. Extract the store name as people say it ' +
      '(e.g. "Whole Foods", not the legal entity), the final total actually paid (after tax and tips), the purchase ' +
      'date, and the best matching category. confidence is 0 to 1: lower it when the photo is blurry, cut off or ' +
      'ambiguous. If the image is not a receipt or bill, set isReceipt to false.',
    parts: [
      { text: `Today is ${isDay(body.today) ? body.today : 'unknown'}. Categories: ${cats.map((c) => `${c.id} = ${c.name}`).join('; ')}.` },
      { inlineData: image },
    ],
    schema: {
      type: 'OBJECT',
      properties: {
        isReceipt: { type: 'BOOLEAN' },
        merchant: { type: 'STRING' },
        total: { type: 'NUMBER', description: 'Total paid, in the currency units printed (e.g. 47.12)' },
        date: { type: 'STRING', nullable: true, description: 'YYYY-MM-DD, or null if not printed' },
        categoryId: { type: 'STRING', enum: cats.map((c) => c.id) },
        confidence: { type: 'NUMBER' },
      },
      required: ['isReceipt', 'merchant', 'total', 'categoryId', 'confidence'],
    },
  });

  if (!r.isReceipt) throw new AiError("That doesn't look like a receipt. Try again with the whole receipt in the frame.", 422);
  const total = toCents(r.total);
  if (!(total > 0)) throw new AiError("We couldn't find the total. Try a clearer photo, or add it manually.", 422);
  return {
    merchant: String(r.merchant).slice(0, 60) || 'Receipt',
    total,
    date: isDay(r.date) ? r.date : null,
    categoryId: cats.some((c) => c.id === r.categoryId) ? r.categoryId : 'cat_other',
    confidence: Math.min(1, Math.max(0, Number(r.confidence) || 0)),
  };
}

export async function parseVoice(sb: SupabaseClient, body: Record<string, unknown>) {
  const audio = media(body, 'audioBase64', /^audio\/[a-z0-9.+-]+$/);
  const cats = await categories(sb);

  const r = await generateJson<{
    transcript: string;
    items: { type: string; amount: number; merchant: string; categoryId: string; date: string }[];
  }>({
    system:
      'You transcribe short voice notes about money for a personal finance app, then pull out every transaction ' +
      'mentioned. One note can contain several ("12.50 for lunch at Chipotle and 40 on gas"). Amounts are in the ' +
      'units spoken ("twelve fifty" = 12.50). Money received (salary, refunds, someone paying you) is income; ' +
      'everything else is expense. Resolve relative dates like "yesterday" against today. If no amount is ' +
      'mentioned, return an empty items list. Never invent transactions.',
    parts: [
      { text: `Today is ${isDay(body.today) ? body.today : 'unknown'}. Categories: ${cats.map((c) => `${c.id} = ${c.name} (${c.kind})`).join('; ')}.` },
      { inlineData: audio },
    ],
    schema: {
      type: 'OBJECT',
      properties: {
        transcript: { type: 'STRING' },
        items: {
          type: 'ARRAY',
          items: {
            type: 'OBJECT',
            properties: {
              type: { type: 'STRING', enum: ['income', 'expense'] },
              amount: { type: 'NUMBER' },
              merchant: { type: 'STRING' },
              categoryId: { type: 'STRING', enum: cats.map((c) => c.id) },
              date: { type: 'STRING', description: 'YYYY-MM-DD' },
            },
            required: ['type', 'amount', 'merchant', 'categoryId', 'date'],
          },
        },
      },
      required: ['transcript', 'items'],
    },
  });

  const items = (r.items ?? [])
    .map((it) => {
      const type = it.type === 'income' ? 'income' : 'expense';
      const cat = cats.find((c) => c.id === it.categoryId && c.kind === type);
      return {
        type,
        amount: toCents(it.amount),
        merchant: String(it.merchant).slice(0, 60) || (type === 'income' ? 'Income' : 'Expense'),
        categoryId: cat?.id ?? (type === 'income' ? 'cat_salary' : 'cat_other'),
        date: isDay(it.date) ? it.date : null,
      };
    })
    .filter((it) => it.amount > 0)
    .slice(0, 10);

  return { transcript: String(r.transcript ?? ''), items };
}
