import { Building2, Hash, Tag } from 'lucide-react-native';
import { Controller, type UseFormReturn } from 'react-hook-form';
import { View } from 'react-native';

import { AmountField } from '@/components/add/AmountField';
import { FieldLabel } from '@/components/add/FieldLabel';
import { FormInput } from '@/components/forms';
import { SegmentedControl, Switch, Text } from '@/components/ui';
import { parseToCents } from '@/lib/money';
import type { AccountFormValues } from '@/schemas/accountForm';
import type { AccountType } from '@/schemas/models';

import { AccountCard } from './AccountCard';
import { ColorSwatchPicker } from './ColorSwatchPicker';

interface AccountFormFieldsProps {
  form: UseFormReturn<AccountFormValues>;
  currency: string;
  /** Creating shows starting balance + default switch; editing hides them. */
  mode: 'create' | 'edit';
  /** Current balance when editing (for the preview) */
  balance?: number;
}

export function AccountFormFields({ form, currency, mode, balance = 0 }: AccountFormFieldsProps) {
  const { control } = form;
  const v = form.watch();
  const isCash = v.type === 'cash';
  const isCredit = v.type === 'credit';
  const typed = parseToCents(v.startingBalance) ?? 0;
  // Credit balances are stored negative (money owed), but people type what they owe.
  const previewBalance = mode === 'create' ? (isCredit ? -typed : typed) : balance;

  return (
    <View className="gap-8">
      <AccountCard
        account={{ ...v, institution: isCash ? undefined : v.institution, last4: isCash ? undefined : v.last4, balance: previewBalance }}
        currency={currency}
      />

      <Controller
        control={control}
        name="type"
        render={({ field }) => (
          <SegmentedControl<AccountType>
            accessibilityLabel="Account type"
            value={field.value}
            onChange={field.onChange}
            segments={[
              { value: 'bank', label: 'Bank' },
              { value: 'credit', label: 'Card' },
              { value: 'cash', label: 'Cash' },
            ]}
          />
        )}
      />

      <FormInput control={control} name="name" label="Name" placeholder={isCash ? 'e.g. Wallet' : 'e.g. Everyday Checking'} leftIcon={Tag} autoCapitalize="words" />

      {/* Cash has no bank or card number, so those fields simply don't appear. */}
      {!isCash && (
        <View className="flex-row gap-3">
          <FormInput control={control} name="institution" label="Bank (optional)" placeholder="First Harbor" leftIcon={Building2} containerClassName="flex-[3]" autoCapitalize="words" />
          <FormInput control={control} name="last4" label="Last 4" placeholder="1234" leftIcon={Hash} keyboardType="number-pad" maxLength={4} containerClassName="flex-[2]" />
        </View>
      )}

      <Controller control={control} name="color" render={({ field }) => <ColorSwatchPicker value={field.value} onChange={field.onChange} />} />

      {mode === 'create' && (
        <>
          <Controller
            control={control}
            name="startingBalance"
            render={({ field, fieldState }) => (
              <View className="gap-3">
                <FieldLabel label={isCredit ? 'Currently owed' : 'Current balance'} />
                <AmountField size="md" value={field.value} onChange={field.onChange} onBlur={field.onBlur} currency={currency} error={fieldState.error?.message} />
              </View>
            )}
          />
          <Controller
            control={control}
            name="isDefault"
            render={({ field }) => (
              <View className="min-h-11 flex-row items-center gap-4">
                <View className="flex-1">
                  <Text weight="semibold">Make this my default</Text>
                  <Text variant="caption" tone="muted">
                    New transactions start with this account
                  </Text>
                </View>
                <Switch value={field.value} onValueChange={field.onChange} accessibilityLabel="Make this my default account" />
              </View>
            )}
          />
        </>
      )}
    </View>
  );
}
