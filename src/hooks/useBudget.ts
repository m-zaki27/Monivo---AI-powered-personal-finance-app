import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { startOfMonth } from '@/lib/dates';
import type { Budget } from '@/schemas/models';
import { budgetApi } from '@/services';

import { queryKeys } from './queryKeys';

export function useBudget() {
  return useQuery({ queryKey: queryKeys.budget, queryFn: budgetApi.getBudget });
}

/** Income, expense, per-category totals and budget usage for a month. */
export function useMonthSummary(month: Date = new Date()) {
  const key = startOfMonth(month).toISOString();
  return useQuery({
    queryKey: queryKeys.summary(key),
    queryFn: () => budgetApi.getMonthSummary(key),
  });
}

export function useUpdateBudget() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (budget: Budget) => budgetApi.updateBudget(budget),
    onSuccess: (budget) => {
      qc.setQueryData(queryKeys.budget, budget);
      return qc.invalidateQueries({ queryKey: queryKeys.summaryAll });
    },
  });
}
