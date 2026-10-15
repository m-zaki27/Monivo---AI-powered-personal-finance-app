import type { DayTotals } from './dailySeries';

export interface TrendSeries {
  /** Running total spent in cents: index 0 is the month start (0), then one per day */
  spent: number[];
  /** Where an even pace to the budget would be on the same days; null without a budget */
  pace: number[] | null;
}

/** Cumulative spend plus the even-pace line; both start at 0 so the 1st still draws a line. */
export function trendSeries(days: DayTotals[], monthlyLimit: number | null, daysInMonth: number): TrendSeries {
  const spent = [0];
  for (const d of days) spent.push(spent[spent.length - 1]! + d.expense);
  const pace = monthlyLimit && daysInMonth > 0 ? spent.map((_, i) => Math.round((monthlyLimit * i) / daysInMonth)) : null;
  return { spent, pace };
}
