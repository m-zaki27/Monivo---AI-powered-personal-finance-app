import { addDays, daysInMonth, endOfMonth, startOfMonth } from '@/lib/dates';
import { formatMoney } from '@/lib/money';
import type { Transaction } from '@/schemas/models';
import type { CategoryColor } from '@/theme/tokens';

import { db, respond } from './mockServer';

/**
 * Mock assistant. It matches a few intents by keyword, but answers from the
 * real (mock) data, so numbers agree with Home. The real version will call an
 * LLM with tool access to the same data; screens only see `AssistantReply`.
 */

export type AnswerCard =
  | { kind: 'bars'; title: string; items: { label: string; value: number; color: CategoryColor }[] }
  | { kind: 'budget'; spent: number; limit: number; threshold: number; projected: number; daysLeft: number }
  | { kind: 'stat'; label: string; value: number; deltaPct?: number; caption?: string };

export interface AssistantReply {
  text: string;
  card?: AnswerCard;
  /** Suggested next questions */
  followUps?: string[];
}

export const starterPrompts = ['How much did I spend on food?', 'Am I on budget?', 'Where does my money go?', 'What are my subscriptions?'];

const THINK_MS = 900;

function inMonth(offset = 0) {
  const ref = new Date();
  ref.setMonth(ref.getMonth() + offset, 1);
  const from = startOfMonth(ref).toISOString();
  const to = endOfMonth(ref).toISOString();
  return db.transactions.filter((t) => t.date >= from && t.date <= to);
}

const expenses = (ts: Transaction[]) => ts.filter((t) => t.type === 'expense');
const total = (ts: Transaction[]) => ts.reduce((s, t) => s + t.amount, 0);
const cat = (id: string) => db.categories.find((c) => c.id === id);
const money = (c: number) => formatMoney(c, { currency: db.user.currency, hideZeroCents: true });

/** Group by a key, sum amounts, biggest first. */
function topBy(ts: Transaction[], key: (t: Transaction) => string, n: number) {
  const m = new Map<string, number>();
  ts.forEach((t) => m.set(key(t), (m.get(key(t)) ?? 0) + t.amount));
  return [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, n);
}

function food(): AssistantReply {
  const now = expenses(inMonth()).filter((t) => t.categoryId === 'cat_food');
  // Same point in last month, so the comparison is fair mid-month.
  const cutoff = addDays(new Date(), -daysInMonth(addDays(startOfMonth(new Date()), -1))).toISOString();
  const before = expenses(inMonth(-1)).filter((t) => t.categoryId === 'cat_food' && t.date <= cutoff);
  const spent = total(now);
  const prev = total(before);
  const deltaPct = prev ? Math.round(((spent - prev) / prev) * 100) : undefined;
  const top = topBy(now, (t) => t.merchant, 4);
  return {
    text:
      `You've spent ${money(spent)} on food and drink this month` +
      (deltaPct != null ? `, ${Math.abs(deltaPct)}% ${deltaPct > 0 ? 'more' : 'less'} than this point last month.` : '.') +
      (top[0] ? ` ${top[0][0]} is your top spot.` : ''),
    card: { kind: 'bars', title: 'Food & drink by place', items: top.map(([label, value]) => ({ label, value, color: 'amber' })) },
    followUps: ['Am I on budget?', 'What are my subscriptions?'],
  };
}

/** Paid once a month, so they mustn't be multiplied out like daily spending. */
const FIXED_CATEGORIES = new Set(['cat_rent', 'cat_bills', 'cat_subscriptions']);

