import { router } from 'expo-router';
import { View } from 'react-native';

import { addActions } from '@/components/navigation/addActions';
import { PressableScale, Text } from '@/components/ui';
import { withAlpha } from '@/lib/color';
import { useTheme } from '@/theme';

/** Three equal tiles; same list (and routes) as the tab bar's Add sheet. */
export function QuickActions() {
  const { colors, palette, shadow } = useTheme();
  const tint = [colors.secondary, colors.income, palette.gold];

  return (
    <View className="flex-row gap-3">
      {addActions.map((a, i) => {
        const Icon = a.icon;
        const color = tint[i] ?? colors.secondary;
        return (
          <PressableScale
            key={a.key}
            onPress={() => router.push(a.href)}
            accessibilityLabel={a.shortLabel}
            accessibilityHint={a.description}
            className="flex-1 items-center gap-2 rounded-card border border-line bg-surface px-2 py-4"
            style={{ boxShadow: shadow.card }}
          >
            <View className="h-12 w-12 items-center justify-center rounded-full" style={{ backgroundColor: withAlpha(color, 0.16) }}>
              <Icon size={22} color={color} strokeWidth={2} />
            </View>
            <Text variant="caption" weight="bold" center numberOfLines={1}>
              {a.shortLabel}
            </Text>
          </PressableScale>
        );
      })}
    </View>
  );
}
