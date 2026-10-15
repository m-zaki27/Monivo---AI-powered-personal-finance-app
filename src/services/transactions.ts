import { supabase } from '@/lib/supabase';
import type { Transaction, TransactionSource, TransactionType } from '@/schemas/models';

import { unwrap } from './errors';
import { listCategories } from './user';

export interface TransactionFilters {
  type?: TransactionType;
  accountId?: string;
  search?: string;
  /** ISO, inclusive */
  from?: string;
  /** ISO, inclusive */
  to?: string;
  limit?: number;
}

export type NewTransaction = Omit<Transaction, 'id'>;

const COLUMNS = 'id, type, amount, merchant, category_id, account_id, date, note, source';

type Row = {
  id: string;
  type: string;
  amount: number;
  merchant: string;
  category_id: string;
  account_id: string;
  date: string;
  note: string | null;
  source: string;
};

const toTransaction = (r: Row): Transaction => ({
  id: r.id,
  type: r.type as TransactionType,
  amount: Number(r.amount),
  merchant: r.merchant,
  categoryId: r.category_id,
  accountId: r.account_id,
  date: r.date,
  note: r.note ?? undefined,
  source: r.source as TransactionSource,
});

const toRow = (t: NewTransaction) => ({
  type: t.type,
  amount: t.amount,
  merchant: t.merchant,
  category_id: t.categoryId,
  account_id: t.accountId,
  date: t.date,
  note: t.note ?? null,
  source: t.source,
});

// Strips PostgREST filter syntax chars so user input can't alter the `or` query.
async function searchFilter(search: string) {
  const term = search.replace(/[%_,()*\\"']/g, ' ').trim();
  if (!term) return null;
  const categories = await listCategories();
  const categoryIds = categories.filter((c) => c.name.toLowerCase().includes(term.toLowerCase())).map((c) => c.id);
  const parts = [`merchant.ilike.%${term}%`, `note.ilike.%${term}%`];
  if (categoryIds.length) parts.push(`category_id.in.(${categoryIds.join(',')})`);
  return parts.join(',');
}

export async function listTransactions(filters: TransactionFilters = {}): Promise<Transaction[]> {
  let query = supabase
    .from('transactions')
    .select(COLUMNS)
    .order('date', { ascending: false })
    .order('created_at', { ascending: false });
  if (filters.type) query = query.eq('type', filters.type);
  if (filters.accountId) query = query.eq('account_id', filters.accountId);
  if (filters.from) query = query.gte('date', filters.from);
  if (filters.to) query = query.lte('date', filters.to);
  if (filters.search) {
    const or = await searchFilter(filters.search);
    if (or) query = query.or(or);
  }
  if (filters.limit) query = query.limit(filters.limit);
  return unwrap(await query).map(toTransaction);
}

export async function createTransactions(inputs: NewTransaction[]): Promise<Transaction[]> {
  return unwrap(await supabase.from('transactions').insert(inputs.map(toRow)).select(COLUMNS)).map(toTransaction);
}

/** Returns the removed row for undo. */
export async function deleteTransaction(id: string): Promise<Transaction> {
  return toTransaction(unwrap(await supabase.from('transactions').delete().eq('id', id).select(COLUMNS).single()));
}

/** Re-inserts with the original id. */
export async function restoreTransaction(t: Transaction): Promise<Transaction> {
  return toTransaction(unwrap(await supabase.from('transactions').insert({ id: t.id, ...toRow(t) }).select(COLUMNS).single()));
}
