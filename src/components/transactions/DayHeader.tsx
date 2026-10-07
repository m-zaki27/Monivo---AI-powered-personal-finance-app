import { View } from 'react-native';

import { Money, Text } from '@/components/ui';

/** Sticky day title with that day's net total. */
export function DayHeader({ title, net, currency }: { title: string; net: number; currency: string }) {
  return (
    <View className="flex-row items-center justify-between bg-bg px-6 pb-1 pt-4" accessibilityRole="header">
      <Text variant="overline" tone="muted">
        {title}
      </Text>
      <Money cents={net} signed currency={currency} variant="caption" tone="muted" />
    </View>
  );
}
