import type { Account, Category, Transaction } from '@/schemas/models';

// Prefixes formula-like text with ' to block CSV injection (plain numbers are left alone).
export function cell(value: string | number): string {
  let s = String(value);
  if (/^[=+\-@]/.test(s) && !/^-?\d+(\.\d+)?$/.test(s)) s = `'${s}`;
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function toCsv(rows: (string | number)[][]): string {
  // CRLF line endings are what Excel expects.
  return rows.map((r) => r.map(cell).join(',')).join('\r\n');
}

export function transactionsToCsv(
  transactions: Transaction[],
  categories: Map<string, Category>,
  accounts: Map<string, Pick<Account, 'name'>>,
  currency: string,
): string {
  const header = ['Date', 'Merchant', 'Category', 'Account', 'Type', `Amount (${currency})`, 'Note'];
  const rows = transactions.map((t) => [
    t.date.slice(0, 10),
    t.merchant,
    categories.get(t.categoryId)?.name ?? '',
    accounts.get(t.accountId)?.name ?? '',
    t.type,
    // No currency symbol, so spreadsheets can sum it.
    ((t.type === 'income' ? t.amount : -t.amount) / 100).toFixed(2),
    t.note ?? '',
  ]);
  return toCsv([header, ...rows]);
}
