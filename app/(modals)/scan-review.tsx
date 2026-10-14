import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { View } from 'react-native';
import { FadeIn } from 'react-native-reanimated';

import { useDrafts } from '@/components/add';
import { ReceiptReviewFields, ScanningView } from '@/components/scan';
import { Button, ErrorState, Header, Screen } from '@/components/ui';
import { useCurrency, useDefaultAccount, useExtractReceipt } from '@/hooks';
import { AnimatedView } from '@/lib/animated';
import { centsToInput } from '@/lib/money';
import { formToDraft, receiptReviewSchema, type ReceiptReviewValues } from '@/schemas/transactionForm';

export default function ScanReviewScreen() {
  const { receiptPhoto, setDrafts } = useDrafts();
  const extract = useExtractReceipt();
  const account = useDefaultAccount();
  const currency = useCurrency();
  const form = useForm<ReceiptReviewValues>({
    resolver: zodResolver(receiptReviewSchema),
    defaultValues: { amount: '', merchant: '', categoryId: '', date: new Date().toISOString() },
    mode: 'onTouched',
  });

  const run = () =>
    extract.mutate(receiptPhoto ?? 'sample', {
      // Pre-fill the form with what the "AI" found; every field stays editable.
      onSuccess: (r) => form.reset({ amount: centsToInput(r.total), merchant: r.merchant, categoryId: r.categoryId, date: r.date }),
    });

  // Start reading as soon as the screen opens (once).
  // eslint-disable-next-line react-hooks/exhaustive-deps -- deliberately once, not on every render
  useEffect(run, []);

  const submit = form.handleSubmit((v) => {
    const draft = formToDraft({ ...v, type: 'expense', accountId: account.data?.id ?? '', note: '' }, 'scan');
    setDrafts([draft]);
    router.push('/confirm');
  });

  const done = extract.isSuccess;
  // What to show on screen: the photo itself, or the drawn sample receipt.
  const photoUri = !receiptPhoto || receiptPhoto === 'sample' ? 'sample' : receiptPhoto.uri;

  return (
    <Screen
      scroll
      header={<Header title={done ? 'Review receipt' : 'Reading receipt'} />}
      footer={
        done && (
          <View className="gap-3">
            <Button title="Looks good" onPress={submit} fullWidth />
            <Button title="Retake photo" variant="ghost" onPress={() => router.back()} fullWidth />
          </View>
        )
      }
      contentClassName="pt-4"
    >
      {extract.isError ? (
        <View className="gap-4">
          <ErrorState error={extract.error} onRetry={run} />
          <Button title="Add it manually instead" variant="secondary" onPress={() => router.replace('/add-manual')} fullWidth />
        </View>
      ) : !done ? (
        <ScanningView photo={photoUri} />
      ) : (
        <AnimatedView entering={FadeIn.duration(300)}>
          <ReceiptReviewFields form={form} photo={photoUri} confidence={extract.data.confidence} currency={currency} />
        </AnimatedView>
      )}
    </Screen>
  );
}
