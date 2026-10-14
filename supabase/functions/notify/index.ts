import { createClient, type SupabaseClient } from 'npm:@supabase/supabase-js@2';

import { generateJson } from '../_shared/gemini.ts';
import { json } from '../_shared/http.ts';
import { sendEmail } from '../_shared/mailer.ts';
import { unsubscribeUrl } from '../_shared/unsubscribe.ts';

import { budgetAlertEmail, weeklyRecapEmail } from './templates.ts';

/**
 * Sends due notification emails. Called by pg_cron (with the Vault cron
 * secret) every 15 minutes for budget alerts and hourly for weekly recaps.
 * Uses the service role: it reads across users, so it never runs for a user.
 *
 * Also accepts a manual "preview" (service-role key only) that renders one
 * user's email and sends it to a chosen address, without logging it.
 */

/** Keeps each run well inside the free plan's time limit; the rest go next run. */
const MAX_PER_RUN = 20;
const APP_URL = 'monivo://';

type Tx = { type: string; amount: number; category_id: string; date: string };
type Cat = { id: string; name: string; color: string };

const money = (cents: number, currency: string) => new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(cents / 100);
const moneyShort = (cents: number, currency: string) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency, maximumFractionDigits: cents % 100 === 0 ? 0 : 2 }).format(cents / 100);

/** Year/month/day/hour in the user's own time zone. */
function localParts(tz: string, date = new Date()) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-US', { timeZone: tz, year: 'numeric', month: 'numeric', day: 'numeric' })
      .formatToParts(date)
      .map((p) => [p.type, p.value]),
  );
  return { year: Number(parts.year), month: Number(parts.month), day: Number(parts.day) };
}

function topCategories(tx: Tx[], cats: Map<string, Cat>, n: number) {
  const m = new Map<string, { total: number; count: number }>();
  for (const t of tx.filter((x) => x.type === 'expense')) {
    const e = m.get(t.category_id) ?? { total: 0, count: 0 };
    e.total += Number(t.amount);
    e.count++;
    m.set(t.category_id, e);
  }
  return [...m.entries()]
    .sort((a, b) => b[1].total - a[1].total)
    .slice(0, n)
    .map(([id, v]) => ({ id, name: cats.get(id)?.name ?? 'Other', color: cats.get(id)?.color ?? 'tan', ...v }));
}

async function loadCategories(admin: SupabaseClient) {
  const { data } = await admin.from('categories').select('id, name, color');
  return new Map((data ?? []).map((c: Cat) => [c.id, c]));
}

/** Claims (user, kind, period) in the log. False = someone already sent it. */
async function claim(admin: SupabaseClient, userId: string, kind: string, period: string) {
  const { error } = await admin.from('notification_log').insert({ user_id: userId, kind, period });
  return !error;
}

async function release(admin: SupabaseClient, userId: string, kind: string, period: string) {
  await admin.from('notification_log').delete().match({ user_id: userId, kind, period });
}

// ---------------------------------------------------------------------------

type BudgetCandidate = {
  user_id: string; email: string; first_name: string; currency: string; timezone: string;
  monthly_limit: number; alert_threshold: number; spent: number; period: string;
};

async function buildBudgetAlert(admin: SupabaseClient, c: BudgetCandidate, cats: Map<string, Cat>) {
  const { year, month, day } = localParts(c.timezone);
  const daysInMonth = new Date(year, month, 0).getDate();
  const daysLeft = daysInMonth - day + 1;
  const monthStart = new Date(Date.UTC(year, month - 1, 1) - 14 * 3_600_000).toISOString(); // generous; filtered by period below
  const { data } = await admin.from('transactions').select('type, amount, category_id, date').eq('user_id', c.user_id).gte('date', monthStart);
  const monthTx = ((data ?? []) as Tx[]).filter((t) => {
    const p = localParts(c.timezone, new Date(t.date));
    return p.year === year && p.month === month;
  });
  const spent = Number(c.spent);
  const limit = Number(c.monthly_limit);
  const remaining = limit - spent;
  return budgetAlertEmail({
    firstName: c.first_name,
    email: c.email,
    monthName: new Intl.DateTimeFormat('en-US', { month: 'long', timeZone: c.timezone }).format(new Date()),
    usedPercent: Math.round((spent / limit) * 100),
    thresholdPercent: Math.round(Number(c.alert_threshold) * 100),
    spent: money(spent, c.currency),
    limit: moneyShort(limit, c.currency),
    remaining: money(Math.abs(remaining), c.currency),
    daysLeft,
    perDay: money(Math.max(remaining, 0) / daysLeft, c.currency),
    over: remaining < 0,
    topCategories: topCategories(monthTx, cats, 3).map((t) => ({ name: t.name, amount: money(t.total, c.currency), color: t.color })),
    appUrl: `${APP_URL}budget`,
    unsubscribeUrl: await unsubscribeUrl(c.user_id, 'budget_alert'),
  });
}

