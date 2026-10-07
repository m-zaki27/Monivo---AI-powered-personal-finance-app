import { memo } from 'react';
import { View } from 'react-native';

import { CategoryBadge, Money, PressableScale, Skeleton, Text } from '@/components/ui';
import { formatShortDate, formatTime, isSameDay, toDate } from '@/lib/dates';
import type { Category, Transaction } from '@/schemas/models';

interface TransactionRowProps {
  transaction: Transaction;
  category?: Category;
  accountName?: string;
  currency: string;
  /** Show "Oct 6" instead of the time (when rows aren't grouped by day) */
  showDate?: boolean;
  onPress?: (t: Transaction) => void;
}

/**
 * One transaction: badge, merchant, "Category · Account", signed amount.
 * The parent resolves category/account names, so this row stays a pure
 * display component that's cheap to memo in long lists.
 */
export const TransactionRow = memo(function TransactionRow({
  transaction: t,
  category,
  accountName,
  currency,
  showDate,
  onPress,
}: TransactionRowProps) {
  const isIncome = t.type === 'income';
  const when = showDate && !isSameDay(toDate(t.date), new Date()) ? formatShortDate(t.date) : formatTime(t.date);
  const meta = [category?.name ?? 'Uncategorized', accountName].filter(Boolean).join(' · ');

  return (
    <PressableScale
      disabled={!onPress}
      onPress={() => onPress?.(t)}
      scaleTo={0.98}
      haptic={false}
      accessibilityLabel={`${t.merchant}, ${isIncome ? 'income' : 'expense'}, ${meta}, ${when}`}
      className="min-h-16 flex-row items-center gap-3 py-2"
    >
      <CategoryBadge icon={category?.icon ?? 'shapes'} color={category?.color ?? 'tan'} />
      <View className="flex-1 gap-0.5">
        <Text weight="semibold" numberOfLines={1}>
          {t.merchant}
        </Text>
        <Text variant="caption" tone="muted" numberOfLines={1}>
          {meta}
        </Text>
      </View>
      <View className="items-end gap-0.5">
        {/* Expenses get "−" in the normal text colour; only income is tinted, so a
            list of spending doesn't turn into a wall of red. */}
        <Money cents={isIncome ? t.amount : -t.amount} signed currency={currency} variant="moneySm" tone={isIncome ? 'income' : 'default'} />
        <Text variant="caption" tone="muted">
          {when}
        </Text>
      </View>
    </PressableScale>
  );
});

export function TransactionRowSkeleton() {
  return (
    <View className="min-h-16 flex-row items-center gap-3 py-2">
      <Skeleton width={44} height={44} rounded="rounded-full" />
      <View className="flex-1 gap-2">
        <Skeleton height={14} width="55%" />
        <Skeleton height={10} width="35%" />
      </View>
      <Skeleton height={14} width={64} />
    </View>
  );
}
