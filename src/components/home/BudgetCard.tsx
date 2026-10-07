import { AlertTriangle, CircleAlert, Target } from 'lucide-react-native';
import { View } from 'react-native';

import { Card, ErrorState, Money, ProgressBar, progressTone, Skeleton, Text } from '@/components/ui';
import { withAlpha } from '@/lib/color';
import { daysInMonth } from '@/lib/dates';
import { formatMoney } from '@/lib/money';
import type { MonthSummary } from '@/services';
import { useTheme } from '@/theme';

interface BudgetCardProps {
  summary?: MonthSummary;
  error?: unknown;
  onRetry: () => void;
  currency: string;
  hidden: boolean;
}

/** Spent / limit with a bar that turns amber at the alert threshold and rose when over. */
export function BudgetCard({ summary, error, onRetry, currency, hidden }: BudgetCardProps) {
  const { colors } = useTheme();

  if (error) {
    return (
      <Card>
        <ErrorState compact error={error} onRetry={onRetry} />
      </Card>
    );
  }
  if (!summary) return <BudgetCardSkeleton />;

  const { expense, budget, usedRatio } = summary;
  const tone = progressTone(usedRatio, budget.alertThreshold);
  const pct = Math.round(usedRatio * 100);
  const left = budget.monthlyLimit - expense;
  const now = new Date();
  const daysLeft = daysInMonth(now) - now.getDate() + 1;
  const fmt = (c: number) => (hidden ? '••••' : formatMoney(c, { currency, hideZeroCents: true }));

  const status = {
    normal: { icon: Target, color: colors.secondary, text: `${fmt(left)} left · ${daysLeft} days to go` },
    warning: { icon: AlertTriangle, color: colors.warning, text: `${pct}% used. ${fmt(left)} left for ${daysLeft} days` },
    over: { icon: CircleAlert, color: colors.expense, text: `Over budget by ${fmt(-left)}` },
  }[tone];
  const StatusIcon = status.icon;

  return (
    <Card className="gap-4">
      <View className="flex-row items-start justify-between">
        <View className="gap-1">
          <Text variant="caption" tone="muted">
            Monthly budget
          </Text>
          <View className="flex-row items-baseline gap-1">
            <Money cents={expense} currency={currency} variant="moneyLg" hidden={hidden} />
            <Text variant="bodySm" tone="muted">
              / {fmt(budget.monthlyLimit)}
            </Text>
          </View>
        </View>
        <View className="rounded-full px-3 py-1" style={{ backgroundColor: withAlpha(status.color, 0.14) }}>
          <Text variant="caption" weight="bold" style={{ color: status.color, fontVariant: ['tabular-nums'] }}>
            {pct}% used
          </Text>
        </View>
      </View>
      <ProgressBar value={usedRatio} warnAt={budget.alertThreshold} height={10} accessibilityLabel={`Budget ${pct}% used`} />
      <View className="flex-row items-center gap-2">
        <StatusIcon size={16} color={status.color} strokeWidth={2} />
        <Text variant="bodySm" weight="semibold" className="flex-1" style={tone === 'normal' ? undefined : { color: status.color }}>
          {status.text}
        </Text>
      </View>
    </Card>
  );
}

function BudgetCardSkeleton() {
  return (
    <Card className="gap-4">
      <Skeleton height={12} width={100} />
      <Skeleton height={28} width="55%" />
      <Skeleton height={10} rounded="rounded-full" />
      <Skeleton height={12} width="65%" />
    </Card>
  );
}
