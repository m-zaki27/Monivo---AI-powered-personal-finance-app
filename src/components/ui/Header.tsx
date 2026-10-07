import { router } from 'expo-router';
import { ChevronLeft, X } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { View } from 'react-native';

import { IconButton } from './IconButton';
import { Text } from './Text';

interface HeaderProps {
  title?: string;
  subtitle?: string;
  /** 'back' = chevron, 'close' = X (for modals), false = none */
  leading?: 'back' | 'close' | false;
  onLeadingPress?: () => void;
  right?: ReactNode;
  /** Large left-aligned title (tab roots) vs. small centred (pushed screens) */
  large?: boolean;
}

export function Header({ title, subtitle, leading = 'back', onLeadingPress, right, large }: HeaderProps) {
  // Nothing to go back to (deep link, or history cleared by a route guard)?
  // "/" lets the guards pick the right home for the current session.
  const goBack = onLeadingPress ?? (() => (router.canGoBack() ? router.back() : router.replace('/')));

  if (large) {
    return (
      <View className="flex-row items-center justify-between pb-4 pt-2">
        <View className="flex-1 gap-1">
          <Text variant="h1">{title}</Text>
          {subtitle && <Text tone="muted">{subtitle}</Text>}
        </View>
        {right && <View className="flex-row gap-2">{right}</View>}
      </View>
    );
  }

  return (
    <View className="h-14 flex-row items-center justify-between">
      <View className="w-12">
        {leading && (
          <IconButton
            icon={leading === 'back' ? ChevronLeft : X}
            accessibilityLabel={leading === 'back' ? 'Go back' : 'Close'}
            onPress={goBack}
          />
        )}
      </View>
      <View className="flex-1 items-center">
        {title && (
          <Text variant="title" numberOfLines={1}>
            {title}
          </Text>
        )}
        {subtitle && (
          <Text variant="caption" tone="muted">
            {subtitle}
          </Text>
        )}
      </View>
      <View className="min-w-12 flex-row justify-end gap-2">{right}</View>
    </View>
  );
}
