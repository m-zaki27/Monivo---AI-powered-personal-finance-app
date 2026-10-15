import { useState } from 'react';
import { Image, View } from 'react-native';

import { withAlpha } from '@/lib/color';
import type { User } from '@/schemas/models';
import { useTheme } from '@/theme/useTheme';

import { Skeleton } from './Skeleton';
import { Text } from './Text';

interface AvatarProps {
  user?: Pick<User, 'firstName' | 'lastName' | 'avatarUrl'>;
  size?: number;
  /** On a coloured card (e.g. the cobalt Home card): white initials on a white tint */
  onColor?: boolean;
}

/** Profile photo, falling back to initials when missing or it fails to load. */
export function Avatar({ user, size = 48, onColor }: AvatarProps) {
  const { colors } = useTheme();
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  if (!user) return <Skeleton width={size} height={size} rounded="rounded-full" color={onColor ? 'rgba(255,255,255,0.18)' : undefined} />;

  const initials = `${user.firstName[0] ?? ''}${user.lastName[0] ?? ''}`.toUpperCase();
  const showPhoto = !!user.avatarUrl && user.avatarUrl !== failedUrl;

  return (
    <View
      className="items-center justify-center overflow-hidden rounded-full border"
      style={{
        width: size,
        height: size,
        backgroundColor: onColor ? 'rgba(255,255,255,0.18)' : withAlpha(colors.secondary, 0.16),
        borderColor: onColor ? 'rgba(255,255,255,0.35)' : withAlpha(colors.secondary, 0.35),
      }}
    >
      {showPhoto ? (
        <Image
          source={{ uri: user.avatarUrl! }}
          style={{ width: size, height: size }}
          onError={() => setFailedUrl(user.avatarUrl)}
          accessibilityIgnoresInvertColors
        />
      ) : (
        <Text weight="bold" tone={onColor ? 'white' : 'cobalt'} style={{ fontSize: size * 0.34, lineHeight: size * 0.42 }}>
          {initials}
        </Text>
      )}
    </View>
  );
}
