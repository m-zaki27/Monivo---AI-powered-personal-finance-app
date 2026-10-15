import { keepPreviousData, useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query';

import type { Transaction } from '@/schemas/models';

import { transactionsApi, type NewTransaction, type TransactionFilters } from '@/services';

import { queryKeys } from './queryKeys';

/** Refreshes transactions, balances and monthly totals. */
export function invalidateMoney(qc: QueryClient) {
  return Promise.all([
    qc.invalidateQueries({ queryKey: queryKeys.transactions.all }),
    qc.invalidateQueries({ queryKey: queryKeys.accounts.all }),
    qc.invalidateQueries({ queryKey: queryKeys.summaryAll }),
  ]);
}

export function useTransactions(filters: TransactionFilters = {}) {
  return useQuery({
    queryKey: queryKeys.transactions.list(filters),
    queryFn: () => transactionsApi.listTransactions(filters),
    // Avoid flashing skeletons on every filter/search change.
    placeholderData: keepPreviousData,
  });
}

export function useRecentTransactions(limit = 5) {
  return useTransactions({ limit });
}

export function useAddTransactions() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (inputs: NewTransaction[]) => transactionsApi.createTransactions(inputs),
    onSuccess: () => invalidateMoney(qc),
  });
}

/** Optimistic delete; cached lists are restored from a snapshot on failure. */
export function useDeleteTransaction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => transactionsApi.deleteTransaction(id),
    onMutate: async (id) => {
      const listKey = [...queryKeys.transactions.all, 'list'];
      // Keep in-flight refetches from overwriting the optimistic update.
      await qc.cancelQueries({ queryKey: listKey });
      const snapshot = qc.getQueriesData<Transaction[]>({ queryKey: listKey });
      qc.setQueriesData<Transaction[]>({ queryKey: listKey }, (old) => old?.filter((t) => t.id !== id));
      return { snapshot };
    },
    onError: (_err, _id, context) => {
      context?.snapshot.forEach(([key, data]) => qc.setQueryData(key, data));
    },
    onSettled: () => invalidateMoney(qc),
  });
}

export function useRestoreTransaction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: transactionsApi.restoreTransaction,
    onSuccess: () => invalidateMoney(qc),
  });
}
