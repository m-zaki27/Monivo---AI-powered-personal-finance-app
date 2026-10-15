export type ISODate = string;

const DAY_MS = 86_400_000;

const fmt = (opts: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat('en-US', opts);
const shortFmt = fmt({ month: 'short', day: 'numeric' });
const dayHeaderFmt = fmt({ weekday: 'short', month: 'short', day: 'numeric' });
const monthFmt = fmt({ month: 'long', year: 'numeric' });
const monthShortFmt = fmt({ month: 'short' });
const timeFmt = fmt({ hour: 'numeric', minute: '2-digit' });
const fullFmt = fmt({ weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });

export const toDate = (d: ISODate | Date) => (typeof d === 'string' ? new Date(d) : d);

export function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

export function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

export function endOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
}

export function addDays(d: Date, n: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

export function daysInMonth(d: Date): number {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
}

export function isSameDay(a: Date, b: Date): boolean {
  return startOfDay(a).getTime() === startOfDay(b).getTime();
}

export function isSameMonth(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();
}

/** Local "YYYY-MM-DD" key, used to group transactions by day. */
export function dayKey(d: ISODate | Date): string {
  const x = toDate(d);
  const m = String(x.getMonth() + 1).padStart(2, '0');
  const day = String(x.getDate()).padStart(2, '0');
  return `${x.getFullYear()}-${m}-${day}`;
}

/** "Today", "Yesterday" or "Mon, Oct 6" */
export function formatDayHeader(d: ISODate | Date, now = new Date()): string {
  const x = toDate(d);
  const diff = Math.round((startOfDay(now).getTime() - startOfDay(x).getTime()) / DAY_MS);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Yesterday';
  return dayHeaderFmt.format(x);
}

export const formatShortDate = (d: ISODate | Date) => shortFmt.format(toDate(d));
export const formatMonth = (d: ISODate | Date) => monthFmt.format(toDate(d));
export const formatMonthShort = (d: ISODate | Date) => monthShortFmt.format(toDate(d));
export const formatTime = (d: ISODate | Date) => timeFmt.format(toDate(d));
export const formatFullDate = (d: ISODate | Date) => fullFmt.format(toDate(d));

export function greetingFor(now = new Date()): string {
  const h = now.getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}
