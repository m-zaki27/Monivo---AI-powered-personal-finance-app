import { describe, expect, it } from '@jest/globals';

import type { Category, Transaction } from '@/schemas/models';

import { cell, toCsv, transactionsToCsv } from '../csv';

describe('cell', () => {
  it('leaves simple values alone', () => {
    expect(cell('Coffee')).toBe('Coffee');
    expect(cell(42)).toBe('42');
  });

  it('quotes commas, quotes and line breaks', () => {
    expect(cell('Smith, John')).toBe('"Smith, John"');
    expect(cell('say "hi"')).toBe('"say ""hi"""');
    expect(cell('line\nbreak')).toBe('"line\nbreak"');
  });

  it('defuses text that a spreadsheet would run as a formula', () => {
    expect(cell('=HYPERLINK("http://x")')).toBe(`"'=HYPERLINK(""http://x"")"`);
    expect(cell('+cmd')).toBe("'+cmd");
    expect(cell('@SUM(A1)')).toBe("'@SUM(A1)");
    expect(cell('-rm')).toBe("'-rm");
  });

  it('keeps negative amounts as numbers, so they still add up', () => {
    expect(cell('-12.50')).toBe('-12.50');
    expect(cell('-3')).toBe('-3');
  });
});

describe('transactionsToCsv', () => {
  const tx = (over: Partial<Transaction>): Transaction => ({
    id: '1',
    type: 'expense',
    amount: 1250,
    merchant: 'Cafe',
    categoryId: 'food',
    accountId: 'main',
    date: '2026-10-14T09:30:00.000Z',
    source: 'manual',
    ...over,
  });
  const categories = new Map([['food', { id: 'food', name: 'Food', icon: 'basket', color: 'gold', kind: 'expense' } satisfies Category]]);
  const accounts = new Map([['main', { name: 'Main account' }]]);

  it('writes a header and one row per transaction, with signed amounts', () => {
    const csv = transactionsToCsv(
      [tx({}), tx({ id: '2', type: 'income', amount: 10000, merchant: 'Salary', categoryId: 'unknown', note: 'October' })],
      categories,
      accounts,
      'USD',
    );
    expect(csv.split('\r\n')).toEqual([
      'Date,Merchant,Category,Account,Type,Amount (USD),Note',
      '2026-10-14,Cafe,Food,Main account,expense,-12.50,',
      '2026-10-14,Salary,,Main account,income,100.00,October',
    ]);
  });

  it('toCsv joins rows with CRLF for Excel', () => {
    expect(toCsv([['a', 'b'], ['c', 'd']])).toBe('a,b\r\nc,d');
  });
});
