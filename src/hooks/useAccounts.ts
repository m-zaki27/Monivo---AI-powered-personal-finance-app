import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';

import type { Account, AccountWithBalance } from '@/schemas/models';
import { accountsApi, type NewAccount } from '@/services';

import { queryKeys } from './queryKeys';
import { invalidateMoney } from './useTransactions';

export function useAccounts() {
  return useQuery({ queryKey: queryKeys.accounts.all, queryFn: accountsApi.listAccounts });
}

export function useAccount(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.accounts.detail(id ?? ''),
    queryFn: () => accountsApi.getAccount(id!),
    enabled: !!id,
  });
}

/** Convenience: the default account (used to prefill new transactions). */
export function useDefaultAccount() {
  const q = useAccounts();
  return { ...q, data: q.data?.find((a) => a.isDefault) ?? q.data?.[0] };
}

/** O(1) lookup map: accountId → Account (for labelling transaction rows). */
export function useAccountMap() {
  const { data } = useAccounts();
  return useMemo(() => new Map<string, AccountWithBalance>((data ?? []).map((a) => [a.id, a])), [data]);
}

export function useCreateAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: NewAccount) => accountsApi.createAccount(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.accounts.all }),
  });
}

type AccountPatch = Partial<Pick<Account, 'name' | 'type' | 'institution' | 'last4' | 'color'>>;

export function useUpdateAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: AccountPatch }) => accountsApi.updateAccount(id, patch),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.accounts.all }),
  });
}

export function useSetDefaultAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => accountsApi.setDefaultAccount(id),
    // The server returns the full updated list, so write it straight into the cache.
    onSuccess: (accounts) => qc.setQueryData(queryKeys.accounts.all, accounts),
  });
}

export function useDeleteAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => accountsApi.deleteAccount(id),
    onSuccess: () => invalidateMoney(qc),
  });
}
