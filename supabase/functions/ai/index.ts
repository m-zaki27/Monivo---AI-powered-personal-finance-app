import { createClient } from 'npm:@supabase/supabase-js@2';

import { AiError } from '../_shared/gemini.ts';
import { json, withCors } from '../_shared/http.ts';

import { answer } from './assistant.ts';
import { parseVoice, scanReceipt } from './extract.ts';

/** Runs with the caller's JWT so RLS applies, and spends a daily allowance before calling Gemini. */

const DAILY_LIMITS = { scan: 20, voice: 30, assistant: 50 } as const;
type Action = keyof typeof DAILY_LIMITS;

const limitMessages: Record<Action, string> = {
  scan: "You've scanned 20 receipts today, the daily limit. Add this one manually, or scan again tomorrow.",
  voice: "You've used voice 30 times today, the daily limit. Add this one manually, or try again tomorrow.",
  assistant: "You've asked 50 questions today, the daily limit. I'll be ready again tomorrow.",
};

Deno.serve(withCors(async (req) => {
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  const token = (req.headers.get('Authorization') ?? '').replace(/^Bearer\s+/i, '');
  if (!token) return json({ error: 'Not signed in' }, 401);

  const sb = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY') ?? Deno.env.get('SUPABASE_PUBLISHABLE_KEY')!,
    { global: { headers: { Authorization: `Bearer ${token}` } }, auth: { persistSession: false, autoRefreshToken: false } },
  );
  const { error: authError } = await sb.auth.getClaims(token);
  if (authError) return json({ error: 'Your session ended. Log in again.' }, 401);

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return json({ error: 'Bad request' }, 400);
  }
  const action = body.action as Action;
  if (!(action in DAILY_LIMITS)) return json({ error: 'Unknown action' }, 400);

  const { data: allowed, error: quotaError } = await sb.rpc('consume_ai_quota', { p_kind: action, p_limit: DAILY_LIMITS[action] });
  if (quotaError) return json({ error: 'Something went wrong. Please try again.' }, 500);
  if (!allowed) return json({ error: limitMessages[action] }, 429);

  try {
    if (action === 'scan') return json(await scanReceipt(sb, body));
    if (action === 'voice') return json(await parseVoice(sb, body));
    return json(await answer(sb, body));
  } catch (e) {
    if (e instanceof AiError) return json({ error: e.message }, e.status);
    console.error('ai function error', e instanceof Error ? e.message : e);
    return json({ error: 'Something went wrong. Please try again.' }, 500);
  }
}));
