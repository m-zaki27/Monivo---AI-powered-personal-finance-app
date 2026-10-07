import { router } from 'expo-router';
import { Pressable, View } from 'react-native';

import { LogoMark, Skeleton, Text } from '@/components/ui';
import { withAlpha } from '@/lib/color';
import { greetingFor } from '@/lib/dates';
import type { User } from '@/schemas/models';
import { useTheme } from '@/theme';

export function HomeHeader({ user }: { user?: User }) {
  const { colors } = useTheme();
  const initials = user ? `${user.firstName[0] ?? ''}${user.lastName[0] ?? ''}`.toUpperCase() : '';

  return (
    <View className="flex-row items-center gap-3 pb-6 pt-2">
      <View
        className="h-12 w-12 items-center justify-center rounded-full border"
        style={{ backgroundColor: withAlpha(colors.secondary, 0.16), borderColor: withAlpha(colors.secondary, 0.35) }}
        accessibilityElementsHidden
      >
        {user ? (
          <Text weight="bold" tone="cobalt">
            {initials}
          </Text>
        ) : (
          <Skeleton width={48} height={48} rounded="rounded-full" />
        )}
      </View>
      <View className="flex-1">
        <Text variant="bodySm" tone="muted">
          {greetingFor()},
        </Text>
        {user ? (
          <Text variant="h2" numberOfLines={1}>
            {user.firstName}
          </Text>
        ) : (
          <Skeleton height={24} width={120} className="mt-1" />
        )}
      </View>
      {/* Long-press the mark to open the hidden component gallery. */}
      <Pressable onLongPress={() => router.push('/dev')} accessibilityLabel="Monivo" hitSlop={8} className="h-11 w-11 items-center justify-center">
        <LogoMark size={32} />
      </Pressable>
    </View>
  );
}
