import { router } from 'expo-router';
import { View } from 'react-native';

import { addActions } from '@/components/navigation/addActions';
import { PressableScale, Text } from '@/components/ui';
import { withAlpha } from '@/lib/color';
import { useTheme } from '@/theme';

/** Same actions and routes as the tab bar's Add sheet. */
export function QuickActions() {
  const { colors, palette } = useTheme();
  const tint = [colors.secondary, colors.income, palette.gold];

  return (
    <View className="flex-row justify-around">
      {addActions.map((a, i) => {
        const Icon = a.icon;
        const color = tint[i] ?? colors.secondary;
        return (
          <PressableScale
            key={a.key}
            onPress={() => router.push(a.href)}
            accessibilityLabel={a.shortLabel}
            accessibilityHint={a.description}
            className="w-24 items-center gap-2"
          >
            <View
              className="h-16 w-16 items-center justify-center rounded-full border"
              style={{ backgroundColor: withAlpha(color, 0.16), borderColor: withAlpha(color, 0.3) }}
            >
              <Icon size={24} color={color} strokeWidth={2} />
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
