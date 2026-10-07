import { toDate } from '@/lib/dates';
import type { Transaction } from '@/schemas/models';

export interface DayTotals {
  /** Day of month, 1-based */
  day: number;
  income: number;
  expense: number;
}

/** One entry per day from the 1st up to `until` (today), zero-filled so empty days still get a slot. */
export function dailySeries(transactions: Transaction[], until: Date): DayTotals[] {
  const days: DayTotals[] = Array.from({ length: until.getDate() }, (_, i) => ({ day: i + 1, income: 0, expense: 0 }));
  for (const t of transactions) {
    const d = toDate(t.date);
    if (d.getMonth() !== until.getMonth() || d.getFullYear() !== until.getFullYear()) continue;
    const slot = days[d.getDate() - 1];
    if (!slot) continue;
    slot[t.type] += t.amount;
  }
  return days;
}
