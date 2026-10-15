import { describe, expect, it } from '@jest/globals';

import { addDays, dayKey, daysInMonth, endOfMonth, formatDayHeader, greetingFor, isSameDay, isSameMonth, startOfMonth } from '../dates';

// Local-part dates keep tests time-zone independent. Months are 0-based.

describe('month boundaries', () => {
  it('knows leap years', () => {
    expect(daysInMonth(new Date(2027, 1, 1))).toBe(28);
    expect(daysInMonth(new Date(2028, 1, 1))).toBe(29);
    expect(daysInMonth(new Date(2026, 9, 15))).toBe(31);
  });

  it('endOfMonth is the last millisecond of the last day', () => {
    const end = endOfMonth(new Date(2028, 1, 10));
    expect([end.getMonth(), end.getDate(), end.getHours(), end.getMilliseconds()]).toEqual([1, 29, 23, 999]);
  });

  it('startOfMonth is midnight on the 1st', () => {
    const start = startOfMonth(new Date(2026, 9, 15, 18, 30));
    expect([start.getDate(), start.getHours(), start.getMinutes()]).toEqual([1, 0, 0]);
  });
});

describe('addDays', () => {
  it('rolls over months and years', () => {
    expect(dayKey(addDays(new Date(2026, 0, 31), 1))).toBe('2026-02-01');
    expect(dayKey(addDays(new Date(2026, 11, 31), 1))).toBe('2027-01-01');
    expect(dayKey(addDays(new Date(2026, 2, 1), -1))).toBe('2026-02-28');
  });

  it('does not change the date it was given', () => {
    const d = new Date(2026, 9, 15);
    addDays(d, 5);
    expect(d.getDate()).toBe(15);
  });
});

describe('dayKey', () => {
  it('uses the local calendar day, zero-padded', () => {
    expect(dayKey(new Date(2026, 2, 5, 23, 59))).toBe('2026-03-05');
    expect(dayKey(new Date(2026, 2, 5, 0, 0))).toBe('2026-03-05');
  });
});

describe('comparisons', () => {
  it('isSameDay ignores the time', () => {
    expect(isSameDay(new Date(2026, 9, 15, 0, 1), new Date(2026, 9, 15, 23, 59))).toBe(true);
    expect(isSameDay(new Date(2026, 9, 15, 23, 59), new Date(2026, 9, 16, 0, 0))).toBe(false);
  });

  it('isSameMonth checks the year too', () => {
    expect(isSameMonth(new Date(2026, 9, 1), new Date(2026, 9, 31))).toBe(true);
    expect(isSameMonth(new Date(2026, 9, 1), new Date(2025, 9, 1))).toBe(false);
  });
});

describe('formatDayHeader', () => {
  const now = new Date(2026, 9, 15, 0, 10); // Thu, Oct 15, just after midnight

  it('says Today and Yesterday by calendar day, not by 24 hours', () => {
    expect(formatDayHeader(new Date(2026, 9, 15, 0, 1), now)).toBe('Today');
    expect(formatDayHeader(new Date(2026, 9, 14, 23, 30), now)).toBe('Yesterday');
  });

  it('shows a short date further back', () => {
    expect(formatDayHeader(new Date(2026, 9, 6, 12), now)).toBe('Tue, Oct 6');
  });
});

describe('greetingFor', () => {
  it('switches at noon and 6 pm', () => {
    expect(greetingFor(new Date(2026, 9, 15, 11, 59))).toBe('Good morning');
    expect(greetingFor(new Date(2026, 9, 15, 12, 0))).toBe('Good afternoon');
    expect(greetingFor(new Date(2026, 9, 15, 18, 0))).toBe('Good evening');
  });
});
