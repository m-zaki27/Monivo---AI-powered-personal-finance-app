import { router, type Href } from 'expo-router';
import { ChevronRight, Coins, Settings, Target, UserRound, WalletCards, type LucideIcon } from 'lucide-react-native';
import { View } from 'react-native';

import { BottomSheet, PressableScale, Text } from '@/components/ui';
import { withAlpha } from '@/lib/color';
import { useTheme } from '@/theme';

interface HomeMenuSheetProps {
  visible: boolean;
  onClose: () => void;
}

/** Shortcuts behind the menu button on Home. */
export function HomeMenuSheet({ visible, onClose }: HomeMenuSheetProps) {
  const { colors } = useTheme();
  const items: { icon: LucideIcon; color: string; label: string; href: Href }[] = [
    { icon: UserRound, color: colors.secondary, label: 'Profile', href: '/profile' },
    { icon: WalletCards, color: colors.income, label: 'Accounts', href: '/accounts' },
    { icon: Target, color: colors.warning, label: 'Monthly budget', href: '/budget' },
    { icon: Coins, color: colors.primary, label: 'Currency', href: '/settings-currency' },
    { icon: Settings, color: colors.muted, label: 'Settings', href: '/settings' },
  ];

  return (
    <BottomSheet visible={visible} onClose={onClose} title="Menu">
      <View className="gap-1">
        {items.map(({ icon: Icon, color, label, href }) => (
          <PressableScale
            key={label}
            onPress={() => {
              onClose();
              router.push(href);
            }}
            scaleTo={0.98}
            accessibilityLabel={label}
            className="min-h-14 flex-row items-center gap-4 rounded-input px-2 py-1.5"
          >
            <View className="h-10 w-10 items-center justify-center rounded-full" style={{ backgroundColor: withAlpha(color, 0.14) }}>
              <Icon size={19} color={color} strokeWidth={2} />
            </View>
            <Text weight="semibold" className="flex-1">
              {label}
            </Text>
            <ChevronRight size={18} color={colors.muted} />
          </PressableScale>
        ))}
      </View>
    </BottomSheet>
  );
}
