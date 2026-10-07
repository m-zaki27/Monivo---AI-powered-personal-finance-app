import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { View } from 'react-native';

import { BudgetFormFields } from '@/components/budget/BudgetFormFields';
import { FormError } from '@/components/forms';
import { Button, ErrorState, Header, Screen, Skeleton, useToast } from '@/components/ui';
import { useBudget, useCurrency, useMonthSummary, useUpdateBudget } from '@/hooks';
import { centsToInput, parseToCents } from '@/lib/money';
import { closeModal } from '@/lib/navigation';
import type { Budget } from '@/schemas/models';
import { budgetFormSchema, type BudgetFormValues } from '@/schemas/accountForm';

export default function BudgetScreen() {
  const budget = useBudget();
  return (
    <Screen
      scroll={!!budget.data}
      header={<Header title="Monthly budget" leading="close" />}
      contentClassName="pt-4"
    >
      {budget.isPending ? (
        <View className="items-center gap-6 pt-6">
          <Skeleton width={200} height={56} />
          <Skeleton height={96} rounded="rounded-card" />
          <Skeleton height={44} />
        </View>
      ) : budget.isError ? (
        <ErrorState error={budget.error} onRetry={() => budget.refetch()} />
      ) : (
        <BudgetForm budget={budget.data} />
      )}
    </Screen>
  );
}

/** Split out so useForm starts with the loaded values (defaultValues are only read once). */
function BudgetForm({ budget }: { budget: Budget }) {
  const currency = useCurrency();
  const summary = useMonthSummary();
  const update = useUpdateBudget();
  const toast = useToast();
  const form = useForm<BudgetFormValues>({
    resolver: zodResolver(budgetFormSchema),
    defaultValues: {
      monthlyLimit: centsToInput(budget.monthlyLimit).replace(/\.00$/, ''),
      alertThreshold: budget.alertThreshold,
      emailAlerts: budget.emailAlerts,
    },
    mode: 'onTouched',
  });

  const submit = form.handleSubmit((v) =>
    update.mutate(
      { monthlyLimit: parseToCents(v.monthlyLimit) ?? 0, alertThreshold: v.alertThreshold, emailAlerts: v.emailAlerts },
      {
        onSuccess: () => {
          toast.show({ message: 'Budget updated', tone: 'success' });
          closeModal();
        },
      },
    ),
  );

  return (
    <View className="gap-6 pb-4">
      <BudgetFormFields form={form} currency={currency} spent={summary.data?.expense} />
      <FormError message={update.error?.message} />
      <Button title="Save budget" loading={update.isPending} onPress={submit} fullWidth />
    </View>
  );
}
