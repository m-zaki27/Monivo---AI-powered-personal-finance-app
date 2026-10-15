import { useState } from 'react';
import { Pressable, View, type LayoutRectangle } from 'react-native';
import { useAnimatedStyle, useDerivedValue, withSpring } from 'react-native-reanimated';

import { Text } from '@/components/ui';
import { AnimatedView } from '@/lib/animated';
import { haptics } from '@/lib/haptics';
import { motion } from '@/theme/tokens';

interface HeroPillsProps<T extends string> {
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
  /** Highlight colour (and inactive label colour, faded) */
  ink: string;
  inkMuted: string;
  /** Label colour on the highlight */
  onInk: string;
}

/** Pills with a spring-sliding highlight; each pill measures itself so any label length works. */
export function HeroPills<T extends string>({ options, value, onChange, ink, inkMuted, onInk }: HeroPillsProps<T>) {
  const [layouts, setLayouts] = useState<Record<string, LayoutRectangle>>({});
  const active = layouts[value];
  const x = useDerivedValue(() => withSpring(active?.x ?? 0, motion.spring), [active?.x]);
  const width = useDerivedValue(() => withSpring(active?.width ?? 0, motion.spring), [active?.width]);
  const highlight = useAnimatedStyle(() => ({ transform: [{ translateX: x.value }], width: width.value }));

  return (
    <View className="mt-8 flex-row justify-center gap-3" accessibilityRole="tablist">
      {active && <AnimatedView className="absolute bottom-0 left-0 top-0 rounded-full" style={[{ backgroundColor: ink }, highlight]} />}
      {options.map((o) => {
        const selected = o.value === value;
        return (
          <Pressable
            key={o.value}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            onLayout={(e) => {
              const l = e.nativeEvent.layout;
              setLayouts((prev) => (prev[o.value]?.x === l.x && prev[o.value]?.width === l.width ? prev : { ...prev, [o.value]: l }));
            }}
            onPress={() => {
              if (!selected) haptics.select();
              onChange(o.value);
            }}
            className="h-11 items-center justify-center rounded-full px-6"
            // Until the pills have measured themselves, show a plain highlight so nothing flashes.
            style={!active && selected ? { backgroundColor: ink } : undefined}
          >
            <Text variant="bodySm" weight="bold" style={{ color: selected ? onInk : inkMuted }}>
              {o.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
