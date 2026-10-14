import { endOfMonth, startOfMonth } from '@/lib/dates';
import { supabase } from '@/lib/supabase';
import type { Budget } from '@/schemas/models';

import { unwrap } from './errors';

/** A budget is optional: new users have none until they set one. */
export async function getBudget(): Promise<Budget | null> {
  const row = unwrap(await supabase.from('budgets').select('monthly_limit, alert_threshold, email_alerts').maybeSingle());
  if (!row) return null;
  return {
    monthlyLimit: Number(row.monthly_limit),
    // `numeric` columns can arrive as strings; Number() handles both.
    alertThreshold: Number(row.alert_threshold),
    emailAlerts: row.email_alerts,
  };
}

/** Creates the budget the first time, updates it after that (one row per user). */
export async function updateBudget(budget: Budget): Promise<Budget> {
  unwrap(
    await supabase.from('budgets').upsert({
      monthly_limit: budget.monthlyLimit,
      alert_threshold: budget.alertThreshold,
      email_alerts: budget.emailAlerts,
    }),
  );
  return (await getBudget())!;
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
  budget: Budget | null;
  /** expense / limit (can exceed 1); null when there's no budget */
  usedRatio: number | null;
}

type SummaryJson = {
  income: number;
  expense: number;
  by_category: { category_id: string; total: number; count: number }[];
};

/**
 * Totals for the month containing `monthISO`. The database sums them; we pass
 * the month's start and end in the phone's local time, so "this month" means
 * the user's month, not UTC's.
 */
export async function getMonthSummary(monthISO = new Date().toISOString()): Promise<MonthSummary> {
  const ref = new Date(monthISO);
  const from = startOfMonth(ref).toISOString();
  const to = endOfMonth(ref).toISOString();
  const [json, budget] = await Promise.all([
    supabase.rpc('month_summary', { p_from: from, p_to: to }).then(unwrap),
    getBudget(),
  ]);
  const s = json as unknown as SummaryJson;
  const expense = Number(s.expense);
  return {
    month: from,
    income: Number(s.income),
    expense,
    byCategory: s.by_category.map((c) => ({ categoryId: c.category_id, total: Number(c.total), count: c.count })),
    budget,
    usedRatio: budget ? expense / budget.monthlyLimit : null,
  };
}
