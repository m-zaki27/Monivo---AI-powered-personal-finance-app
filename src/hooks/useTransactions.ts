import { useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query';

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

export function useDeleteTransaction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => transactionsApi.deleteTransaction(id),
    onSuccess: () => invalidateMoney(qc),
  });
}

export function useRestoreTransaction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: transactionsApi.restoreTransaction,
    onSuccess: () => invalidateMoney(qc),
  });
}
