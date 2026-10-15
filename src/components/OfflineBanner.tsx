import { onlineManager } from '@tanstack/react-query';
import { WifiOff } from 'lucide-react-native';
import { useSyncExternalStore } from 'react';
import { View } from 'react-native';
import { FadeInUp, FadeOutUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Text } from '@/components/ui';
import { AnimatedView } from '@/lib/animated';
import { useTheme } from '@/theme';

/** Online state comes from TanStack Query, fed by expo-network in queryClient.ts. */
function useIsOnline() {
  return useSyncExternalStore(
    (onChange) => onlineManager.subscribe(onChange),
    () => onlineManager.isOnline(),
  );
}

/** Offline pill; pointerEvents none so it never blocks taps underneath. */
export function OfflineBanner() {
  const online = useIsOnline();
  const insets = useSafeAreaInsets();
  const { colors, shadow } = useTheme();
  if (online) return null;

  return (
    <AnimatedView
      entering={FadeInUp}
      exiting={FadeOutUp}
      pointerEvents="none"
      accessibilityLiveRegion="polite"
      accessibilityRole="alert"
      className="absolute left-0 right-0 items-center"
      style={{ top: insets.top + 8 }}
    >
      <View className="flex-row items-center gap-2 rounded-full border border-line bg-raised px-4 py-2" style={{ boxShadow: shadow.raised }}>
        <WifiOff size={16} color={colors.muted} />
        <Text variant="bodySm" weight="semibold">
          You're offline · showing saved data
        </Text>
      </View>
    </AnimatedView>
  );
}
