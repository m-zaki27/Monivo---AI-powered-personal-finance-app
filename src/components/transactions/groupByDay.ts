import { dayKey, formatDayHeader } from '@/lib/dates';
import type { Transaction } from '@/schemas/models';

export interface DaySection {
  key: string;
  title: string;
  net: number;
  data: Transaction[];
}

/** Expects a date-sorted list. */
export function groupByDay(transactions: Transaction[], now = new Date()): DaySection[] {
  const sections: DaySection[] = [];
  let current: DaySection | undefined;
  for (const t of transactions) {
    const key = dayKey(t.date);
    if (current?.key !== key) {
      current = { key, title: formatDayHeader(t.date, now), net: 0, data: [] };
      sections.push(current);
    }
    current.data.push(t);
    current.net += t.type === 'income' ? t.amount : -t.amount;
  }
  return sections;
}
