import { addDays, startOfDay } from '@/lib/dates';
import type { Transaction } from '@/schemas/models';

/**
 * ~4 months of believable history ending today.
 * A seeded PRNG (mulberry32) makes the "random" data identical on every
 * reload, so bugs are reproducible and screenshots don't shuffle.
 */
function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const HISTORY_DAYS = 120;

type Draft = Omit<Transaction, 'id' | 'source' | 'date'> & { hour: number };

interface RandomRule {
  merchant: string;
  categoryId: string;
  /** Probability per day */
  chance: number;
  /** Range in cents */
  min: number;
  max: number;
  accounts: string[];
  hours: [number, number];
  weekendOnly?: boolean;
}

const randomRules: RandomRule[] = [
  { merchant: 'Starbucks', categoryId: 'cat_food', chance: 0.5, min: 4_45, max: 7_85, accounts: ['acc_card', 'acc_card', 'acc_cash'], hours: [7, 10] },
  { merchant: 'Uber', categoryId: 'cat_transport', chance: 0.18, min: 9_20, max: 28_60, accounts: ['acc_card'], hours: [8, 23] },
  { merchant: 'Lyft', categoryId: 'cat_transport', chance: 0.06, min: 11_00, max: 24_00, accounts: ['acc_card'], hours: [17, 23] },
  { merchant: 'Amazon', categoryId: 'cat_shopping', chance: 0.14, min: 12_99, max: 89_99, accounts: ['acc_card'], hours: [12, 22] },
  { merchant: 'Chipotle', categoryId: 'cat_food', chance: 0.14, min: 11_25, max: 16_80, accounts: ['acc_card', 'acc_bank'], hours: [12, 14] },
  { merchant: 'Sweetgreen', categoryId: 'cat_food', chance: 0.08, min: 13_45, max: 17_95, accounts: ['acc_card'], hours: [12, 14] },
  { merchant: 'Whole Foods', categoryId: 'cat_groceries', chance: 0.55, min: 38_00, max: 124_00, accounts: ['acc_bank', 'acc_card'], hours: [10, 18], weekendOnly: true },
  { merchant: "Trader Joe's", categoryId: 'cat_groceries', chance: 0.1, min: 22_00, max: 68_00, accounts: ['acc_bank'], hours: [17, 20] },
  { merchant: 'Shell', categoryId: 'cat_transport', chance: 0.12, min: 34_00, max: 56_00, accounts: ['acc_card'], hours: [7, 19] },
  { merchant: 'Target', categoryId: 'cat_shopping', chance: 0.06, min: 18_00, max: 84_00, accounts: ['acc_bank', 'acc_card'], hours: [11, 20] },
  { merchant: 'AMC Theatres', categoryId: 'cat_entertainment', chance: 0.05, min: 18_50, max: 32_00, accounts: ['acc_card'], hours: [18, 21] },
  { merchant: 'CVS Pharmacy', categoryId: 'cat_health', chance: 0.05, min: 8_49, max: 29_99, accounts: ['acc_bank', 'acc_cash'], hours: [9, 20] },
  { merchant: 'Farmers Market', categoryId: 'cat_groceries', chance: 0.3, min: 12_00, max: 34_00, accounts: ['acc_cash'], hours: [9, 12], weekendOnly: true },
  { merchant: 'Joe’s Pizza', categoryId: 'cat_food', chance: 0.06, min: 8_00, max: 22_00, accounts: ['acc_cash'], hours: [19, 22] },
];

interface MonthlyRule {
  day: number;
  merchant: string;
  categoryId: string;
  amount: number | [number, number];
  accountId: string;
  type?: 'income' | 'expense';
  note?: string;
}

