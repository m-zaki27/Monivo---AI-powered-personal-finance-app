import { useEffect } from 'react';
import { View } from 'react-native';
import { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

import { AnimatedView } from '@/lib/animated';
import { useTheme } from '@/theme';
import { motion } from '@/theme/tokens';

/** `step` is 1-based. */
export function ProgressDots({ step, total = 3 }: { step: number; total?: number }) {
  return (
    <View
      className="flex-row items-center gap-2"
      accessibilityRole="progressbar"
      accessibilityLabel={`Step ${Math.min(step, total)} of ${total}`}
      accessibilityValue={{ min: 1, max: total, now: Math.min(step, total) }}
    >
      {Array.from({ length: total }, (_, i) => (
        <Dot key={i} state={i + 1 < step ? 'done' : i + 1 === step ? 'active' : 'todo'} />
      ))}
    </View>
  );
}

function Dot({ state }: { state: 'done' | 'active' | 'todo' }) {
  const { colors } = useTheme();
  const width = useSharedValue(state === 'active' ? 28 : 8);

  useEffect(() => {
    width.value = withSpring(state === 'active' ? 28 : 8, motion.spring);
  }, [state, width]);

  const style = useAnimatedStyle(() => ({ width: width.value }));
  return (
    <AnimatedView
      className="h-2 rounded-full"
      style={[{ backgroundColor: state === 'todo' ? colors.border : colors.secondary }, style]}
    />
  );
}
