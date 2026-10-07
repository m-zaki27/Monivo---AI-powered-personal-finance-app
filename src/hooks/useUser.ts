import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';

import type { Category, User } from '@/schemas/models';
import { userApi } from '@/services';

import { queryKeys } from './queryKeys';

export function useMe() {
  return useQuery({ queryKey: queryKeys.me, queryFn: userApi.getMe });
}

export function useUpdateMe() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (patch: Partial<Omit<User, 'id'>>) => userApi.updateMe(patch),
    onSuccess: (user) => qc.setQueryData(queryKeys.me, user),
  });
}

export function useCategories() {
  return useQuery({
    queryKey: queryKeys.categories,
    queryFn: userApi.listCategories,
    // Categories practically never change.
    staleTime: Infinity,
  });
}

/** O(1) lookup map: categoryId → Category */
export function useCategoryMap() {
  const { data } = useCategories();
  return useMemo(() => new Map<string, Category>((data ?? []).map((c) => [c.id, c])), [data]);
}
