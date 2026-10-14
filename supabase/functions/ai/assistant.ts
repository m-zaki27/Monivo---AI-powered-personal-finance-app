import type { SupabaseClient } from 'npm:@supabase/supabase-js@2';

import { AiError, generateJson } from '../_shared/gemini.ts';

/**
 * The assistant. The *numbers* are always computed here from the user's own
 * rows (RLS-scoped client); Gemini only writes the sentence and picks which
 * pre-built card to show. So a card can never contain an invented figure.
 */

type Tx = { type: string; amount: number; merchant: string; category_id: string; date: string };
type Cat = { id: string; name: string; color: string };
type Card =
  | { kind: 'bars'; title: string; items: { label: string; value: number; color: string }[] }
  | { kind: 'budget'; spent: number; limit: number; threshold: number; projected: number; daysLeft: number }
  | { kind: 'stat'; label: string; value: number; deltaPct?: number; caption?: string };

const CARD_KEYS = ['none', 'top_categories', 'food_by_place', 'budget', 'subscriptions', 'biggest_expense', 'income'] as const;
type CardKey = (typeof CARD_KEYS)[number];

/** Paid once a month, so they mustn't be projected forward like daily spending. */
const FIXED = new Set(['cat_rent', 'cat_bills', 'cat_subscriptions']);

const sum = (ts: Tx[]) => ts.reduce((s, t) => s + Number(t.amount), 0);
function topBy(ts: Tx[], key: (t: Tx) => string, n: number): [string, number][] {
  const m = new Map<string, number>();
  ts.forEach((t) => m.set(key(t), (m.get(key(t)) ?? 0) + Number(t.amount)));
  return [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, n);
}

