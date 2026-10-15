import { describe, expect, it } from '@jest/globals';

import { applyKeypadKey, centsToInput, formatCompactNumber, formatMoney, parseToCents, sanitizeAmountInput, splitMoney, sumCents } from '../money';

describe('formatMoney', () => {
  it('formats cents as dollars with grouping', () => {
    expect(formatMoney(123456)).toBe('$1,234.56');
    expect(formatMoney(5)).toBe('$0.05');
    expect(formatMoney(0)).toBe('$0.00');
  });

  it('uses a real minus sign for negatives, and + only when asked', () => {
    expect(formatMoney(-500)).toBe('−$5.00');
    expect(formatMoney(500, { signed: true })).toBe('+$5.00');
    expect(formatMoney(0, { signed: true })).toBe('$0.00');
  });

  it('drops .00 only for whole amounts when asked', () => {
    expect(formatMoney(500, { hideZeroCents: true })).toBe('$5');
    expect(formatMoney(550, { hideZeroCents: true })).toBe('$5.50');
  });

  it('supports other currencies and compact chart labels', () => {
    expect(formatMoney(123456, { currency: 'EUR' })).toBe('€1,234.56');
    expect(formatMoney(1_240_000, { compact: true })).toBe('$12.4K');
  });

  it('rounds stray fractions of a cent', () => {
    expect(formatMoney(1005.4)).toBe('$10.05');
  });
});

describe('splitMoney', () => {
  it('separates the whole part from the cents', () => {
    expect(splitMoney(123456)).toEqual({ whole: '$1,234', fraction: '.56' });
  });
});

describe('parseToCents', () => {
  it('turns typed amounts into integer cents', () => {
    expect(parseToCents('12.5')).toBe(1250);
    expect(parseToCents('$1,200')).toBe(120000);
    expect(parseToCents('0.07')).toBe(7);
    expect(parseToCents('.5')).toBe(50);
  });

  it('avoids floating point drift (0.1 + 0.2)', () => {
    expect(parseToCents('0.1')! + parseToCents('0.2')!).toBe(30);
  });

  it('ignores digits past the cents instead of rounding up', () => {
    expect(parseToCents('12.349')).toBe(1234);
  });

  it('returns null for input with no number in it', () => {
    expect(parseToCents('')).toBeNull();
    expect(parseToCents('.')).toBeNull();
    expect(parseToCents('abc')).toBeNull();
  });
});

describe('centsToInput', () => {
  it('always shows two decimals', () => {
    expect(centsToInput(1250)).toBe('12.50');
    expect(centsToInput(5)).toBe('0.05');
  });

  it('round-trips with parseToCents', () => {
    for (const cents of [0, 1, 99, 100, 123456, 99999999]) {
      expect(parseToCents(centsToInput(cents))).toBe(cents);
    }
  });
});

describe('applyKeypadKey', () => {
  it('builds up an amount', () => {
    const typed = ['1', '2', '.', '5'].reduce((s, k) => applyKeypadKey(s, k), '');
    expect(typed).toBe('12.5');
  });

  it('starts a decimal with 0 and allows only one dot', () => {
    expect(applyKeypadKey('', '.')).toBe('0.');
    expect(applyKeypadKey('12.5', '.')).toBe('12.5');
  });

  it('stops at two decimals and at the digit limit', () => {
    expect(applyKeypadKey('12.34', '5')).toBe('12.34');
    expect(applyKeypadKey('123456789', '1')).toBe('123456789');
    expect(applyKeypadKey('123456789', '.')).toBe('123456789.');
  });

  it('replaces a lone zero and handles backspace', () => {
    expect(applyKeypadKey('0', '7')).toBe('7');
    expect(applyKeypadKey('12', 'backspace')).toBe('1');
    expect(applyKeypadKey('', 'backspace')).toBe('');
  });
});

describe('sanitizeAmountInput', () => {
  it('keeps digits and one dot, max two decimals', () => {
    expect(sanitizeAmountInput('1,2.345')).toBe('12.34');
    expect(sanitizeAmountInput('1.2.3')).toBe('1.23');
  });

  it('trims leading zeros and adds one before a bare dot', () => {
    expect(sanitizeAmountInput('007')).toBe('7');
    expect(sanitizeAmountInput('.5')).toBe('0.5');
  });

  it('drops anything that is not a number', () => {
    expect(sanitizeAmountInput('abc')).toBe('');
  });
});

describe('formatCompactNumber', () => {
  it('makes short axis labels without a currency', () => {
    expect(formatCompactNumber(0)).toBe('0');
    expect(formatCompactNumber(950)).toBe('950');
    expect(formatCompactNumber(1500)).toBe('1.5K');
    expect(formatCompactNumber(300000)).toBe('300K');
    expect(formatCompactNumber(2_500_000)).toBe('2.5M');
  });
});

describe('sumCents', () => {
  it('adds exactly, and an empty list is zero', () => {
    expect(sumCents([10, 20, 30])).toBe(60);
    expect(sumCents([])).toBe(0);
  });
});
