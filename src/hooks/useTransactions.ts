import { keepPreviousData, useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query';

import type { Transaction } from '@/schemas/models';

import { transactionsApi, type NewTransaction, type TransactionFilters } from '@/services';

import { queryKeys } from './queryKeys';

/** Anything that changes a transaction also changes balances and monthly totals. */
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
    // While a new search/filter loads, keep showing the previous results
    // instead of flashing back to skeletons on every keystroke.
    placeholderData: keepPreviousData,
  });
}

export function useRecentTransactions(limit = 5) {
  return useTransactions({ limit });
}

export function useTransaction(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.transactions.detail(id ?? ''),
    queryFn: () => transactionsApi.getTransaction(id!),
    enabled: !!id,
  });
}

export function useAddTransaction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: NewTransaction) => transactionsApi.createTransaction(input),
    onSuccess: () => invalidateMoney(qc),
  });
}

export function useUpdateTransaction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Partial<NewTransaction> }) =>
      transactionsApi.updateTransaction(id, patch),
    onSuccess: () => invalidateMoney(qc),
  });
}

/**
 * Optimistic delete: the row disappears instantly, before the server answers.
 * We snapshot every cached transaction list first, so if the request fails we
 * can put them back exactly as they were.
 */
export function useDeleteTransaction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => transactionsApi.deleteTransaction(id),
    onMutate: async (id) => {
      const listKey = [...queryKeys.transactions.all, 'list'];
      // Stop in-flight refetches from overwriting our optimistic change.
      await qc.cancelQueries({ queryKey: listKey });
      const snapshot = qc.getQueriesData<Transaction[]>({ queryKey: listKey });
      qc.setQueriesData<Transaction[]>({ queryKey: listKey }, (old) => old?.filter((t) => t.id !== id));
      return { snapshot };
    },
    onError: (_err, _id, context) => {
      context?.snapshot.forEach(([key, data]) => qc.setQueryData(key, data));
    },
    // Success or failure, re-sync lists, balances and monthly totals with the server.
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
