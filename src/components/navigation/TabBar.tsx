import { BlurView } from 'expo-blur';
import { Tabs } from 'expo-router';
import { ArrowLeftRight, House, Sparkles, Wallet, type LucideIcon } from 'lucide-react-native';
import { useState, type ComponentProps } from 'react';
import { Platform, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PressableScale } from '@/components/ui';
import { useKeyboardVisible } from '@/hooks/useKeyboardVisible';
import { withAlpha } from '@/lib/color';
import { useTheme } from '@/theme/useTheme';

import { AddActionSheet } from './AddActionSheet';
import { AddTabButton } from './AddTabButton';

/** Props derived from <Tabs>: Expo Router forbids @react-navigation/* imports. */
type TabBarProps = Parameters<NonNullable<ComponentProps<typeof Tabs>['tabBar']>>[0];

const tabMeta: Record<string, { label: string; icon: LucideIcon }> = {
  index: { label: 'Home', icon: House },
  transactions: { label: 'Transactions', icon: ArrowLeftRight },
  accounts: { label: 'Accounts', icon: Wallet },
  assistant: { label: 'Assistant', icon: Sparkles },
};

export function TabBar({ state, navigation }: TabBarProps) {
  const insets = useSafeAreaInsets();
  const { colors, isDark, shadow } = useTheme();
  const [sheetOpen, setSheetOpen] = useState(false);
  const keyboardUp = useKeyboardVisible();

  // Otherwise the floating bar rides up on the keyboard on Android.
  if (keyboardUp) return null;

  return (
    <>
      <View
        className="absolute left-4 right-4 h-[72px] flex-row items-center px-2"
        style={{ bottom: Math.max(insets.bottom, 12) + 4 }}
      >
        {/* Separate overflow-hidden layer so the raised Add button isn't clipped. */}
        <View
          className="absolute inset-0 overflow-hidden rounded-full border border-line"
          style={{ boxShadow: shadow.raised }}
        >
          {Platform.OS === 'ios' ? (
            <BlurView intensity={60} tint={isDark ? 'dark' : 'light'} style={{ flex: 1, backgroundColor: colors.tabBar }} />
          ) : (
            // Android blur needs a BlurTargetView; a near-opaque fill is cheaper.
            <View className="flex-1 bg-surface" style={{ opacity: 0.97 }} />
          )}
        </View>

        {state.routes.map((route, index) => {
          if (route.name === 'add') {
            return <AddTabButton key={route.key} onPress={() => setSheetOpen(true)} />;
          }
          const meta = tabMeta[route.name];
          if (!meta) return null;
          const focused = state.index === index;
          const Icon = meta.icon;

          const onPress = () => {
            const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
            if (!focused && !event.defaultPrevented) navigation.navigate(route.name);
          };

          return (
            <PressableScale
              key={route.key}
              onPress={onPress}
              haptic="select"
              accessibilityRole="tab"
              accessibilityState={{ selected: focused }}
              accessibilityLabel={meta.label}
              className="h-14 flex-1 items-center justify-center"
            >
              {/* Icon-only (labels don't fit); screen readers use accessibilityLabel. */}
              <View
                className="h-10 w-14 items-center justify-center rounded-full"
                style={{ backgroundColor: focused ? withAlpha(colors.secondary, isDark ? 0.22 : 0.12) : 'transparent' }}
              >
                <Icon size={24} color={focused ? colors.secondary : colors.muted} strokeWidth={2} />
              </View>
            </PressableScale>
          );
        })}
      </View>
      <AddActionSheet visible={sheetOpen} onClose={() => setSheetOpen(false)} />
    </>
  );
}
