import type { LucideIcon } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { Modal, Pressable, View } from 'react-native';
import { FadeIn, ZoomIn } from 'react-native-reanimated';

import { AnimatedView } from '@/lib/animated';
import { withAlpha } from '@/lib/color';
import { ThemeScope } from '@/theme/ThemeProvider';
import { useTheme } from '@/theme/useTheme';

import { Button } from './Button';
import { Text } from './Text';

interface DialogProps {
  visible: boolean;
  title: string;
  message?: string;
  icon?: LucideIcon;
  /** 'danger' = rose icon + rose confirm button */
  tone?: 'default' | 'danger';
  /** Extra content between the message and the buttons (e.g. a warning box) */
  children?: ReactNode;
  confirmLabel: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
}

/**
 * Centred confirm dialog for decisions (delete, discard). Tapping the scrim
 * cancels; the destructive button is never the default-looking gold one.
 */
export function Dialog({
  visible,
  title,
  message,
  icon: Icon,
  tone = 'default',
  children,
  confirmLabel,
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
  loading,
}: DialogProps) {
  const { colors, shadow, scheme } = useTheme();
  const accent = tone === 'danger' ? colors.expense : colors.secondary;

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onCancel} statusBarTranslucent>
      {/* Re-apply the theme: on web the Modal renders outside the themed DOM tree. */}
      <ThemeScope scheme={scheme} style={{ flex: 1 }}>
        <AnimatedView entering={FadeIn.duration(150)} className="flex-1 items-center justify-center px-6" style={{ backgroundColor: colors.scrim }}>
          <Pressable className="absolute inset-0" onPress={onCancel} accessibilityLabel="Dismiss" />
          <AnimatedView
            entering={ZoomIn.springify().damping(20)}
            accessibilityViewIsModal
            className="w-full max-w-[380px] gap-4 rounded-card border border-line bg-surface p-6"
            style={{ boxShadow: shadow.raised }}
          >
            {Icon && (
              <View className="h-12 w-12 items-center justify-center rounded-full" style={{ backgroundColor: withAlpha(accent, 0.14) }}>
                <Icon size={24} color={accent} strokeWidth={2} />
              </View>
            )}
            <View className="gap-2">
              <Text variant="title" accessibilityRole="header">
                {title}
              </Text>
              {message && <Text tone="muted">{message}</Text>}
            </View>
            {children}
            <View className="mt-2 gap-3">
              <Button title={confirmLabel} variant={tone === 'danger' ? 'danger' : 'primary'} loading={loading} onPress={onConfirm} fullWidth />
              <Button title={cancelLabel} variant="secondary" onPress={onCancel} disabled={loading} fullWidth />
            </View>
          </AnimatedView>
        </AnimatedView>
      </ThemeScope>
    </Modal>
  );
}
