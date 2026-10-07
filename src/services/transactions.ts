import type { Transaction, TransactionType } from '@/schemas/models';

import { ApiError, db, newId, respond } from './mockServer';

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

export function listTransactions(filters: TransactionFilters = {}) {
  return respond(() => {
    const q = filters.search?.trim().toLowerCase();
    const categoryNames = new Map(db.categories.map((c) => [c.id, c.name.toLowerCase()]));
    const result = db.transactions
      .filter((t) => !filters.type || t.type === filters.type)
      .filter((t) => !filters.accountId || t.accountId === filters.accountId)
      .filter((t) => !filters.from || t.date >= filters.from)
      .filter((t) => !filters.to || t.date <= filters.to)
      .filter(
        (t) =>
          !q ||
          t.merchant.toLowerCase().includes(q) ||
          (t.note?.toLowerCase().includes(q) ?? false) ||
          (categoryNames.get(t.categoryId)?.includes(q) ?? false),
      )
      .sort((a, b) => b.date.localeCompare(a.date));
    return filters.limit ? result.slice(0, filters.limit) : result;
  });
}

export function getTransaction(id: string) {
  return respond(() => {
    const t = db.transactions.find((x) => x.id === id);
    if (!t) throw new ApiError('Transaction not found', 404);
    return t;
  });
}

export function createTransaction(input: NewTransaction) {
  return respond(() => {
    const t: Transaction = { ...input, id: newId('txn') };
    db.transactions.unshift(t);
    return t;
  });
}

/** Saves several at once (voice can produce more than one), in a single round trip. */
export function createTransactions(inputs: NewTransaction[]) {
  return respond(() => {
    const created = inputs.map((input) => ({ ...input, id: newId('txn') }));
    db.transactions.unshift(...created);
    return created;
  });
}

export function updateTransaction(id: string, patch: Partial<NewTransaction>) {
  return respond(() => {
    const i = db.transactions.findIndex((x) => x.id === id);
    if (i < 0) throw new ApiError('Transaction not found', 404);
    db.transactions[i] = { ...db.transactions[i]!, ...patch };
    return db.transactions[i]!;
  });
}

/** Returns the removed item so the UI can offer "Undo". */
export function deleteTransaction(id: string) {
  return respond(() => {
    const i = db.transactions.findIndex((x) => x.id === id);
    if (i < 0) throw new ApiError('Transaction not found', 404);
    const [removed] = db.transactions.splice(i, 1);
    return removed!;
  });
}

/** Puts a deleted transaction back with its original id. */
export function restoreTransaction(t: Transaction) {
  return respond(() => {
    db.transactions.push(t);
    return t;
  });
}
