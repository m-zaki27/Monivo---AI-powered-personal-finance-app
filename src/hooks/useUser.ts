import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';

import type { Category, User } from '@/schemas/models';
import { avatarApi, userApi } from '@/services';

import { queryKeys } from './queryKeys';

export function useMe() {
  return useQuery({ queryKey: queryKeys.me, queryFn: userApi.getMe });
}

/** Optimistic update; rolls back to the previous user on failure. */
export function useUpdateMe() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (patch: Parameters<typeof userApi.updateMe>[0]) => userApi.updateMe(patch),
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

/** Takes a base64 JPEG. */
export function useSetAvatar() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: avatarApi.setAvatar, onSuccess: (user) => qc.setQueryData(queryKeys.me, user) });
}

export function useRemoveAvatar() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: avatarApi.removeAvatar, onSuccess: (user) => qc.setQueryData(queryKeys.me, user) });
}

export function useCategories() {
  return useQuery({
    queryKey: queryKeys.categories,
    queryFn: userApi.listCategories,
    staleTime: Infinity,
  });
}

export function useCategoryMap() {
  const { data } = useCategories();
  return useMemo(() => new Map<string, Category>((data ?? []).map((c) => [c.id, c])), [data]);
}
