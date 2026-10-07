import { useEffect } from 'react';
import { View, type DimensionValue } from 'react-native';
import { Easing, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';

import { AnimatedView } from '@/lib/animated';
import { cn } from '@/lib/cn';

interface SkeletonProps {
  width?: DimensionValue;
  height?: DimensionValue;
  /** Full class override for the radius, e.g. "rounded-full" */
  rounded?: string;
  className?: string;
  /** Fill override, e.g. a translucent white on the dark hero card */
  color?: string;
}

/** Placeholder block with a slow pulse. Shapes should mirror the real content. */
export function Skeleton({ width = '100%', height = 16, rounded = 'rounded-sm', className, color }: SkeletonProps) {
  const opacity = useSharedValue(0.5);

  useEffect(() => {
    opacity.value = withRepeat(withTiming(1, { duration: 800, easing: Easing.inOut(Easing.quad) }), -1, true);
  }, [opacity]);

  const style = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <AnimatedView
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      className={cn('bg-raised', rounded, className)}
      style={[{ width, height }, color ? { backgroundColor: color } : null, style]}
    />
  );
}

/** A few lines of text-shaped skeletons. */
export function SkeletonText({ lines = 2, className }: { lines?: number; className?: string }) {
  return (
    <View className={cn('gap-2', className)}>
      {Array.from({ length: lines }, (_, i) => (
        <Skeleton key={i} height={12} width={i === lines - 1 ? '60%' : '100%'} />
      ))}
    </View>
  );
}