// ---------------------------------------------------------------------------

type RecapCandidate = {
  user_id: string; email: string; first_name: string; currency: string; timezone: string;
  week_start: string; week_end: string; period: string;
};

async function recapTips(facts: Record<string, unknown>) {
  try {
    const r = await generateJson<{ tips: { title: string; body: string }[] }>({
      system:
        'You write two short, friendly, practical money tips for a weekly email from a personal finance app. ' +
        'Base them ONLY on the facts given; quote amounts exactly as given and never invent numbers. Each tip: a ' +
        'title under 50 characters and a body of one or two sentences. No investment, tax or legal advice.',
      parts: [{ text: `Facts (JSON): ${JSON.stringify(facts)}` }],
      schema: {
        type: 'OBJECT',
        properties: {
          tips: {
            type: 'ARRAY',
            minItems: 2,
            maxItems: 2,
            items: { type: 'OBJECT', properties: { title: { type: 'STRING' }, body: { type: 'STRING' } }, required: ['title', 'body'] },
          },
        },
        required: ['tips'],
      },
      temperature: 0.6,
    });
    return r.tips.slice(0, 2).map((t) => ({ title: String(t.title).slice(0, 80), body: String(t.body).slice(0, 300) }));
  } catch {
    // The recap still goes out without AI tips rather than not at all.
    return [
      { title: 'Check your top category', body: 'A quick look at where most of last week went is the easiest way to spot savings.' },
      { title: 'Log as you go', body: 'Adding spending the moment it happens keeps your budget accurate. Scanning receipts takes seconds.' },
    ];
  }
}

async function buildWeeklyRecap(admin: SupabaseClient, c: RecapCandidate, cats: Map<string, Cat>) {
  const weekStart = new Date(c.week_start);
  const weekEnd = new Date(c.week_end);
  const prevStart = new Date(weekStart.getTime() - 7 * 86_400_000);
  const { data } = await admin
    .from('transactions')
    .select('type, amount, category_id, date')
    .eq('user_id', c.user_id)
    .gte('date', prevStart.toISOString())
    .lt('date', weekEnd.toISOString());
  const all = (data ?? []) as Tx[];
  const week = all.filter((t) => new Date(t.date) >= weekStart);
  const prev = all.filter((t) => new Date(t.date) < weekStart);
  const sum = (ts: Tx[], type: string) => ts.filter((t) => t.type === type).reduce((s, t) => s + Number(t.amount), 0);
  const spent = sum(week, 'expense');
  const prevSpent = sum(prev, 'expense');
  const income = sum(week, 'income');
  const top = topCategories(week, cats, 3);
  const change = prevSpent > 0 ? Math.round(((spent - prevSpent) / prevSpent) * 100) : null;

  const { data: budget } = await admin.from('budgets').select('monthly_limit').eq('user_id', c.user_id).maybeSingle();
  const { year, month } = localParts(c.timezone);
  const { data: monthRows } = await admin
    .from('transactions')
    .select('type, amount, category_id, date')
    .eq('user_id', c.user_id)
    .eq('type', 'expense')
    .gte('date', new Date(Date.UTC(year, month - 1, 1) - 14 * 3_600_000).toISOString());
  const monthSpent = ((monthRows ?? []) as Tx[])
    .filter((t) => {
      const p = localParts(c.timezone, new Date(t.date));
      return p.year === year && p.month === month;
    })
    .reduce((s, t) => s + Number(t.amount), 0);
  const budgetLabel = budget ? `${Math.round((monthSpent / Number(budget.monthly_limit)) * 100)}% used` : 'Not set';

  const fmtDay = (d: Date) => new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', timeZone: c.timezone }).format(d);
  const weekLabel = `${fmtDay(weekStart)} – ${fmtDay(new Date(weekEnd.getTime() - 1))}`;
  const name = c.first_name ? `, ${c.first_name}` : '';
  const headline =
    week.length === 0 ? `A quiet week${name}. Nothing logged.` : change != null && change < 0 ? `Nice week${name}. You spent a little less.` : `Here's your week${name}.`;

  const tips = week.length
    ? await recapTips({
        spent_this_week: money(spent, c.currency),
        spent_week_before: money(prevSpent, c.currency),
        income_this_week: money(income, c.currency),
        top_categories: top.map((t) => `${t.name}: ${money(t.total, c.currency)} over ${t.count} transactions`),
        budget: budgetLabel,
      })
    : [{ title: 'Pick up where you left off', body: 'Log this week as you go and next Monday’s recap will show where your money went.' }];

  return weeklyRecapEmail({
    firstName: c.first_name,
    email: c.email,
    weekLabel,
    headline,
    spent: money(spent, c.currency),
    changeLabel: change == null ? null : `${change <= 0 ? '↓' : '↑'} ${Math.abs(change)}% vs week before`,
    changeDown: change != null && change <= 0,
    income: moneyShort(income, c.currency),
    budgetLabel,
    topCategories: top.map((t) => ({
      name: t.name,
      amount: money(t.total, c.currency),
      count: t.count,
      color: t.color,
      percent: top[0] ? (t.total / top[0].total) * 100 : 0,
    })),
    tips,
    appUrl: APP_URL,
    unsubscribeUrl: await unsubscribeUrl(c.user_id, 'weekly_recap'),
  });
}

