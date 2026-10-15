import { router } from 'expo-router';
import { Download, Receipt, SearchX } from 'lucide-react-native';
import { useCallback, useMemo, useState } from 'react';
import { RefreshControl, SectionList, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  DayHeader,
  groupByDay,
  MonthChartCard,
  SwipeableTransactionRow,
  TransactionFilterBar,
  TransactionRowSkeleton,
  useExportCsv,
  type TransactionFilterState,
} from '@/components/transactions';
import { EmptyState, ErrorState, Header, IconButton, Screen, TAB_BAR_SPACE, useToast } from '@/components/ui';
import {
  useAccountMap,
  useAccounts,
  useCategoryMap,
  useCurrency,
  useDebouncedValue,
  useDeleteTransaction,
  useRestoreTransaction,
  useTransactions,
} from '@/hooks';
import type { Transaction } from '@/schemas/models';
import { useTheme } from '@/theme';

export default function TransactionsScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const currency = useCurrency();
  const accountsQ = useAccounts();
  const accounts = useAccountMap();
  const categories = useCategoryMap();
  const [filters, setFilters] = useState<TransactionFilterState>({ search: '' });
  // Typing updates the input instantly; the query only re-runs once typing pauses.
  const search = useDebouncedValue(filters.search.trim(), 250);
  const list = useTransactions({ search: search || undefined, type: filters.type, accountId: filters.accountId });
  const sections = useMemo(() => groupByDay(list.data ?? []), [list.data]);
  const remove = useDeleteTransaction();
  const restore = useRestoreTransaction();
  const { exportCsv, exporting } = useExportCsv(currency);
  const [refreshing, setRefreshing] = useState(false);

  const hasFilters = !!(filters.search || filters.type || filters.accountId);

  // Stable callback so memoized rows don't all re-render on every keystroke.
  // `mutate` functions are stable across renders; the mutation objects aren't.
  const { mutate: removeTx } = remove;
  const { mutate: restoreTx } = restore;
  const onDelete = useCallback(
    (t: Transaction) => {
      removeTx(t.id, { onError: (e) => toast.show({ message: e.message, tone: 'error' }) });
      toast.show({
        message: `Deleted ${t.merchant}`,
        action: { label: 'Undo', onPress: () => restoreTx(t) },
      });
    },
    [removeTx, restoreTx, toast],
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await list.refetch();
    setRefreshing(false);
  };

  const empty = list.isPending ? (
    <View className="px-6">
      {Array.from({ length: 6 }, (_, i) => (
        <TransactionRowSkeleton key={i} />
      ))}
    </View>
  ) : list.isError && !list.data ? (
    <ErrorState error={list.error} onRetry={() => list.refetch()} />
  ) : hasFilters ? (
    <EmptyState
      icon={SearchX}
      title="No matches"
      message="Try a different search or clear the filters."
      actionLabel="Clear filters"
      onAction={() => setFilters({ search: '' })}
    />
  ) : (
    <EmptyState
      icon={Receipt}
      title="No transactions yet"
      message="Everything you add shows up here, grouped by day."
      actionLabel="Add a transaction"
      onAction={() => router.push('/add-manual')}
    />
  );

  return (
    <Screen padded={false} noBottomInset>
      <View className="px-6">
        <Header
          large
          title="Transactions"
          right={
            <IconButton
              icon={Download}
              accessibilityLabel="Export CSV"
              disabled={exporting || !list.data}
              onPress={() => exportCsv(list.data ?? [])}
            />
          }
        />
      </View>
      <TransactionFilterBar value={filters} onChange={setFilters} accounts={accountsQ.data ?? []} />

      <SectionList
        className="mt-2 flex-1"
        sections={sections}
        keyExtractor={(t) => t.id}
        renderItem={({ item }) => (
          <SwipeableTransactionRow
            transaction={item}
            category={categories.get(item.categoryId)}
            accountName={accounts.get(item.accountId)?.name}
            currency={currency}
            onDelete={onDelete}
          />
        )}
        renderSectionHeader={({ section }) => <DayHeader title={section.title} net={section.net} currency={currency} />}
        stickySectionHeadersEnabled
        ListHeaderComponent={
          <View className="px-6 pb-2 pt-2">
            <MonthChartCard accountId={filters.accountId} currency={currency} />
          </View>
        }
        ListEmptyComponent={empty}
        contentContainerStyle={{ paddingBottom: insets.bottom + TAB_BAR_SPACE }}
        keyboardDismissMode="on-drag"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.secondary} colors={[colors.secondary]} />}
      />
    </Screen>
  );
}
