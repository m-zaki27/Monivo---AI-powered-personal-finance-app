import type { Category, User } from '@/schemas/models';

import { db, respond } from './mockServer';

export function getMe() {
  return respond(() => db.user);
}

export function updateMe(patch: Partial<Omit<User, 'id'>>) {
  return respond(() => {
    db.user = { ...db.user, ...patch };
    return db.user;
  });
}

export function listCategories() {
  return respond<Category[]>(() => db.categories);
}

/**
 * Saves onboarding choices. The mock sets the default account's balance to the
 * amount entered; a real API would create the user's first account instead.
 */
export function completeOnboarding(input: { currency: string; startingBalance: number }) {
  return respond(() => {
    db.user.currency = input.currency;
    const account = db.accounts.find((a) => a.isDefault) ?? db.accounts[0];
    if (account) {
      const net = db.transactions
        .filter((t) => t.accountId === account.id)
        .reduce((sum, t) => sum + (t.type === 'income' ? t.amount : -t.amount), 0);
      account.openingBalance = input.startingBalance - net;
    }
    return db.user;
  });
}