const monthlyRules: MonthlyRule[] = [
  { day: 1, merchant: 'Northwind Labs', categoryId: 'cat_salary', amount: 2_850_00, accountId: 'acc_bank', type: 'income', note: 'Payroll' },
  { day: 15, merchant: 'Northwind Labs', categoryId: 'cat_salary', amount: 2_850_00, accountId: 'acc_bank', type: 'income', note: 'Payroll' },
  { day: 1, merchant: 'Parkside Apartments', categoryId: 'cat_rent', amount: 1_650_00, accountId: 'acc_bank', note: 'Monthly rent' },
  { day: 5, merchant: 'Planet Fitness', categoryId: 'cat_health', amount: 24_99, accountId: 'acc_card' },
  { day: 7, merchant: 'Netflix', categoryId: 'cat_subscriptions', amount: 15_49, accountId: 'acc_card' },
  { day: 12, merchant: 'Spotify', categoryId: 'cat_subscriptions', amount: 11_99, accountId: 'acc_card' },
  { day: 18, merchant: 'Con Edison', categoryId: 'cat_bills', amount: [78_00, 124_00], accountId: 'acc_bank' },
  { day: 20, merchant: 'iCloud+', categoryId: 'cat_subscriptions', amount: 2_99, accountId: 'acc_card' },
  { day: 22, merchant: 'Verizon', categoryId: 'cat_bills', amount: 70_00, accountId: 'acc_card' },
];

/** One-off moments that make the history feel lived-in. */
const oneOffs: (Draft & { daysAgo: number })[] = [
  { daysAgo: 64, hour: 9, type: 'expense', amount: 342_80, merchant: 'Delta Air Lines', categoryId: 'cat_travel', accountId: 'acc_card', note: 'Flight to Chicago' },
  { daysAgo: 58, hour: 20, type: 'expense', amount: 189_00, merchant: 'Airbnb', categoryId: 'cat_travel', accountId: 'acc_card' },
  { daysAgo: 33, hour: 15, type: 'expense', amount: 129_00, merchant: 'Apple Store', categoryId: 'cat_shopping', accountId: 'acc_card', note: 'AirPods case' },
  { daysAgo: 12, hour: 19, type: 'expense', amount: 64_50, merchant: 'Ticketmaster', categoryId: 'cat_entertainment', accountId: 'acc_card' },
];

const pick = <T,>(rand: () => number, items: readonly T[]): T => items[Math.floor(rand() * items.length)]!;
const between = (rand: () => number, min: number, max: number) => Math.round(min + rand() * (max - min));

function generate(now = new Date()): Transaction[] {
  const rand = mulberry32(20261008);
  const today = startOfDay(now);
  const out: Transaction[] = [];
  let n = 0;

  const push = (day: Date, d: Draft) => {
    const date = new Date(day);
    date.setHours(d.hour, between(rand, 0, 59));
    if (date > now) return; // never create "future" items today
    const { hour: _hour, ...rest } = d;
    out.push({ ...rest, id: `txn_${String(++n).padStart(4, '0')}`, date: date.toISOString(), source: 'manual' });
  };

  for (let i = HISTORY_DAYS; i >= 0; i--) {
    const day = addDays(today, -i);
    const weekend = day.getDay() === 0 || day.getDay() === 6;

    for (const r of monthlyRules) {
      if (day.getDate() !== r.day) continue;
      const amount = Array.isArray(r.amount) ? between(rand, r.amount[0], r.amount[1]) : r.amount;
      push(day, { type: r.type ?? 'expense', amount, merchant: r.merchant, categoryId: r.categoryId, accountId: r.accountId, note: r.note, hour: 9 });
    }

    for (const r of randomRules) {
      if (r.weekendOnly && !weekend) continue;
      if (rand() > r.chance) continue;
      push(day, {
        type: 'expense',
        amount: between(rand, r.min, r.max),
        merchant: r.merchant,
        categoryId: r.categoryId,
        accountId: pick(rand, r.accounts),
        hour: between(rand, r.hours[0], r.hours[1]),
      });
    }

    for (const o of oneOffs) {
      if (o.daysAgo === i) {
        const { daysAgo: _d, ...draft } = o;
        push(day, draft);
      }
    }
  }

  return out.sort((a, b) => b.date.localeCompare(a.date));
}

export const mockTransactions: Transaction[] = generate();
