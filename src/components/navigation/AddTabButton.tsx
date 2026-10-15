import { LinearGradient } from 'expo-linear-gradient';
import { Plus } from 'lucide-react-native';
import { View } from 'react-native';

import { PressableScale } from '@/components/ui';
import { useTheme } from '@/theme/useTheme';

export function AddTabButton({ onPress }: { onPress: () => void }) {
  const { gradients, colors } = useTheme();
  return (
    <View className="flex-1 items-center">
      <PressableScale
        onPress={onPress}
        haptic="press"
        scaleTo={0.9}
        accessibilityLabel="Add transaction"
        className="-mt-8 h-16 w-16 rounded-full"
        style={{ boxShadow: `0px 8px 24px ${gradients.goldGlow}` }}
      >
        <LinearGradient
          colors={gradients.gold}
          start={{ x: 0.2, y: 0 }}
          end={{ x: 0.8, y: 1 }}
          style={{ flex: 1, borderRadius: 999, alignItems: 'center', justifyContent: 'center' }}
        >
          <Plus size={30} color={colors.onPrimary} strokeWidth={2.5} />
        </LinearGradient>
      </PressableScale>
    </View>
  );
}
