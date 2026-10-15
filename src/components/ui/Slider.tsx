import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { AnimatedView } from '@/lib/animated';
import { haptics } from '@/lib/haptics';
import { useTheme } from '@/theme/useTheme';

const THUMB = 28;

interface SliderProps {
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
  /** Fill colour; defaults to cobalt */
  color?: string;
  accessibilityLabel: string;
  /** What a screen reader says for the value, e.g. "80 percent" */
  formatValue?: (v: number) => string;
}

/** UI-thread slider that only reports stepped values to JS, to avoid re-rendering on every frame. */
export function Slider({ value, min, max, step, onChange, color, accessibilityLabel, formatValue = String }: SliderProps) {
  const { colors } = useTheme();
  const fill = color ?? colors.secondary;
  const [width, setWidth] = useState(0);
  const x = useSharedValue(0);
  const startX = useSharedValue(0);
  const lastStep = useSharedValue(value);

  // Follow outside changes (initial value, screen-reader adjustments, layout).
  useEffect(() => {
    x.set(((value - min) / (max - min)) * width);
    lastStep.set(value);
  }, [value, width, min, max, x, lastStep]);

  const emit = (v: number) => {
    haptics.select();
    onChange(v);
  };

  // Converts a pixel position to a stepped value, and only crosses back to JS when the step changes.
  const update = (px: number) => {
    'worklet';
    const clamped = Math.min(Math.max(px, 0), width);
    x.set(clamped);
    const raw = min + (clamped / Math.max(width, 1)) * (max - min);
    const stepped = Math.round(raw / step) * step;
    if (stepped !== lastStep.get()) {
      lastStep.set(stepped);
      scheduleOnRN(emit, Number(stepped.toFixed(4)));
    }
  };

  const pan = Gesture.Pan()
    .hitSlop({ vertical: 16 })
    .onBegin((e) => {
      startX.set(e.x);
      update(e.x);
    })
    .onUpdate((e) => update(startX.get() + e.translationX))
    .onFinalize(() => {
          x.set(((lastStep.get() - min) / (max - min)) * width);
    });

  const thumbStyle = useAnimatedStyle(() => ({ transform: [{ translateX: x.get() - THUMB / 2 }] }));
  const fillStyle = useAnimatedStyle(() => ({ width: x.get() }));

  return (
    <View
      accessible
      accessibilityRole="adjustable"
      accessibilityLabel={accessibilityLabel}
      accessibilityValue={{ text: formatValue(value) }}
      accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
      onAccessibilityAction={(e) => {
        const next = e.nativeEvent.actionName === 'increment' ? value + step : value - step;
        onChange(Math.min(max, Math.max(min, Number(next.toFixed(4)))));
      }}
    >
      <GestureDetector gesture={pan}>
        <View className="h-11 justify-center" onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
          <View className="h-2 overflow-hidden rounded-full bg-raised">
            <AnimatedView className="h-full rounded-full" style={[{ backgroundColor: fill }, fillStyle]} />
          </View>
          <AnimatedView
            className="absolute rounded-full border-4 bg-white"
            style={[{ width: THUMB, height: THUMB, left: 0, borderColor: fill, boxShadow: '0px 2px 8px rgba(0,0,0,0.25)' }, thumbStyle]}
          />
        </View>
      </GestureDetector>
    </View>
  );
}
