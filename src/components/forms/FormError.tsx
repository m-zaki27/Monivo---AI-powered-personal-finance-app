import { AlertCircle } from 'lucide-react-native';
import { View } from 'react-native';
import { FadeIn } from 'react-native-reanimated';

import { Text } from '@/components/ui';
import { AnimatedView } from '@/lib/animated';
import { withAlpha } from '@/lib/color';
import { useTheme } from '@/theme';

/** Banner for errors that don't belong to one field ("Wrong password", "No connection"). */
export function FormError({ message }: { message?: string }) {
  const { colors } = useTheme();
  if (!message) return null;
  return (
    <AnimatedView
      entering={FadeIn.duration(200)}
      accessibilityRole="alert"
      className="flex-row items-start gap-3 rounded-input border px-4 py-3"
      style={{ backgroundColor: withAlpha(colors.expense, 0.1), borderColor: withAlpha(colors.expense, 0.3) }}
    >
      <View className="pt-0.5">
        <AlertCircle size={18} color={colors.expense} strokeWidth={2} />
      </View>
      <Text variant="bodySm" weight="semibold" className="flex-1">
        {message}
      </Text>
    </AnimatedView>
  );
}