export async function answer(sb: SupabaseClient, body: Record<string, unknown>) {
  const question = typeof body.question === 'string' ? body.question.trim().slice(0, 500) : '';
  if (!question) throw new AiError('Ask me something about your money.', 400);
  // The app sends its *local* month boundaries, so "this month" is the user's month.
  const monthFrom = String(body.monthFrom ?? '');
  const prevFrom = String(body.prevMonthFrom ?? '');
  const prevSamePoint = String(body.prevSamePoint ?? '');
  const now = new Date(String(body.now ?? new Date().toISOString()));
  const daysInMonth = Number(body.daysInMonth) || 30;

  const [txRes, catRes, budgetRes, profileRes] = await Promise.all([
    sb.from('transactions').select('type, amount, merchant, category_id, date').gte('date', prevFrom).order('date'),
    sb.from('categories').select('id, name, color'),
    sb.from('budgets').select('monthly_limit, alert_threshold').maybeSingle(),
    sb.from('profiles').select('first_name, currency').single(),
  ]);
  if (txRes.error || catRes.error) throw new AiError("Couldn't load your data. Please try again.", 500);

  const tx = (txRes.data ?? []) as Tx[];
  const cats = (catRes.data ?? []) as Cat[];
  const cat = (id: string) => cats.find((c) => c.id === id);
  const currency = profileRes.data?.currency ?? 'USD';
  const fmt = (cents: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(cents / 100);

  const thisMonth = tx.filter((t) => t.date >= monthFrom);
  const lastMonth = tx.filter((t) => t.date < monthFrom);
  const expenses = thisMonth.filter((t) => t.type === 'expense');
  const spent = sum(expenses);
  const income = sum(thisMonth.filter((t) => t.type === 'income'));
  const byCategory = topBy(expenses, (t) => t.category_id, 5);
  const food = expenses.filter((t) => t.category_id === 'cat_food');
  const foodLastMonthSamePoint = sum(lastMonth.filter((t) => t.type === 'expense' && t.category_id === 'cat_food' && t.date <= prevSamePoint));
  const subs = topBy(lastMonth.concat(thisMonth).filter((t) => t.category_id === 'cat_subscriptions'), (t) => t.merchant, 6);
  const biggest = [...expenses].sort((a, b) => Number(b.amount) - Number(a.amount))[0];
  const day = now.getDate();
  const everyday = sum(expenses.filter((t) => !FIXED.has(t.category_id)));
  const projected = Math.round(spent + (everyday / Math.max(day, 1)) * (daysInMonth - day));
  const daysLeft = daysInMonth - day + 1;
  const budget = budgetRes.data ? { limit: Number(budgetRes.data.monthly_limit), threshold: Number(budgetRes.data.alert_threshold) } : null;

  // Facts the model may use, already formatted so it never does arithmetic.
  const facts = {
    name: profileRes.data?.first_name ?? '',
    currency,
    this_month: {
      spent: fmt(spent),
      income: fmt(income),
      top_categories: byCategory.map(([id, v]) => `${cat(id)?.name ?? 'Other'}: ${fmt(v)}`),
      food_and_drink: fmt(sum(food)),
      food_and_drink_same_point_last_month: fmt(foodLastMonthSamePoint),
      top_food_places: topBy(food, (t) => t.merchant, 4).map(([m, v]) => `${m}: ${fmt(v)}`),
      biggest_expense: biggest ? `${fmt(Number(biggest.amount))} at ${biggest.merchant}` : null,
      days_left: daysLeft,
      projected_month_end_spending: fmt(projected),
    },
    budget: budget
      ? { limit: fmt(budget.limit), used_percent: Math.round((spent / budget.limit) * 100), alert_at_percent: Math.round(budget.threshold * 100) }
      : 'not set (suggest setting one in Accounts → Budget)',
    subscriptions: subs.map(([m, v]) => `${m}: ${fmt(v)}`),
    transaction_count_this_month: thisMonth.length,
  };

  const history = Array.isArray(body.history)
    ? (body.history as { role: string; text: string }[])
        .slice(-6)
        .map((m) => `${m.role === 'user' ? 'User' : 'Assistant'}: ${String(m.text).slice(0, 400)}`)
        .join('\n')
    : '';

  const r = await generateJson<{ text: string; card: CardKey; followUps: string[] }>({
    system:
      "You are Monivo's money assistant. Answer in 1 to 3 short, friendly, plain-spoken sentences. " +
      'Use ONLY the facts provided; never invent or calculate new numbers, and quote amounts exactly as given. ' +
      'If the facts do not cover the question, say what you can help with (spending, categories, budget, ' +
      'subscriptions, income). Do not give investment, tax or legal advice. Pick the one card that best supports ' +
      'your answer, or "none". Suggest up to 3 short follow-up questions the user could ask next.',
    parts: [
      { text: `Facts (JSON): ${JSON.stringify(facts)}` },
      ...(history ? [{ text: `Conversation so far:\n${history}` }] : []),
      { text: `Question: ${question}` },
    ],
    schema: {
      type: 'OBJECT',
      properties: {
        text: { type: 'STRING' },
        card: { type: 'STRING', enum: [...CARD_KEYS] },
        followUps: { type: 'ARRAY', items: { type: 'STRING' }, maxItems: 3 },
      },
      required: ['text', 'card', 'followUps'],
    },
    temperature: 0.4,
  });

  // Cards are built from our own numbers, never from the model's text.
  const cards: Record<CardKey, Card | undefined> = {
    none: undefined,
    top_categories: byCategory.length
      ? { kind: 'bars', title: 'Top categories this month', items: byCategory.map(([id, v]) => ({ label: cat(id)?.name ?? 'Other', value: v, color: cat(id)?.color ?? 'tan' })) }
      : undefined,
    food_by_place: food.length
      ? { kind: 'bars', title: 'Food & drink by place', items: topBy(food, (t) => t.merchant, 4).map(([m, v]) => ({ label: m, value: v, color: 'amber' })) }
      : undefined,
    budget: budget ? { kind: 'budget', spent, limit: budget.limit, threshold: budget.threshold, projected, daysLeft } : undefined,
    subscriptions: subs.length
      ? { kind: 'bars', title: 'Subscriptions', items: subs.map(([m, v]) => ({ label: m, value: v, color: 'orange' })) }
      : undefined,
    biggest_expense: biggest ? { kind: 'stat', label: biggest.merchant, value: Number(biggest.amount), caption: cat(biggest.category_id)?.name } : undefined,
    income: { kind: 'stat', label: 'Income this month', value: income },
  };

  return {
    text: String(r.text ?? '').slice(0, 1200),
    card: cards[CARD_KEYS.includes(r.card) ? r.card : 'none'],
    followUps: (r.followUps ?? []).filter((f) => typeof f === 'string').slice(0, 3),
  };
}
