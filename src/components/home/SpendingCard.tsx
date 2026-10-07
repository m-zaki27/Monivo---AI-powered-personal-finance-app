import { PieChart as PieIcon } from 'lucide-react-native';
import { useMemo } from 'react';
import { View } from 'react-native';

import { SpendingDonut, toSlices } from '@/components/charts';
import { Card, EmptyState, ErrorState, SectionHeader, Skeleton } from '@/components/ui';
import { useCategoryMap } from '@/hooks';
import { formatMonthShort } from '@/lib/dates';
import type { MonthSummary } from '@/services';
import { useTheme } from '@/theme';

interface SpendingCardProps {
  summary?: MonthSummary;
  error?: unknown;
  onRetry: () => void;
  currency: string;
}

export function SpendingCard({ summary, error, onRetry, currency }: SpendingCardProps) {
  const { colors } = useTheme();
  const categories = useCategoryMap();
  // useMemo: grouping/sorting only re-runs when the data changes, not on every render.
  const slices = useMemo(
    () => (summary ? toSlices(summary.byCategory, categories, colors.muted) : []),
    [summary, categories, colors.muted],
  );

  return (
    <Card className="gap-2">
      <SectionHeader title={`Spending in ${formatMonthShort(new Date())}`} />
      {error ? (
        <ErrorState compact error={error} onRetry={onRetry} />
      ) : !summary ? (
        <View className="items-center gap-6 py-2">
          <Skeleton width={168} height={168} rounded="rounded-full" />
          <View className="w-full gap-3">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} height={14} />
            ))}
          </View>
        </View>
      ) : slices.length === 0 ? (
        <EmptyState compact icon={PieIcon} title="No spending yet" message="Your first expense this month will show up here." />
      ) : (
        <SpendingDonut slices={slices} total={summary.expense} currency={currency} />
      )}
    </Card>
  );
}
