import { useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { Plus, Wallet } from 'lucide-react-native';
import { useState } from 'react';
import { RefreshControl, View } from 'react-native';
import { FadeInDown } from 'react-native-reanimated';

import {
  AccountActionsSheet,
  AccountCard,
  AccountCardSkeleton,
  BudgetShortcut,
  DeleteAccountDialog,
} from '@/components/accounts';
import { EmptyState, ErrorState, Header, IconButton, Money, Screen, SectionHeader, Text, useToast } from '@/components/ui';
import { queryKeys, useAccounts, useCurrency, useDeleteAccount, useSetDefaultAccount } from '@/hooks';
import { AnimatedView } from '@/lib/animated';
import { sumCents } from '@/lib/money';
import type { AccountWithBalance } from '@/schemas/models';
import { useTheme } from '@/theme';

export default function AccountsScreen() {
  const { colors } = useTheme();
  const qc = useQueryClient();
  const toast = useToast();
  const currency = useCurrency();
  const accounts = useAccounts();
  const setDefault = useSetDefaultAccount();
  const remove = useDeleteAccount();
  // Which account the sheet / dialog is about; null = closed.
  const [menuFor, setMenuFor] = useState<AccountWithBalance | null>(null);
  const [deleting, setDeleting] = useState<AccountWithBalance | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([qc.refetchQueries({ queryKey: queryKeys.accounts.all }), qc.refetchQueries({ queryKey: queryKeys.summaryAll })]);
    setRefreshing(false);
  };

  const makeDefault = (a: AccountWithBalance) =>
    setDefault.mutate(a.id, {
      onSuccess: () => toast.show({ message: `${a.name} is now your default`, tone: 'success' }),
      onError: (e) => toast.show({ message: e.message, tone: 'error' }),
    });

  const confirmDelete = (a: AccountWithBalance) =>
    remove.mutate(a.id, {
      onSuccess: () => {
        setDeleting(null);
        toast.show({ message: `${a.name} deleted`, tone: 'success' });
      },
      onError: (e) => {
        setDeleting(null);
        toast.show({ message: e.message, tone: 'error' });
      },
    });

  const netWorth = accounts.data ? sumCents(accounts.data.map((a) => a.balance)) : undefined;

  return (
    <Screen
      scroll
      withTabBar
      contentClassName="gap-4"
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.secondary} colors={[colors.secondary]} />}
    >
      <Header
        large
        title="Accounts"
        right={<IconButton icon={Plus} accessibilityLabel="Add account" onPress={() => router.push('/account-form')} />}
      />

      {netWorth != null && (
        <View className="gap-1">
          <Text variant="caption" tone="muted">
            Net worth across {accounts.data?.length} {accounts.data?.length === 1 ? 'account' : 'accounts'}
          </Text>
          <Money cents={netWorth} currency={currency} variant="moneyLg" />
        </View>
      )}

      {accounts.isPending ? (
        [0, 1, 2].map((i) => <AccountCardSkeleton key={i} />)
      ) : accounts.isError && !accounts.data ? (
        <ErrorState error={accounts.error} onRetry={() => accounts.refetch()} />
      ) : accounts.data.length === 0 ? (
        <EmptyState icon={Wallet} title="No accounts yet" message="Add a bank account, card or cash to start tracking." actionLabel="Add account" onAction={() => router.push('/account-form')} />
      ) : (
        accounts.data.map((a, i) => (
          <AnimatedView key={a.id} entering={FadeInDown.duration(350).delay(i * 70)}>
            <AccountCard account={a} currency={currency} onPress={() => setMenuFor(a)} />
          </AnimatedView>
        ))
      )}

      <View className="mt-4">
        <SectionHeader title="Budget" />
      </View>
      <BudgetShortcut currency={currency} />

      <AccountActionsSheet
        account={menuFor}
        onClose={() => setMenuFor(null)}
        onSetDefault={makeDefault}
        onEdit={(a) => router.push({ pathname: '/account-form', params: { id: a.id } })}
        onDelete={setDeleting}
      />
      <DeleteAccountDialog account={deleting} onCancel={() => setDeleting(null)} onConfirm={confirmDelete} loading={remove.isPending} />
    </Screen>
  );
}
