import { endOfMonth, startOfMonth } from '@/lib/dates';
import { supabase } from '@/lib/supabase';
import type { Budget } from '@/schemas/models';

import { unwrap } from './errors';

export async function getBudget(): Promise<Budget | null> {
  const row = unwrap(await supabase.from('budgets').select('monthly_limit, alert_threshold, email_alerts').maybeSingle());
  if (!row) return null;
  return {
    monthlyLimit: Number(row.monthly_limit),
    // `numeric` columns can arrive as strings.
    alertThreshold: Number(row.alert_threshold),
    emailAlerts: row.email_alerts,
  };
}

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
  /** expense / limit (can exceed 1) */
  usedRatio: number | null;
}

type SummaryJson = {
  income: number;
  expense: number;
  by_category: { category_id: string; total: number; count: number }[];
};

// Month bounds are computed in device local time, not UTC.
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