function budget(): AssistantReply {
  const ex = expenses(inMonth());
  const spent = total(ex);
  const { monthlyLimit: limit, alertThreshold: threshold } = db.budget;
  const today = new Date();
  const dim = daysInMonth(today);
  // Projection = what's spent + everyday spending's daily average for the days left.
  // Extrapolating rent paid on the 1st would wildly overstate the month.
  const everyday = total(ex.filter((t) => !FIXED_CATEGORIES.has(t.categoryId)));
  const projected = Math.round(spent + (everyday / today.getDate()) * (dim - today.getDate()));
  const daysLeft = dim - today.getDate() + 1;
  const ratio = spent / limit;
  const text =
    ratio >= 1
      ? `You're over budget by ${money(spent - limit)}. Holding off on extras for the next ${daysLeft} days will help.`
      : projected > limit
        ? `You've used ${Math.round(ratio * 100)}% so far. At this pace you'd finish around ${money(projected)}, a bit over your ${money(limit)} limit.`
        : `You're on track: ${Math.round(ratio * 100)}% used with ${daysLeft} days to go. At this pace you'll end near ${money(projected)}.`;
  return { text, card: { kind: 'budget', spent, limit, threshold, projected, daysLeft }, followUps: ['Where does my money go?', 'How much did I spend on food?'] };
}

function breakdown(): AssistantReply {
  const ex = expenses(inMonth());
  const top = topBy(ex, (t) => t.categoryId, 5);
  const first = top[0] && cat(top[0][0]);
  return {
    text: `This month you've spent ${money(total(ex))}.${first ? ` ${first.name} is the biggest slice at ${money(top[0]![1])}.` : ''}`,
    card: {
      kind: 'bars',
      title: 'Top categories this month',
      items: top.map(([id, value]) => ({ label: cat(id)?.name ?? 'Other', value, color: cat(id)?.color ?? 'tan' })),
    },
    followUps: ['How much did I spend on food?', 'What was my biggest expense?'],
  };
}

function subscriptions(): AssistantReply {
  const subs = topBy(expenses(inMonth(-1)).filter((t) => t.categoryId === 'cat_subscriptions'), (t) => t.merchant, 6);
  const monthly = subs.reduce((s, [, v]) => s + v, 0);
  return {
    text: `You have ${subs.length} subscriptions costing about ${money(monthly)} a month, or ${money(monthly * 12)} a year.`,
    card: { kind: 'bars', title: 'Monthly subscriptions', items: subs.map(([label, value]) => ({ label, value, color: 'orange' })) },
    followUps: ['Am I on budget?'],
  };
}

function biggest(): AssistantReply {
  const top = [...expenses(inMonth())].sort((a, b) => b.amount - a.amount)[0];
  if (!top) return { text: "You haven't spent anything this month yet." };
  return {
    text: `Your biggest expense this month was ${money(top.amount)} at ${top.merchant}.`,
    card: { kind: 'stat', label: top.merchant, value: top.amount, caption: cat(top.categoryId)?.name },
    followUps: ['Where does my money go?'],
  };
}

function income(): AssistantReply {
  const now = total(inMonth().filter((t) => t.type === 'income'));
  return {
    text: `You've brought in ${money(now)} this month.`,
    card: { kind: 'stat', label: 'Income this month', value: now },
    followUps: ['Am I on budget?'],
  };
}

const intents: [RegExp, () => AssistantReply][] = [
  [/food|eat|restaurant|coffee|lunch|dinner|drink/, food],
  [/budget|on track|limit|overspend/, budget],
  [/subscri|netflix|spotify|recurring/, subscriptions],
  [/biggest|largest|most expensive/, biggest],
  [/income|earn|salary|paid me|paycheck/, income],
  [/where|categor|break ?down|spend|spent|money go/, breakdown],
];

export function ask(question: string) {
  return respond<AssistantReply>(() => {
    const q = question.toLowerCase();
    const match = intents.find(([re]) => re.test(q));
    if (match) return match[1]();
    return {
      text: "I'm still learning. Right now I can help with spending, your budget, categories and subscriptions.",
      followUps: starterPrompts.slice(0, 3),
    };
  });
}

/** Lets the typing indicator show for a believable moment. */
export async function askWithThinking(question: string) {
  await new Promise((r) => setTimeout(r, THINK_MS));
  return ask(question);
}
