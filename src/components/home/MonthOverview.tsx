import { router } from 'expo-router';
import { useMemo } from 'react';
import { useWindowDimensions, View } from 'react-native';

import { dailySeries, Ring, SpendingTrend, toSlices, type Slice } from '@/components/charts';
import { ErrorState, MAX_CONTENT_WIDTH, progressTone, SectionHeader, Skeleton, Text, TextLink } from '@/components/ui';
import { useCategoryMap, useTransactions } from '@/hooks';
import { daysInMonth, formatMonthShort, startOfMonth } from '@/lib/dates';
import { formatMoney } from '@/lib/money';
import type { MonthSummary } from '@/services';
import { useTheme } from '@/theme';

interface MonthOverviewProps {
  summary?: MonthSummary;
  error?: unknown;
  onRetry: () => void;
  currency: string;
  hidden: boolean;
}

/** "This month": budget gauge, pace chart, and spending by category. */
export function MonthOverview({ summary, error, onRetry, currency, hidden }: MonthOverviewProps) {
  const { colors } = useTheme();
  const RING = useRingSize();
  const categories = useCategoryMap();
  const slices = useMemo(
    () => (summary ? toSlices(summary.byCategory, categories, colors.muted, 4) : []),
    [summary, categories, colors.muted],
  );
  // Same query as the Transactions chart, so the cache is shared.
  const [now, from] = useMemo(() => {
    const n = new Date();
    return [n, startOfMonth(n).toISOString()] as const;
  }, []);
  const thisMonth = useTransactions({ from });
  const days = useMemo(() => (thisMonth.data ? dailySeries(thisMonth.data, now) : undefined), [thisMonth.data, now]);
  const fmt = (c: number) => (hidden ? '••••' : formatMoney(c, { currency, hideZeroCents: true }));
  const month = new Date().toLocaleString('en-US', { month: 'long' });

  return (
    <View className="gap-4">
      <SectionHeader prominent title={`${month} so far`} actionLabel="Budget" onAction={() => router.push('/budget')} />
      {error ? (
        <ErrorState compact error={error} onRetry={onRetry} />
      ) : !summary ? (
        <View className="gap-3">
          <View className="flex-row items-center gap-5">
            <Skeleton width={RING} height={RING} rounded="rounded-full" />
            <View className="flex-1 gap-2">
              <Skeleton height={12} width="50%" />
              <Skeleton height={22} width="80%" />
              <Skeleton height={12} width="60%" />
            </View>
          </View>
        </View>
      ) : (
        <>
          <BudgetLine summary={summary} fmt={fmt} />
          {days ? (
            <View className="mt-3">
              <SpendingTrend
                days={days}
                monthlyLimit={summary.budget?.monthlyLimit ?? null}
                daysInMonth={daysInMonth(now)}
                monthLabel={formatMonthShort(now)}
                currency={currency}
                hidden={hidden}
              />
            </View>
          ) : (
            <Skeleton height={150} rounded="rounded-input" className="mt-3" />
          )}
          <SpendingSplit slices={slices} fmt={fmt} total={summary.expense} currency={currency} hidden={hidden} />
        </>
      )}
    </View>
  );
}

/** Ring size follows the screen: ~100px on small phones, up to 140px on large ones and tablets. */
function useRingSize() {
  const { width } = useWindowDimensions();
  return Math.round(Math.min(Math.max(Math.min(width, MAX_CONTENT_WIDTH) * 0.3, 100), 140));
}

/** Budget as a ring gauge: % used in the middle, the amounts beside it. */
function BudgetLine({ summary, fmt }: { summary: MonthSummary; fmt: (c: number) => string }) {
  const { colors } = useTheme();
  const RING = useRingSize();
  const { expense, budget, usedRatio } = summary;

  if (!budget || usedRatio == null) {
    return (
      <View className="flex-row items-center justify-between gap-3">
        <Text weight="semibold">
          {fmt(expense)} <Text tone="muted">spent</Text>
        </Text>
        <TextLink label="Set a budget" onPress={() => router.push('/budget')} />
      </View>
    );
  }

  const tone = progressTone(usedRatio, budget.alertThreshold);
  const pct = Math.round(usedRatio * 100);
  const left = budget.monthlyLimit - expense;
  const now = new Date();
  const daysLeft = daysInMonth(now) - now.getDate() + 1;
  const toneColor = { normal: colors.secondary, warning: colors.warning, over: colors.expense }[tone];
  const status = tone === 'over' ? `Over budget by ${fmt(-left)}` : `${fmt(left)} left · ${daysLeft} days to go`;

  return (
    <View className="flex-row items-center gap-5">
      <Ring
        size={RING}
        stroke={12}
        trackColor={colors.raised}
        segments={[{ key: 'used', value: usedRatio, color: toneColor }]}
        accessibilityLabel={`Budget ${pct}% used`}
      >
        <Text variant="moneyMd" style={{ color: toneColor }}>
          {pct}%
        </Text>
        <Text variant="caption" tone="muted">
          used
        </Text>
      </Ring>
      <View className="flex-1 gap-1">
        <Text variant="caption" tone="muted">
          Spent this month
        </Text>
        <Text variant="moneyMd" numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>
          {fmt(expense)}
        </Text>
        <Text variant="bodySm" tone="muted" numberOfLines={1}>
          of {fmt(budget.monthlyLimit)}
        </Text>
        <Text variant="caption" weight="semibold" className="mt-1" style={{ color: tone === 'normal' ? colors.muted : toneColor }}>
          {status}
        </Text>
      </View>
    </View>
  );
}

/** Where the money went: a segmented ring (total in the middle) with the top categories beside it. */
function SpendingSplit({ slices, fmt, total, currency, hidden }: { slices: Slice[]; fmt: (c: number) => string; total: number; currency: string; hidden: boolean }) {
  const { colors } = useTheme();
  const RING = useRingSize();
  if (slices.length === 0) {
    return (
      <Text variant="bodySm" tone="muted" className="mt-2">
        Your spending by category will show up here after your first expense.
      </Text>
    );
  }

  return (
    <View className="mt-3 flex-row items-center gap-5">
      <Ring
        size={RING}
        stroke={14}
        trackColor={colors.raised}
        segments={slices.map((s) => ({ key: s.key, value: s.share, color: s.color }))}
        accessibilityLabel={`Spending by category: ${slices.map((s) => `${s.label} ${Math.round(s.share * 100)}%`).join(', ')}`}
      >
        <Text variant="caption" tone="muted">
          Spent
        </Text>
        <Text variant="moneySm" numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.6} style={{ maxWidth: RING - 36 }}>
          {hidden ? '••••' : formatMoney(total, { currency, compact: true })}
        </Text>
      </Ring>
      <View className="flex-1 gap-3">
        {slices.map((s) => (
          <View key={s.key} className="flex-row items-start gap-2.5">
            <View className="mt-1.5 h-2.5 w-2.5 rounded-full" style={{ backgroundColor: s.color }} />
            <View className="flex-1">
              <Text variant="bodySm" weight="semibold" numberOfLines={1}>
                {s.label}
              </Text>
              <Text variant="caption" tone="muted" style={{ fontVariant: ['tabular-nums'] }}>
                {fmt(s.value)} · {Math.round(s.share * 100)}%
              </Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}