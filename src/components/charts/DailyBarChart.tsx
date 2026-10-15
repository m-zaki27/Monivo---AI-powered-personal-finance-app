import { useMemo, useState } from 'react';
import { View } from 'react-native';
import { BarChart } from 'react-native-gifted-charts';

import { Money, Text } from '@/components/ui';
import { haptics } from '@/lib/haptics';
import { formatCompactNumber } from '@/lib/money';
import { useTheme } from '@/theme';
import { fonts } from '@/theme/tokens';

import type { DayTotals } from './dailySeries';

interface DailyBarChartProps {
  days: DayTotals[];
  /** e.g. "Oct" */
  monthLabel: string;
  currency: string;
}

const BAR = 7;
const PAIR_GAP = 2;
const MIN_DAY_GAP = 10;
const EDGE = 6;
const Y_LABEL_WIDTH = 40;
const SECTIONS = 3;

/** Rounds the axis top up to a "nice" number (300, 1.5K, 3K…) so labels aren't like "$953". */
function niceMax(max: number): number {
  if (max <= 0) return SECTIONS * 10;
  const step = max / SECTIONS;
  const mag = 10 ** Math.floor(Math.log10(step));
  const nice = [1, 2, 2.5, 5, 10].find((m) => m * mag >= step) ?? 10;
  return nice * mag * SECTIONS;
}

/** The latest day that has any money moving (today is often still empty). */
function lastActiveDay(days: DayTotals[]): number {
  for (let i = days.length - 1; i >= 0; i--) if (days[i]!.income || days[i]!.expense) return i;
  return days.length - 1;
}

/** Grouped income/expense bars; gifted-charts has no groups, so pairs are faked via per-bar `spacing`. */
export function DailyBarChart({ days, monthLabel, currency }: DailyBarChartProps) {
  const { colors } = useTheme();
  const [width, setWidth] = useState(0);
  const [selected, setSelected] = useState(() => lastActiveDay(days));
  const active = days[selected];
  const chartWidth = width - Y_LABEL_WIDTH - 8;
  // Widen gaps early in the month so bars fill the card; later the minimum gap wins and it scrolls.
  const dayGap = Math.max(MIN_DAY_GAP, (chartWidth - EDGE * 2 - days.length * (BAR * 2 + PAIR_GAP)) / Math.max(days.length, 1));
  const maxValue = useMemo(() => niceMax(Math.max(...days.map((d) => Math.max(d.income, d.expense) / 100))), [days]);

  const data = useMemo(() => {
    const label = { color: colors.muted, fontSize: 10, fontFamily: fonts.numMedium };
    return days.flatMap((d, i) => {
      const dim = i !== selected;
      return [
        {
          value: d.income / 100,
          frontColor: colors.income,
          spacing: PAIR_GAP,
          // Label every 5th day (and the 1st) so the axis isn't a smear of numbers.
          label: d.day === 1 || d.day % 5 === 0 ? String(d.day) : undefined,
          labelWidth: BAR * 2 + PAIR_GAP,
          labelTextStyle: label,
          opacity: dim ? 0.55 : 1,
        },
        { value: d.expense / 100, frontColor: colors.expense, spacing: dayGap, opacity: dim ? 0.55 : 1 },
      ];
    });
  }, [days, selected, colors, dayGap]);

  return (
    <View className="gap-4">
      {/* Amounts on their own row so long currencies don't push the legend off the card. */}
      <View className="gap-1">
        <View className="flex-row items-center justify-between">
          <Text variant="caption" tone="muted">
            {active ? `${monthLabel} ${active.day}` : monthLabel}
          </Text>
          <View className="flex-row gap-3">
            <Legend color={colors.income} label="In" />
            <Legend color={colors.expense} label="Out" />
          </View>
        </View>
        <View className="flex-row flex-wrap items-baseline gap-x-3">
          <Money cents={active?.income ?? 0} signed currency={currency} variant="moneySm" tone="income" />
          <Money cents={-(active?.expense ?? 0)} signed currency={currency} variant="moneySm" tone="expense" />
        </View>
      </View>

      <View onLayout={(e) => setWidth(e.nativeEvent.layout.width)} accessibilityLabel={`Daily income and spending for ${monthLabel}`}>
        {width > 0 && (
          <BarChart
            data={data}
            width={chartWidth}
            height={140}
            barWidth={BAR}
            initialSpacing={EDGE}
            endSpacing={EDGE}
            maxValue={maxValue}
            roundedTop
            barBorderTopLeftRadius={3}
            barBorderTopRightRadius={3}
            noOfSections={SECTIONS}
            yAxisLabelWidth={Y_LABEL_WIDTH}
            yAxisThickness={0}
            xAxisThickness={1}
            xAxisColor={colors.border}
            rulesColor={colors.border}
            yAxisTextStyle={{ color: colors.muted, fontSize: 10, fontFamily: fonts.numMedium }}
            // No currency code: "PKR 300K" is wider than the axis and gets clipped.
            formatYLabel={(l) => formatCompactNumber(Number(l))}
            scrollToEnd
            showScrollIndicator={false}
            onPress={(_item: unknown, index: number) => {
              haptics.select();
              setSelected(Math.floor(index / 2));
            }}
          />
        )}
      </View>
    </View>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <View className="flex-row items-center gap-1.5">
      <View className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />
      <Text variant="caption" tone="muted">
        {label}
      </Text>
    </View>
  );
}