// ---------------------------------------------------------------------------

Deno.serve(async (req) => {
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const admin = createClient(Deno.env.get('SUPABASE_URL')!, serviceKey, { auth: { persistSession: false } });

  // Cron proves itself with the Vault secret; manual previews need the service-role key.
  const cronSecret = req.headers.get('x-cron-secret') ?? '';
  const bearer = (req.headers.get('Authorization') ?? '').replace(/^Bearer\s+/i, '');
  const isAdmin = bearer === serviceKey;
  let isCron = false;
  if (cronSecret) {
    const { data } = await admin.rpc('check_cron_secret', { p_secret: cronSecret });
    isCron = data === true;
  }
  if (!isCron && !isAdmin) return json({ error: 'Forbidden' }, 403);

  const body = await req.json().catch(() => ({}));
  const cats = await loadCategories(admin);

  // Manual preview: render one user's email and send it to `to`. Not logged.
  if (body.mode === 'preview' && isAdmin) {
    const { data: u } = await admin.from('profiles').select('id, first_name, currency, timezone').eq('id', body.userId).single();
    if (!u) return json({ error: 'No such user' }, 404);
    const email = String(body.to);
    if (body.kind === 'budget') {
      const { data: b } = await admin.from('budgets').select('*').eq('user_id', u.id).single();
      const { year, month } = localParts(u.timezone);
      const { data: tx } = await admin.from('transactions').select('type, amount, category_id, date').eq('user_id', u.id).eq('type', 'expense');
      const spent = ((tx ?? []) as Tx[]).filter((t) => localParts(u.timezone, new Date(t.date)).month === month && localParts(u.timezone, new Date(t.date)).year === year).reduce((s, t) => s + Number(t.amount), 0);
      const mail = await buildBudgetAlert(admin, { user_id: u.id, email, first_name: u.first_name, currency: u.currency, timezone: u.timezone, monthly_limit: b.monthly_limit, alert_threshold: b.alert_threshold, spent, period: 'preview' }, cats);
      await sendEmail(email, `[Preview] ${mail.subject}`, mail.html);
    } else {
      const now = Date.now();
      const mail = await buildWeeklyRecap(admin, { user_id: u.id, email, first_name: u.first_name, currency: u.currency, timezone: u.timezone, week_start: new Date(now - 7 * 86_400_000).toISOString(), week_end: new Date(now).toISOString(), period: 'preview' }, cats);
      await sendEmail(email, `[Preview] ${mail.subject}`, mail.html);
    }
    return json({ ok: true });
  }

  const mode = body.mode === 'recap' ? 'recap' : 'budget';
  const kind = mode === 'recap' ? 'weekly_recap' : 'budget_alert';
  const rpc = mode === 'recap' ? 'weekly_recap_candidates' : 'budget_alert_candidates';
  const { data: candidates, error } = await admin.rpc(rpc);
  if (error) {
    console.error('candidates failed', error.message);
    return json({ error: 'Could not load recipients' }, 500);
  }

  let sent = 0;
  let failed = 0;
  for (const c of (candidates ?? []).slice(0, MAX_PER_RUN)) {
    if (!(await claim(admin, c.user_id, kind, c.period))) continue;
    try {
      const mail = mode === 'recap' ? await buildWeeklyRecap(admin, c, cats) : await buildBudgetAlert(admin, c, cats);
      await sendEmail(c.email, mail.subject, mail.html);
      sent++;
    } catch (e) {
      // Un-claim so the next run tries again.
      await release(admin, c.user_id, kind, c.period);
      failed++;
      console.error('send failed', kind, e instanceof Error ? e.message : e);
    }
  }
  return json({ mode, due: candidates?.length ?? 0, sent, failed });
});
