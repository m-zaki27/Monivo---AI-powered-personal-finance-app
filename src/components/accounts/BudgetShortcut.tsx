import { router } from 'expo-router';
import { ChevronRight, Target } from 'lucide-react-native';
import { View } from 'react-native';

import { Card, ProgressBar, Skeleton, Text } from '@/components/ui';
import { useMonthSummary } from '@/hooks';
import { withAlpha } from '@/lib/color';
import { formatMoney } from '@/lib/money';
import { useTheme } from '@/theme';

/** Compact budget row that opens the budget settings. */
export function BudgetShortcut({ currency }: { currency: string }) {
  const { colors } = useTheme();
  const summary = useMonthSummary();
  const s = summary.data;

  return (
    <Card onPress={() => router.push('/budget')} accessibilityLabel="Monthly budget settings" className="gap-4">
      <View className="flex-row items-center gap-3">
        <View className="h-11 w-11 items-center justify-center rounded-full" style={{ backgroundColor: withAlpha(colors.secondary, 0.14) }}>
          <Target size={20} color={colors.secondary} strokeWidth={2} />
        </View>
        <View className="flex-1">
          <Text weight="bold">Monthly budget</Text>
          {s && !s.budget ? (
            <Text variant="caption" tone="muted">
              Not set yet. Tap to set one.
            </Text>
          ) : s?.budget ? (
            <Text variant="caption" tone="muted">
              {formatMoney(s.expense, { currency, hideZeroCents: true })} of {formatMoney(s.budget.monthlyLimit, { currency, hideZeroCents: true })} · alerts at{' '}
              {Math.round(s.budget.alertThreshold * 100)}%
            </Text>
          ) : (
            <Skeleton height={12} width="70%" className="mt-1" />
          )}
        </View>
        <ChevronRight size={20} color={colors.muted} />
      </View>
      {s?.budget && s.usedRatio != null && <ProgressBar value={s.usedRatio} warnAt={s.budget.alertThreshold} />}
    </Card>
  );
}
