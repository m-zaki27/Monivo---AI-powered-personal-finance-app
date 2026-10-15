import { zodResolver } from '@hookform/resolvers/zod';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';

import { TransactionForm, useDraftDefaults, useDrafts } from '@/components/add';
import { Button, Header, Screen } from '@/components/ui';
import { useCurrency } from '@/hooks';
import {
  draftToForm,
  formToDraft,
  transactionFormSchema,
  type TransactionFormValues,
} from '@/schemas/transactionForm';

/** New manual entry, or edit a scan/voice/confirm draft via `?draftKey=`. */
export default function AddManualScreen() {
  const { draftKey } = useLocalSearchParams<{ draftKey?: string }>();
  const { drafts, setDrafts, updateDraft } = useDrafts();
  const editing = draftKey ? drafts.find((d) => d.key === draftKey) : undefined;
  const currency = useCurrency();
  const defaults = useDraftDefaults();

  const form = useForm<TransactionFormValues>({
    resolver: zodResolver(transactionFormSchema),
    defaultValues: editing ? draftToForm(editing) : defaults,
    mode: 'onTouched',
  });
  const { handleSubmit, getValues, setValue } = form;

  // Accounts may still be loading on first render; fill the default once it arrives.
  useEffect(() => {
    if (!getValues('accountId') && defaults.accountId) setValue('accountId', defaults.accountId);
  }, [defaults.accountId, getValues, setValue]);

  const submit = handleSubmit((values) => {
    if (editing) {
      updateDraft(formToDraft(values, editing.source, editing.key));
      router.back();
    } else {
      setDrafts([formToDraft(values, 'manual')]);
      router.push('/confirm');
    }
  });

  return (
    <Screen
      scroll
      header={<Header title={editing ? 'Edit transaction' : 'Add manually'} leading={editing ? 'back' : 'close'} />}
      footer={<Button title={editing ? 'Save changes' : 'Continue'} onPress={submit} fullWidth />}
      contentClassName="pt-4"
    >
      <TransactionForm form={form} currency={currency} />
    </Screen>
  );
}
