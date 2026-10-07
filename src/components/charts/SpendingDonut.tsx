import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { PieChart } from 'react-native-gifted-charts';

import { Money, Text } from '@/components/ui';
import { haptics } from '@/lib/haptics';
import { cn } from '@/lib/cn';
import { useTheme } from '@/theme';

import type { Slice } from './spendingSlices';

interface SpendingDonutProps {
  slices: Slice[];
  total: number;
  currency: string;
}

const RADIUS = 84;

/**
 * Donut + legend. Tapping a slice or a legend row puts that category in the
 * centre; tapping it again goes back to the total.
 */
export function SpendingDonut({ slices, total, currency }: SpendingDonutProps) {
  const { colors } = useTheme();
  const [selected, setSelected] = useState<number | null>(null);
  const active = selected != null ? slices[selected] : undefined;

  const toggle = (i: number) => {
    haptics.select();
    setSelected((s) => (s === i ? null : i));
  };

  return (
    <View className="gap-6">
      <View className="items-center" accessibilityLabel="Spending by category chart">
        <PieChart
          donut
          radius={RADIUS}
          innerRadius={RADIUS - 22}
          innerCircleColor={colors.surface}
          // A thin stroke in the card colour draws a gap between slices.
          strokeWidth={2}
          strokeColor={colors.surface}
          extraRadius={6}
          data={slices.map((s, i) => ({ value: s.value, color: s.color, focused: i === selected, onPress: () => toggle(i) }))}
          centerLabelComponent={() => (
            <View className="items-center px-4">
              <Text variant="caption" tone="muted" numberOfLines={1}>
                {active ? active.label : 'Spent this month'}
              </Text>
              <Money cents={active ? active.value : total} currency={currency} variant="moneyMd" />
              {active && (
                <Text variant="caption" tone="muted">
                  {Math.round(active.share * 100)}%
                </Text>
              )}
            </View>
          )}
        />
      </View>

      <View className="gap-1">
        {slices.map((s, i) => (
          <Pressable
            key={s.key}
            onPress={() => toggle(i)}
            accessibilityRole="button"
            accessibilityState={{ selected: i === selected }}
            className={cn('min-h-11 flex-row items-center gap-3 rounded-sm px-2', i === selected && 'bg-raised')}
          >
            <View className="h-3 w-3 rounded-full" style={{ backgroundColor: s.color }} />
            <Text variant="bodySm" weight="semibold" className="flex-1" numberOfLines={1}>
              {s.label}
            </Text>
            <Text variant="caption" tone="muted" style={{ fontVariant: ['tabular-nums'] }}>
              {Math.round(s.share * 100)}%
            </Text>
            <Money cents={s.value} currency={currency} variant="moneySm" className="min-w-[84px] text-right" />
          </Pressable>
        ))}
      </View>
    </View>
  );
}
