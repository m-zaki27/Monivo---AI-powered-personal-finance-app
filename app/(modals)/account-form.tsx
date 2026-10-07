import { zodResolver } from '@hookform/resolvers/zod';
import { useLocalSearchParams } from 'expo-router';
import { useForm } from 'react-hook-form';

import { AccountCardSkeleton, AccountFormFields } from '@/components/accounts';
import { FormError } from '@/components/forms';
import { Button, Header, Screen, useToast } from '@/components/ui';
import { useAccounts, useCreateAccount, useCurrency, useUpdateAccount } from '@/hooks';
import { parseToCents } from '@/lib/money';
import { closeModal } from '@/lib/navigation';
import { accountFormSchema, type AccountFormValues } from '@/schemas/accountForm';
import type { AccountWithBalance } from '@/schemas/models';

const blank: AccountFormValues = {
  name: '',
  type: 'bank',
  institution: '',
  last4: '',
  color: 'cobalt',
  startingBalance: '',
  isDefault: false,
};

/** Add (no params) or edit (`?id=`) an account. */
export default function AccountFormScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const accounts = useAccounts();
  const existing = id ? accounts.data?.find((a) => a.id === id) : undefined;

  // When editing, wait for the account so the form starts with its real values.
  if (id && !existing) {
    return (
      <Screen header={<Header title="Edit account" />} contentClassName="pt-4">
        <AccountCardSkeleton />
      </Screen>
    );
  }
  return <AccountFormBody existing={existing} />;
}

function AccountFormBody({ existing }: { existing?: AccountWithBalance }) {
  const currency = useCurrency();
  const toast = useToast();
  const create = useCreateAccount();
  const update = useUpdateAccount();
  const form = useForm<AccountFormValues>({
    resolver: zodResolver(accountFormSchema),
    defaultValues: existing
      ? { ...blank, name: existing.name, type: existing.type, institution: existing.institution ?? '', last4: existing.last4 ?? '', color: existing.color }
      : blank,
    mode: 'onTouched',
  });
  const mutation = existing ? update : create;

  const submit = form.handleSubmit(async (v) => {
    const isCash = v.type === 'cash';
    const details = {
      name: v.name.trim(),
      type: v.type,
      color: v.color,
      // Empty optional fields become undefined rather than "" in the data.
      institution: isCash ? undefined : v.institution.trim() || undefined,
      last4: isCash ? undefined : v.last4 || undefined,
    };
    try {
      if (existing) {
        await update.mutateAsync({ id: existing.id, patch: details });
      } else {
        const cents = parseToCents(v.startingBalance) ?? 0;
        await create.mutateAsync({ ...details, startingBalance: v.type === 'credit' ? -cents : cents, isDefault: v.isDefault });
      }
      toast.show({ message: existing ? 'Account updated' : `${details.name} added`, tone: 'success' });
      closeModal();
    } catch {
      // The error banner below reads mutation.error.
    }
  });

  return (
    <Screen
      scroll
      header={<Header title={existing ? 'Edit account' : 'New account'} leading="close" />}
      footer={
        <>
          <FormError message={mutation.error?.message} />
          <Button title={existing ? 'Save changes' : 'Add account'} loading={form.formState.isSubmitting} onPress={submit} fullWidth className="mt-3" />
        </>
      }
      contentClassName="pt-4"
    >
      <AccountFormFields form={form} currency={currency} mode={existing ? 'edit' : 'create'} balance={existing?.balance} />
    </Screen>
  );
}
