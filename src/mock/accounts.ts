import type { Account } from '@/schemas/models';

import { mockTransactions } from './transactions';

/**
 * Balances are derived (opening balance + transactions), so adding or deleting
 * a transaction moves the account balance automatically. We back-solve the
 * opening balance from a believable "current" balance.
 */
const targetBalances: Record<string, number> = {
  acc_bank: 8_420_55,
  acc_card: -1_286_40,
  acc_cash: 184_00,
};

function netFor(accountId: string) {
  return mockTransactions
    .filter((t) => t.accountId === accountId)
    .reduce((sum, t) => sum + (t.type === 'income' ? t.amount : -t.amount), 0);
}

const opening = (id: string) => (targetBalances[id] ?? 0) - netFor(id);

export const mockAccounts: Account[] = [
  {
    id: 'acc_bank',
    name: 'Everyday Checking',
    type: 'bank',
    institution: 'First Harbor Bank',
    last4: '4821',
    openingBalance: opening('acc_bank'),
    color: 'cobalt',
    isDefault: true,
    createdAt: '2025-03-02T10:00:00.000Z',
  },
  {
    id: 'acc_card',
    name: 'Rewards Card',
    type: 'credit',
    institution: 'First Harbor Bank',
    last4: '9934',
    openingBalance: opening('acc_card'),
    color: 'gold',
    isDefault: false,
    createdAt: '2025-03-02T10:05:00.000Z',
  },
  {
    id: 'acc_cash',
    name: 'Wallet',
    type: 'cash',
    openingBalance: opening('acc_cash'),
    color: 'teal',
    isDefault: false,
    createdAt: '2025-03-02T10:06:00.000Z',
  },
];
