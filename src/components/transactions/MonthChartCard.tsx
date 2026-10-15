import { useMemo } from 'react';
import { View } from 'react-native';

import { DailyBarChart, dailySeries } from '@/components/charts';
import { Card, ErrorState, SectionHeader, Skeleton } from '@/components/ui';
import { useTransactions } from '@/hooks';
import { formatMonthShort, startOfMonth } from '@/lib/dates';

interface MonthChartCardProps {
  accountId?: string;
  currency: string;
}

/** Own query (this month, current account) so search text doesn't reshape the chart. */
export function MonthChartCard({ accountId, currency }: MonthChartCardProps) {
  // Once per mount so the query key stays stable.
  const [now, from] = useMemo(() => {
    const n = new Date();
    return [n, startOfMonth(n).toISOString()] as const;
  }, []);
  const q = useTransactions({ from, accountId });
  const days = useMemo(() => (q.data ? dailySeries(q.data, now) : undefined), [q.data, now]);

  return (
    <Card className="gap-2">
      <SectionHeader title="This month" />
      {q.isError && !q.data ? (
        <ErrorState compact error={q.error} onRetry={() => q.refetch()} />
      ) : !days ? (
        <View className="gap-3">
          <Skeleton height={32} width="50%" />
          <Skeleton height={150} rounded="rounded-input" />
        </View>
      ) : (
        <DailyBarChart days={days} monthLabel={formatMonthShort(now)} currency={currency} />
      )}
    </Card>
  );
}
