import { useMemo, useState } from 'react';
import { View } from 'react-native';
import { LineChart } from 'react-native-gifted-charts';

import { Text } from '@/components/ui';
import { formatMoney } from '@/lib/money';
import { useTheme } from '@/theme';
import { fonts } from '@/theme/tokens';

import type { DayTotals } from './dailySeries';
import { trendSeries } from './trendSeries';

interface SpendingTrendProps {
  days: DayTotals[];
  /** Monthly budget in cents; draws the dashed "even pace" line when set */
  monthlyLimit: number | null;
  daysInMonth: number;
  /** e.g. "Oct" */
  monthLabel: string;
  currency: string;
  hidden: boolean;
}

const HEIGHT = 120;

/** Cumulative spending vs. a dashed even-pace line to the budget; axis hidden since the budget line shows the numbers. */
export function SpendingTrend({ days, monthlyLimit, daysInMonth, monthLabel, currency, hidden }: SpendingTrendProps) {
  const { colors } = useTheme();
  const [width, setWidth] = useState(0);
  const { spent, pace } = useMemo(() => trendSeries(days, monthlyLimit, daysInMonth), [days, monthlyLimit, daysInMonth]);

  const today = spent[spent.length - 1] ?? 0;
  const ahead = pace ? today - (pace[pace.length - 1] ?? 0) : 0;
  const top = Math.max(...spent, ...(pace ?? [0]), 1) / 100;
  const labels = spent.map((_, i) => (i === 0 ? `${monthLabel} 1` : i === spent.length - 1 ? 'Today' : ''));
  const toPoints = (values: number[]) => values.map((v) => ({ value: v / 100 }));

  return (
    <View className="gap-3">
      <View className="flex-row items-end justify-between gap-3">
        <View className="flex-1">
          <Text variant="caption" tone="muted">
            Spending pace
          </Text>
          <Text variant="bodySm" weight="semibold" style={pace && ahead > 0 ? { color: colors.warning } : undefined}>
            {!pace
              ? `${hidden ? '••••' : formatMoney(today, { currency, hideZeroCents: true })} spent so far`
              : ahead > 0
                ? `${hidden ? '••••' : formatMoney(ahead, { currency, hideZeroCents: true })} ahead of budget pace`
                : 'On track with your budget'}
          </Text>
        </View>
        {pace && (
          <View className="flex-row gap-3">
            <Legend color={colors.expense} label="You" />
            <Legend color={colors.muted} label="Even pace" dashed />
          </View>
        )}
      </View>

      <View onLayout={(e) => setWidth(e.nativeEvent.layout.width)} accessibilityLabel="Spending so far this month compared with an even pace to your budget">
        {width > 0 && (
          <LineChart
            data={toPoints(spent)}
            data2={pace ? toPoints(pace) : undefined}
            width={width}
            height={HEIGHT}
            adjustToWidth
            initialSpacing={2}
            endSpacing={6}
            maxValue={top * 1.12}
            noOfSections={3}
            areaChart
            curved
            isAnimated
            thickness={3}
            color={colors.expense}
            startFillColor={colors.expense}
            endFillColor={colors.expense}
            startOpacity={0.28}
            endOpacity={0.02}
            thickness2={2}
            color2={colors.muted}
            strokeDashArray2={[6, 6]}
            startOpacity2={0}
            endOpacity2={0}
            hideDataPoints
            hideDataPoints2
            hideYAxisText
            yAxisLabelWidth={0}
            yAxisThickness={0}
            xAxisThickness={1}
            xAxisColor={colors.border}
            rulesColor={colors.border}
            rulesType="dashed"
            xAxisLabelTexts={labels}
            xAxisLabelTextStyle={{ color: colors.muted, fontSize: 10, fontFamily: fonts.numMedium, width: 48 }}
            disableScroll
          />
        )}
      </View>
    </View>
  );
}

function Legend({ color, label, dashed }: { color: string; label: string; dashed?: boolean }) {
  return (
    <View className="flex-row items-center gap-1.5">
      <View className="w-4 flex-row gap-0.5">
        {dashed ? (
          <>
            <View className="h-0.5 flex-1 rounded-full" style={{ backgroundColor: color }} />
            <View className="h-0.5 flex-1 rounded-full" style={{ backgroundColor: color }} />
          </>
        ) : (
          <View className="h-[3px] flex-1 rounded-full" style={{ backgroundColor: color }} />
        )}
      </View>
      <Text variant="caption" tone="muted">
        {label}
      </Text>
    </View>
  );
}
