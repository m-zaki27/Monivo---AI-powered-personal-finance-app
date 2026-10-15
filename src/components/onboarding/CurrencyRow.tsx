import { Check } from 'lucide-react-native';
import { memo } from 'react';
import { View } from 'react-native';

import { PressableScale, Text } from '@/components/ui';
import { cn } from '@/lib/cn';
import type { Currency } from '@/lib/currencies';
import { useTheme } from '@/theme';

interface CurrencyRowProps {
  currency: Currency;
  selected: boolean;
  onSelect: (code: string) => void;
}

/** Memoized; onSelect takes the code so one stable callback serves every row. */
export const CurrencyRow = memo(function CurrencyRow({ currency, selected, onSelect }: CurrencyRowProps) {
  const { colors } = useTheme();
  return (
    <PressableScale
      haptic="select"
      scaleTo={0.98}
      onPress={() => onSelect(currency.code)}
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      accessibilityLabel={`${currency.name}, ${currency.code}`}
      className={cn(
        'min-h-16 flex-row items-center gap-4 rounded-input border px-4 py-3',
        selected ? 'border-cobalt bg-raised' : 'border-transparent',
      )}
    >
      <View className="h-11 w-11 items-center justify-center rounded-full border border-line bg-surface">
        <Text style={{ fontSize: 22, lineHeight: 28 }}>{currency.flag}</Text>
      </View>
      <View className="flex-1">
        <Text weight="bold">{currency.code}</Text>
        <Text variant="bodySm" tone="muted" numberOfLines={1}>
          {currency.name}
        </Text>
      </View>
      <Text variant="moneySm" tone="muted">
        {currency.symbol}
      </Text>
      <View className="w-6 items-end">{selected && <Check size={20} color={colors.secondary} strokeWidth={2.5} />}</View>
    </PressableScale>
  );
});
