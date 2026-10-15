import type { TransactionFilters } from '@/services';

// Keys are hierarchical: invalidating a prefix refreshes every key under it.
export const queryKeys = {
  me: ['me'] as const,
  categories: ['categories'] as const,
  accounts: {
    all: ['accounts'] as const,
  },
  transactions: {
    all: ['transactions'] as const,
    list: (f: TransactionFilters) => ['transactions', 'list', f] as const,
  },
  budget: ['budget'] as const,
  auth: {
    mfaSetup: ['auth', 'mfaSetup'] as const,
    backupCodes: ['auth', 'backupCodes'] as const,
    backupStatus: ['auth', 'backupStatus'] as const,
  },
  summary: (month: string) => ['summary', month] as const,
  summaryAll: ['summary'] as const,
};
