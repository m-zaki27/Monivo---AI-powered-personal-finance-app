import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';

import type { Category, User } from '@/schemas/models';
import { userApi } from '@/services';

import { queryKeys } from './queryKeys';

export function useMe() {
  return useQuery({ queryKey: queryKeys.me, queryFn: userApi.getMe });
}

/**
 * Optimistic: switches in Settings flip instantly. If the save fails we put
 * the previous user back, so the switch visibly flips back too.
 */
export function useUpdateMe() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (patch: Partial<Omit<User, 'id'>>) => userApi.updateMe(patch),
    onMutate: async (patch) => {
      await qc.cancelQueries({ queryKey: queryKeys.me });
      const previous = qc.getQueryData<User>(queryKeys.me);
      if (previous) qc.setQueryData<User>(queryKeys.me, { ...previous, ...patch });
      return { previous };
    },
    onError: (_e, _patch, ctx) => {
      if (ctx?.previous) qc.setQueryData(queryKeys.me, ctx.previous);
    },
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
