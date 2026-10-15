import type { ReactNode } from 'react';
import type { GestureResponderEvent, PressableProps, StyleProp, ViewStyle } from 'react-native';
import { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

import { AnimatedPressable } from '@/lib/animated';
import { haptics } from '@/lib/haptics';
import { motion } from '@/theme/tokens';

export interface PressableScaleProps extends Omit<PressableProps, 'style' | 'children'> {
  children?: ReactNode;
  className?: string;
  style?: StyleProp<ViewStyle>;
  /** How far to shrink while pressed (1 = none) */
  scaleTo?: number;
  /** Haptic on press; false to disable */
  haptic?: keyof typeof haptics | false;
}

/** Shared press feel: spring scale-down on the UI thread plus a light haptic. */
export function PressableScale({
  children,
  className,
  style,
  scaleTo = motion.pressScale,
  haptic = 'tap',
  onPressIn,
  onPressOut,
  onPress,
  disabled,
  ...rest
}: PressableScaleProps) {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <AnimatedPressable
      accessibilityRole="button"
      disabled={disabled}
      className={className}
      style={[animatedStyle, style]}
      onPressIn={(e: GestureResponderEvent) => {
        scale.set(withSpring(scaleTo, motion.spring));
        onPressIn?.(e);
      }}
      onPressOut={(e: GestureResponderEvent) => {
        scale.set(withSpring(1, motion.spring));
        onPressOut?.(e);
      }}
      onPress={(e: GestureResponderEvent) => {
        if (haptic) haptics[haptic]();
        onPress?.(e);
      }}
      {...rest}
    >
      {children}
    </AnimatedPressable>
  );
}
