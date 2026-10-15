import { Store, StickyNote } from 'lucide-react-native';
import { Controller, type UseFormReturn } from 'react-hook-form';
import { View } from 'react-native';

import { FormInput } from '@/components/forms';
import { SegmentedControl } from '@/components/ui';
import { useAccounts, useCategories } from '@/hooks';
import type { TransactionType } from '@/schemas/models';
import type { TransactionFormValues } from '@/schemas/transactionForm';
import { useTheme } from '@/theme';

import { AccountPicker } from './AccountPicker';
import { AmountField } from './AmountField';
import { CategoryPicker } from './CategoryPicker';
import { DateField } from './DateField';

interface TransactionFormProps {
  form: UseFormReturn<TransactionFormValues>;
  currency: string;
}

/** Transaction fields, for new manual entries and editing drafts. */
export function TransactionForm({ form, currency }: TransactionFormProps) {
  const { colors, palette } = useTheme();
  const categories = useCategories();
  const accounts = useAccounts();
  const { control, setValue, getValues, watch } = form;
  const type = watch('type');

  const changeType = (t: TransactionType) => {
    setValue('type', t);
    // An "Income" entry can't keep an expense category like Groceries.
    const current = categories.data?.find((c) => c.id === getValues('categoryId'));
    if (current && current.kind !== t) setValue('categoryId', '');
  };

  return (
    <View className="gap-8">
      <SegmentedControl<TransactionType>
        accessibilityLabel="Transaction type"
        value={type}
        onChange={changeType}
        segments={[
          { value: 'expense', label: 'Expense', activeColor: colors.expense },
          { value: 'income', label: 'Income', activeColor: palette.sky },
        ]}
      />

      <Controller
        control={control}
        name="amount"
        render={({ field, fieldState }) => (
          <AmountField
            value={field.value}
            onChange={field.onChange}
            onBlur={field.onBlur}
            currency={currency}
            tone={type}
            error={fieldState.error?.message}
          />
        )}
      />

      <FormInput
        control={control}
        name="merchant"
        label={type === 'income' ? 'From' : 'Where'}
        placeholder={type === 'income' ? 'e.g. Northwind Labs' : 'e.g. Whole Foods'}
        leftIcon={Store}
        autoCapitalize="words"
        returnKeyType="done"
      />

      <Controller
        control={control}
        name="categoryId"
        render={({ field, fieldState }) => (
          <CategoryPicker categories={categories.data} type={type} value={field.value} onChange={field.onChange} error={fieldState.error?.message} />
        )}
      />

      <Controller
        control={control}
        name="accountId"
        render={({ field, fieldState }) => (
          <AccountPicker accounts={accounts.data} value={field.value} onChange={field.onChange} error={fieldState.error?.message} />
        )}
      />

      <Controller control={control} name="date" render={({ field }) => <DateField value={field.value} onChange={field.onChange} />} />

      <FormInput
        control={control}
        name="note"
        label="Note (optional)"
        placeholder="Anything to remember?"
        leftIcon={StickyNote}
        returnKeyType="done"
        maxLength={140}
      />
    </View>
  );
}
