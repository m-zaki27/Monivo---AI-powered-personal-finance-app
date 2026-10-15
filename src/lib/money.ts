/** Integer minor units, to avoid float drift; convert only for display. */
export type Cents = number;

export const DEFAULT_CURRENCY = 'USD';

const formatterCache = new Map<string, Intl.NumberFormat>();

function getFormatter(currency: string, fractionDigits: number, compact: boolean) {
  const key = `${currency}|${fractionDigits}|${compact}`;
  let f = formatterCache.get(key);
  if (!f) {
    f = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: compact ? 0 : fractionDigits,
      maximumFractionDigits: compact ? 1 : fractionDigits,
      notation: compact ? 'compact' : 'standard',
    });
    formatterCache.set(key, f);
  }
  return f;
}

export interface FormatMoneyOptions {
  currency?: string;
  /** Prefix "+" for positives and "−" for negatives */
  signed?: boolean;
  /** Drop the ".00" when the value is whole */
  hideZeroCents?: boolean;
  /** $12.4K style */
  compact?: boolean;
}

export function formatMoney(cents: Cents, opts: FormatMoneyOptions = {}): string {
  const { currency = DEFAULT_CURRENCY, signed = false, hideZeroCents = false, compact = false } = opts;
  const abs = Math.abs(Math.round(cents));
  const digits = hideZeroCents && abs % 100 === 0 ? 0 : 2;
  const body = getFormatter(currency, digits, compact).format(abs / 100);
  if (cents < 0) return `−${body}`;
  if (signed && cents > 0) return `+${body}`;
  return body;
}

const compactFmt = new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 });

/** 1500 → "1.5K" (no currency). */
export function formatCompactNumber(value: number): string {
  return compactFmt.format(value);
}

/** Splits a formatted amount into whole and fraction parts for separate styling. */
export function splitMoney(cents: Cents, currency = DEFAULT_CURRENCY) {
  const formatted = formatMoney(cents, { currency });
  const match = formatted.match(/^(.*?)([.,]\d{2})?$/);
  return { whole: match?.[1] ?? formatted, fraction: match?.[2] ?? '' };
}

/** "12.5" → 1250, "$1,200" → 120000. Returns null for unparseable input. */
export function parseToCents(input: string): Cents | null {
  const cleaned = input.replace(/[^0-9.]/g, '');
  if (cleaned === '' || cleaned === '.') return null;
  const [whole = '0', frac = ''] = cleaned.split('.');
  const cents = Number(whole) * 100 + Number(frac.padEnd(2, '0').slice(0, 2));
  return Number.isFinite(cents) ? cents : null;
}

/** 1250 → "12.50" */
export function centsToInput(cents: Cents): string {
  return (cents / 100).toFixed(2);
}

/** Applies a keypad press to an amount string (max 2 decimals, `maxDigits` whole digits). */
export function applyKeypadKey(current: string, key: string, maxDigits = 9): string {
  if (key === 'backspace') return current.slice(0, -1);
  if (key === '.') {
    if (current.includes('.')) return current;
    return current === '' ? '0.' : `${current}.`;
  }
  const [whole = '', frac] = current.split('.');
  if (frac !== undefined && frac.length >= 2) return current;
  if (frac === undefined && whole.replace(/^0+/, '').length >= maxDigits) return current;
  if (current === '0') return key;
  return current + key;
}

export function sumCents(values: Cents[]): Cents {
  return values.reduce((a, b) => a + b, 0);
}

/** Sanitizes TextInput amounts: "1,2.345" → "12.34". */
export function sanitizeAmountInput(text: string, maxDigits = 9): string {
  const cleaned = text.replace(/[^0-9.]/g, '');
  const [whole = '', ...rest] = cleaned.split('.');
  const w = whole.replace(/^0+(?=\d)/, '').slice(0, maxDigits);
  if (rest.length === 0) return w;
  return `${w || '0'}.${rest.join('').slice(0, 2)}`;
}
