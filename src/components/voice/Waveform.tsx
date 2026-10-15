import { useEffect } from 'react';
import { View } from 'react-native';
import { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { AnimatedView } from '@/lib/animated';
import { useTheme } from '@/theme';

const BARS = 29;
const MIN = 6;
const MAX = 72;

const envelope = (i: number) => 0.35 + 0.65 * Math.sin((Math.PI * (i + 0.5)) / BARS);

/** `level` is 0–1. */
export function Waveform({ level }: { level: number }) {
  return (
    <View className="h-20 flex-row items-center justify-center gap-1" accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      {Array.from({ length: BARS }, (_, i) => (
        <Bar key={i} index={i} level={level} />
      ))}
    </View>
  );
}

function Bar({ index, level }: { index: number; level: number }) {
  const { colors } = useTheme();
  const h = useSharedValue(MIN);

  useEffect(() => {
    const jitter = 0.55 + Math.random() * 0.45;
    h.value = withTiming(MIN + (MAX - MIN) * level * envelope(index) * jitter, { duration: 120 });
  }, [level, index, h]);

  const style = useAnimatedStyle(() => ({ height: h.value }));
  const color = Math.abs(index - BARS / 2) < BARS / 5 ? colors.income : colors.secondary;
  return <AnimatedView className="w-1.5 rounded-full" style={[{ backgroundColor: color }, style]} />;
}
