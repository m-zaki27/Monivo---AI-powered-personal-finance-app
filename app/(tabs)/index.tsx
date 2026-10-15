import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useState } from 'react';
import { RefreshControl, View } from 'react-native';
import { FadeInDown } from 'react-native-reanimated';

import { HomeHero, MonthOverview, QuickActions, RecentTransactions } from '@/components/home';

import { ErrorState, Screen } from '@/components/ui';
import { queryKeys, useAccounts, useCurrency, useMe, useMonthSummary, usePersistentState, useRecentTransactions } from '@/hooks';
import { AnimatedView } from '@/lib/animated';
import { sumCents } from '@/lib/money';
import { useTheme } from '@/theme';

/** Staggered fade-up as the dashboard first appears. */
const enter = (i: number) => FadeInDown.duration(400).delay(i * 60);

/** Per-section queries, so one slow or failed request never blanks the dashboard. */
export default function HomeScreen() {
  const { colors } = useTheme();
  const qc = useQueryClient();
  const currency = useCurrency();
  const me = useMe();
  const accounts = useAccounts();
  const summary = useMonthSummary();
  const recent = useRecentTransactions(5);
  const [hidden, setHidden] = usePersistentState('monivo.hideBalance', false);
  const [refreshing, setRefreshing] = useState(false);

  // Own `refreshing` flag rather than `isRefetching`: background refetches
  // (e.g. after adding a transaction) shouldn't pop the pull-to-refresh spinner.
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all(
      [queryKeys.me, queryKeys.accounts.all, queryKeys.summaryAll, queryKeys.transactions.all].map((queryKey) =>
        qc.refetchQueries({ queryKey, type: 'active' }),
      ),
    );
    setRefreshing(false);
  }, [qc]);

  const total = accounts.data ? sumCents(accounts.data.map((a) => a.balance)) : undefined;

  return (
    <Screen
      scroll
      withTabBar
      contentClassName="gap-9"
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.secondary} colors={[colors.secondary]} />}
    >
      <AnimatedView entering={enter(0)} className="pt-10">
        <HomeHero
          user={me.data}
          total={total}
          accountCount={accounts.data?.length}
          income={summary.data?.income}
          expense={summary.data?.expense}
          currency={currency}
          hidden={hidden}
          onToggleHidden={() => setHidden(!hidden)}
        />
      </AnimatedView>

      {accounts.isError && !accounts.data && <ErrorState compact error={accounts.error} onRetry={() => accounts.refetch()} />}

      <AnimatedView entering={enter(1)}>
        <QuickActions />
      </AnimatedView>

      <AnimatedView entering={enter(2)}>
        <MonthOverview
          summary={summary.data}
          error={summary.isError && !summary.data ? summary.error : undefined}
          onRetry={() => summary.refetch()}
          currency={currency}
          hidden={hidden}
        />
      </AnimatedView>

      <AnimatedView entering={enter(3)}>
        <RecentTransactions
          transactions={recent.data}
          error={recent.isError && !recent.data ? recent.error : undefined}
          onRetry={() => recent.refetch()}
          currency={currency}
        />
      </AnimatedView>

      <View className="h-2" />
    </Screen>
  );
}
