import { useEffect, useState, type ReactNode } from 'react';
import { Dimensions, Modal, Pressable, View } from 'react-native';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import { useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { scheduleOnRN } from 'react-native-worklets';

import { AnimatedView } from '@/lib/animated';
import { ThemeScope } from '@/theme/ThemeProvider';
import { useTheme } from '@/theme/useTheme';
import { motion } from '@/theme/tokens';

import { Text } from './Text';

interface BottomSheetProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  children: ReactNode;
}

const SCREEN_H = Dimensions.get('window').height;
const DISMISS_DISTANCE = 120;
const DISMISS_VELOCITY = 900;

/** Modal-based sheet; stays mounted until the exit animation finishes so it slides away. */
export function BottomSheet({ visible, onClose, title, subtitle, children }: BottomSheetProps) {
  const insets = useSafeAreaInsets();
  const { colors, shadow, scheme } = useTheme();
  const [mounted, setMounted] = useState(visible);
  const translateY = useSharedValue(SCREEN_H);
  const backdrop = useSharedValue(0);

  // Mount during render so the first frame already has the Modal.
  if (visible && !mounted) setMounted(true);

  useEffect(() => {
    if (visible) {
      translateY.set(withSpring(0, motion.spring));
      backdrop.set(withTiming(1, { duration: motion.base }));
    } else if (mounted) {
      backdrop.set(withTiming(0, { duration: motion.base }));
      translateY.set(
        withTiming(SCREEN_H, { duration: motion.base }, (done) => {
          if (done) scheduleOnRN(setMounted, false);
        }),
      );
    }
  }, [visible, mounted, translateY, backdrop]);

  const pan = Gesture.Pan()
    .onUpdate((e) => {
      translateY.set(Math.max(0, e.translationY));
    })
    .onEnd((e) => {
      if (e.translationY > DISMISS_DISTANCE || e.velocityY > DISMISS_VELOCITY) {
        scheduleOnRN(onClose);
      } else {
        translateY.set(withSpring(0, motion.spring));
      }
    });

  const sheetStyle = useAnimatedStyle(() => ({ transform: [{ translateY: translateY.get() }] }));
  const backdropStyle = useAnimatedStyle(() => ({ opacity: backdrop.get() }));

  if (!mounted) return null;

  return (
    <Modal transparent visible statusBarTranslucent navigationBarTranslucent animationType="none" onRequestClose={onClose}>
      {/* Gestures inside a Modal need their own root on Android. */}
      <GestureHandlerRootView style={{ flex: 1 }}>
        {/* On web the Modal is portalled outside the themed DOM tree, so re-apply the theme. */}
        <ThemeScope scheme={scheme} style={{ flex: 1 }}>
          <AnimatedView className="absolute inset-0 bg-scrim" style={backdropStyle}>
            <Pressable className="flex-1" onPress={onClose} accessibilityLabel="Close sheet" />
          </AnimatedView>
          <View className="flex-1 justify-end" pointerEvents="box-none">
            <GestureDetector gesture={pan}>
              <AnimatedView
                accessibilityViewIsModal
                className="rounded-t-sheet border border-line bg-surface px-6 pt-3"
                style={[{ paddingBottom: insets.bottom + 24, boxShadow: shadow.raised }, sheetStyle]}
              >
                <View className="mb-4 items-center">
                  <View className="h-1.5 w-10 rounded-full" style={{ backgroundColor: colors.border }} />
                </View>
                {title && (
                  <View className="mb-4 gap-1">
                    <Text variant="h2">{title}</Text>
                    {subtitle && (
                      <Text variant="bodySm" tone="muted">
                        {subtitle}
                      </Text>
                    )}
                  </View>
                )}
                {children}
              </AnimatedView>
            </GestureDetector>
          </View>
        </ThemeScope>
      </GestureHandlerRootView>
    </Modal>
  );
}
