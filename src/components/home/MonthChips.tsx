import { ArrowDownLeft, ArrowUpRight, type LucideIcon } from 'lucide-react-native';
import { View } from 'react-native';

import { Money, Skeleton, Text } from '@/components/ui';
import { withAlpha } from '@/lib/color';
import { useTheme } from '@/theme';

interface MonthChipsProps {
  income?: number;
  expense?: number;
  currency: string;
  hidden: boolean;
}

/** This month's money in (sky) and out (rose). */
export function MonthChips({ income, expense, currency, hidden }: MonthChipsProps) {
  const { colors } = useTheme();
  return (
    <View className="flex-row gap-3">
      <Chip label="Income" icon={ArrowDownLeft} color={colors.income} tone="income" cents={income} currency={currency} hidden={hidden} />
      <Chip label="Spent" icon={ArrowUpRight} color={colors.expense} tone="expense" cents={expense} currency={currency} hidden={hidden} />
    </View>
  );
}

interface ChipProps {
  label: string;
  icon: LucideIcon;
  color: string;
  tone: 'income' | 'expense';
  cents?: number;
  currency: string;
  hidden: boolean;
}

function Chip({ label, icon: Icon, color, tone, cents, currency, hidden }: ChipProps) {
  return (
    <View
      className="flex-1 flex-row items-center gap-3 rounded-chip border px-4 py-3"
      style={{ backgroundColor: withAlpha(color, 0.1), borderColor: withAlpha(color, 0.25) }}
    >
      <View className="h-9 w-9 items-center justify-center rounded-full" style={{ backgroundColor: withAlpha(color, 0.18) }}>
        <Icon size={18} color={color} strokeWidth={2.5} />
      </View>
      <View className="flex-1">
        <Text variant="caption" tone="muted">
          {label}
        </Text>
        {cents == null ? (
          <Skeleton height={18} width="80%" className="mt-1" />
        ) : (
          <Money cents={cents} currency={currency} variant="moneySm" tone={tone} hidden={hidden} numberOfLines={1} hideZeroCents />
        )}
      </View>
    </View>
  );
}
