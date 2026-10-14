import type { TransactionFilters } from '@/services';

/**
 * One place for every cache key. Keys are arrays, so invalidating
 * ['transactions'] also refreshes ['transactions', 'list', {...filters}].
 */
export const queryKeys = {
  me: ['me'] as const,
  categories: ['categories'] as const,
  accounts: {
    all: ['accounts'] as const,
    detail: (id: string) => ['accounts', id] as const,
  },
  transactions: {
    all: ['transactions'] as const,
    list: (f: TransactionFilters) => ['transactions', 'list', f] as const,
    detail: (id: string) => ['transactions', 'detail', id] as const,
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
