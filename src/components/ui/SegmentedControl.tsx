import { useEffect, useState } from 'react';
import { Pressable, View } from 'react-native';
import { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

import { AnimatedView } from '@/lib/animated';
import { haptics } from '@/lib/haptics';
import { useTheme } from '@/theme/useTheme';
import { motion } from '@/theme/tokens';

import { Text } from './Text';

export interface Segment<T extends string> {
  value: T;
  label: string;
  /** Colour of the sliding thumb when this segment is active */
  activeColor?: string;
}

interface SegmentedControlProps<T extends string> {
  segments: Segment<T>[];
  value: T;
  onChange: (value: T) => void;
  accessibilityLabel?: string;
}

const PAD = 4;

/** Generic over the value type, so `onChange` is typed as e.g. 'income' | 'expense'. */
export function SegmentedControl<T extends string>({ segments, value, onChange, accessibilityLabel }: SegmentedControlProps<T>) {
  const { colors } = useTheme();
  const [width, setWidth] = useState(0);
  const index = Math.max(0, segments.findIndex((s) => s.value === value));
  const segWidth = width > 0 ? (width - PAD * 2) / segments.length : 0;
  const x = useSharedValue(0);

  useEffect(() => {
    x.value = withSpring(index * segWidth, motion.spring);
  }, [index, segWidth, x]);

  const thumbStyle = useAnimatedStyle(() => ({ transform: [{ translateX: x.value }] }));
  const active = segments[index];
  const thumbColor = active?.activeColor ?? colors.surface;
  const coloredThumb = !!active?.activeColor;

  return (
    <View
      accessibilityRole="tablist"
      accessibilityLabel={accessibilityLabel}
      onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
      className="h-12 flex-row rounded-full border border-line bg-raised"
      style={{ padding: PAD }}
    >
      {segWidth > 0 && (
        <AnimatedView
          className="absolute rounded-full"
          style={[{ top: PAD, bottom: PAD, left: PAD, width: segWidth, backgroundColor: thumbColor }, thumbStyle]}
        />
      )}
      {segments.map((s) => {
        const selected = s.value === value;
        return (
          <Pressable
            key={s.value}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            onPress={() => {
              if (!selected) haptics.select();
              onChange(s.value);
            }}
            className="flex-1 items-center justify-center"
          >
            <Text
              variant="bodySm"
              weight="bold"
              tone={selected ? (coloredThumb ? 'onGold' : 'default') : 'muted'}
            >
              {s.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
