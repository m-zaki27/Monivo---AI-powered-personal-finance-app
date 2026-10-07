import { router } from 'expo-router';
import { ChevronRight } from 'lucide-react-native';
import { View } from 'react-native';

import { BottomSheet, PressableScale, Text } from '@/components/ui';
import { withAlpha } from '@/lib/color';
import { useTheme } from '@/theme/useTheme';

import { addActions } from './addActions';

interface AddActionSheetProps {
  visible: boolean;
  onClose: () => void;
}

export function AddActionSheet({ visible, onClose }: AddActionSheetProps) {
  const { colors, palette } = useTheme();
  const tint = [colors.secondary, colors.income, palette.gold];

  return (
    <BottomSheet visible={visible} onClose={onClose} title="Add a transaction" subtitle="Pick the fastest way for you.">
      <View className="gap-3">
        {addActions.map((a, i) => {
          const Icon = a.icon;
          const color = tint[i] ?? colors.secondary;
          return (
            <PressableScale
              key={a.key}
              scaleTo={0.98}
              accessibilityLabel={a.label}
              onPress={() => {
                onClose();
                router.push(a.href);
              }}
              className="min-h-[72px] flex-row items-center gap-4 rounded-card border border-line bg-raised px-4 py-3"
            >
              <View className="h-12 w-12 items-center justify-center rounded-full" style={{ backgroundColor: withAlpha(color, 0.16) }}>
                <Icon size={22} color={color} strokeWidth={2} />
              </View>
              <View className="flex-1 gap-0.5">
                <Text variant="body" weight="bold">
                  {a.label}
                </Text>
                <Text variant="bodySm" tone="muted">
                  {a.description}
                </Text>
              </View>
              <ChevronRight size={20} color={colors.muted} />
            </PressableScale>
          );
        })}
      </View>
    </BottomSheet>
  );
}
