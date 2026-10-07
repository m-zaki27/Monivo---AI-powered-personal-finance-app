import { router } from 'expo-router';
import { Inbox } from 'lucide-react-native';
import { View } from 'react-native';
import { FadeInDown } from 'react-native-reanimated';

import { DraftCard, useDrafts } from '@/components/add';
import { FormError } from '@/components/forms';
import { Button, EmptyState, Header, Screen, Text, useToast } from '@/components/ui';
import { useAccountMap, useAddTransactions, useCategoryMap, useCurrency } from '@/hooks';
import { AnimatedView } from '@/lib/animated';
import { formatMoney } from '@/lib/money';

/** The shared last step of manual, scan and voice: review everything, then save. */
export default function ConfirmScreen() {
  const { drafts, removeDraft } = useDrafts();
  const categories = useCategoryMap();
  const accounts = useAccountMap();
  const currency = useCurrency();
  const save = useAddTransactions();
  const toast = useToast();
  const count = drafts.length;
  const net = drafts.reduce((s, d) => s + (d.type === 'income' ? d.amount : -d.amount), 0);

  const onSave = () =>
    save.mutate(
      drafts.map(({ key: _key, ...input }) => input),
      {
        onSuccess: () => {
          toast.show({ message: count === 1 ? 'Transaction saved' : `${count} transactions saved`, tone: 'success' });
          // Close the whole add flow (every screen in this modal) in one go.
          router.dismissTo('/');
        },
      },
    );

  return (
    <Screen
      scroll
      header={<Header title={count > 1 ? `Confirm ${count} transactions` : 'Confirm'} />}
      footer={
        count > 0 && (
          <View className="gap-3">
            <FormError message={save.error?.message} />
            <Button title={count > 1 ? `Save ${count} transactions` : 'Save transaction'} loading={save.isPending} onPress={onSave} fullWidth />
          </View>
        )
      }
      contentClassName="gap-4 pt-4"
    >
      {count === 0 ? (
        <EmptyState icon={Inbox} title="Nothing to save" message="Everything was removed." actionLabel="Close" onAction={() => router.dismissTo('/')} />
      ) : (
        <>
          <Text tone="muted">
            {count > 1
              ? `Check these over. Together they come to ${formatMoney(net, { currency, signed: true })}.`
              : 'Check the details, then save.'}
          </Text>
          {drafts.map((d, i) => (
            <AnimatedView key={d.key} entering={FadeInDown.duration(300).delay(i * 60)}>
              <DraftCard
                draft={d}
                category={categories.get(d.categoryId)}
                accountName={accounts.get(d.accountId)?.name}
                currency={currency}
                onEdit={() => router.push({ pathname: '/add-manual', params: { draftKey: d.key } })}
                onRemove={count > 1 ? () => removeDraft(d.key) : undefined}
              />
            </AnimatedView>
          ))}
        </>
      )}
    </Screen>
  );
}
