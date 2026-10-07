import type { Account, AccountWithBalance } from '@/schemas/models';

import { ApiError, db, newId, respond } from './mockServer';

function withBalance(a: Account): AccountWithBalance {
  let balance = a.openingBalance;
  let transactionCount = 0;
  for (const t of db.transactions) {
    if (t.accountId !== a.id) continue;
    balance += t.type === 'income' ? t.amount : -t.amount;
    transactionCount++;
  }
  return { ...a, balance, transactionCount };
}

export function listAccounts() {
  return respond(() => db.accounts.map(withBalance));
}

export function getAccount(id: string) {
  return respond(() => {
    const a = db.accounts.find((x) => x.id === id);
    if (!a) throw new ApiError('Account not found', 404);
    return withBalance(a);
  });
}

export type NewAccount = Pick<Account, 'name' | 'type' | 'institution' | 'last4' | 'color'> & {
  startingBalance: number;
  isDefault?: boolean;
};

export function createAccount(input: NewAccount) {
  return respond(() => {
    const { startingBalance, isDefault = false, ...rest } = input;
    if (isDefault) db.accounts.forEach((a) => (a.isDefault = false));
    const account: Account = {
      ...rest,
      id: newId('acc'),
      openingBalance: startingBalance,
      isDefault: isDefault || db.accounts.length === 0,
      createdAt: new Date().toISOString(),
    };
    db.accounts.push(account);
    return withBalance(account);
  });
}

export function updateAccount(id: string, patch: Partial<Pick<Account, 'name' | 'type' | 'institution' | 'last4' | 'color'>>) {
  return respond(() => {
    const a = db.accounts.find((x) => x.id === id);
    if (!a) throw new ApiError('Account not found', 404);
    Object.assign(a, patch);
    return withBalance(a);
  });
}

export function setDefaultAccount(id: string) {
  return respond(() => {
    if (!db.accounts.some((a) => a.id === id)) throw new ApiError('Account not found', 404);
    db.accounts.forEach((a) => (a.isDefault = a.id === id));
    return db.accounts.map(withBalance);
  });
}

/** Deletes the account and its transactions (the UI warns first). */
export function deleteAccount(id: string) {
  return respond(() => {
    const target = db.accounts.find((a) => a.id === id);
    if (!target) throw new ApiError('Account not found', 404);
    db.accounts = db.accounts.filter((a) => a.id !== id);
    db.transactions = db.transactions.filter((t) => t.accountId !== id);
    if (target.isDefault && db.accounts[0]) db.accounts[0].isDefault = true;
    return { id };
  });
}
