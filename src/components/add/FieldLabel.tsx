import { AlertCircle } from 'lucide-react-native';
import { View } from 'react-native';

import { Text } from '@/components/ui';
import { useTheme } from '@/theme';

/** Label for non-text fields (pickers), with the error shown inline next to it. */
export function FieldLabel({ label, error }: { label: string; error?: string }) {
  const { colors } = useTheme();
  return (
    <View className="flex-row items-center justify-between gap-2">
      <Text variant="bodySm" weight="semibold" tone="muted">
        {label}
      </Text>
      {error && (
        <View className="flex-row items-center gap-1.5" accessibilityRole="alert">
          <AlertCircle size={14} color={colors.expense} />
          <Text variant="caption" tone="expense">
            {error}
          </Text>
        </View>
      )}
    </View>
  );
}
