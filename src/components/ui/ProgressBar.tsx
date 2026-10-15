import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { AnimatedView } from '@/lib/animated';
import { useTheme } from '@/theme/useTheme';
import { motion } from '@/theme/tokens';

interface ProgressBarProps {
  /** 0–1 (values above 1 render full, in rose) */
  value: number;
  /** Where the bar turns amber. Default 0.8 */
  warnAt?: number;
  /** Force a colour instead of the automatic budget logic */
  color?: string;
  height?: number;
  accessibilityLabel?: string;
}

export function progressTone(value: number, warnAt = 0.8): 'normal' | 'warning' | 'over' {
  if (value >= 1) return 'over';
  if (value >= warnAt) return 'warning';
  return 'normal';
}

export function ProgressBar({ value, warnAt = 0.8, color, height = 8, accessibilityLabel }: ProgressBarProps) {
  const { colors } = useTheme();
  const [trackWidth, setTrackWidth] = useState(0);
  const width = useSharedValue(0);

  const tone = progressTone(value, warnAt);
  const fill = color ?? { normal: colors.secondary, warning: colors.warning, over: colors.expense }[tone];

  // Animates in pixels, using the track width measured via onLayout.
  useEffect(() => {
    width.value = withTiming(trackWidth * Math.min(Math.max(value, 0), 1), { duration: motion.slow });
  }, [value, trackWidth, width]);

  const fillStyle = useAnimatedStyle(() => ({ width: width.value }));

  return (
    <View
      accessibilityRole="progressbar"
      accessibilityLabel={accessibilityLabel}
      accessibilityValue={{ min: 0, max: 100, now: Math.round(value * 100) }}
      onLayout={(e) => setTrackWidth(e.nativeEvent.layout.width)}
      className="w-full overflow-hidden rounded-full bg-raised"
      style={{ height }}
    >
      <AnimatedView className="h-full rounded-full" style={[{ backgroundColor: fill }, fillStyle]} />
    </View>
  );
}
