import { endOfMonth, startOfMonth } from '@/lib/dates';
import type { Budget } from '@/schemas/models';

import { db, respond } from './mockServer';

export function getBudget() {
  return respond(() => db.budget);
}

export function updateBudget(patch: Partial<Budget>) {
  return respond(() => {
    db.budget = { ...db.budget, ...patch };
    return db.budget;
  });
}

export interface CategorySpend {
  categoryId: string;
  total: number;
  count: number;
}

export interface MonthSummary {
  month: string;
  income: number;
  expense: number;
  byCategory: CategorySpend[];
  budget: Budget;
  /** expense / limit — can exceed 1 */
  usedRatio: number;
}

/** Totals for the month containing `monthISO` (defaults to now). */
export function getMonthSummary(monthISO = new Date().toISOString()) {
  return respond<MonthSummary>(() => {
    const ref = new Date(monthISO);
    const from = startOfMonth(ref).toISOString();
    const to = endOfMonth(ref).toISOString();
    let income = 0;
    let expense = 0;
    const cats = new Map<string, CategorySpend>();

    for (const t of db.transactions) {
      if (t.date < from || t.date > to) continue;
      if (t.type === 'income') {
        income += t.amount;
        continue;
      }
      expense += t.amount;
      const c = cats.get(t.categoryId) ?? { categoryId: t.categoryId, total: 0, count: 0 };
      c.total += t.amount;
      c.count++;
      cats.set(t.categoryId, c);
    }

    return {
      month: from,
      income,
      expense,
      byCategory: [...cats.values()].sort((a, b) => b.total - a.total),
      budget: db.budget,
      usedRatio: expense / db.budget.monthlyLimit,
    };
  });
}
