import { ChevronRight } from 'lucide-react-native';
import { View } from 'react-native';

import { Card, Skeleton, Text } from '@/components/ui';
import { withAlpha } from '@/lib/color';
import type { User } from '@/schemas/models';
import { useTheme } from '@/theme';

export function ProfileCard({ user, onPress }: { user?: User; onPress: () => void }) {
  const { colors } = useTheme();
  const initials = user ? `${user.firstName[0] ?? ''}${user.lastName[0] ?? ''}`.toUpperCase() : '';
  return (
    <Card onPress={onPress} accessibilityLabel="Edit profile" className="flex-row items-center gap-4">
      <View
        className="h-16 w-16 items-center justify-center rounded-full border"
        style={{ backgroundColor: withAlpha(colors.secondary, 0.16), borderColor: withAlpha(colors.secondary, 0.35) }}
      >
        <Text variant="title" tone="cobalt">
          {initials}
        </Text>
      </View>
      <View className="flex-1 gap-1">
        {user ? (
          <>
            <Text variant="title" numberOfLines={1}>
              {user.firstName} {user.lastName}
            </Text>
            <Text variant="bodySm" tone="muted" numberOfLines={1}>
              {user.email}
            </Text>
          </>
        ) : (
          <>
            <Skeleton height={18} width="60%" />
            <Skeleton height={12} width="80%" />
          </>
        )}
      </View>
      <ChevronRight size={20} color={colors.muted} />
    </Card>
  );
}
