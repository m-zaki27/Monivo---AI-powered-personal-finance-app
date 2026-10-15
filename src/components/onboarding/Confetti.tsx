import { useEffect, useState } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';

import { AnimatedView } from '@/lib/animated';
import { palette } from '@/theme';

const COLORS = [palette.gold, palette.cobalt, palette.sky, palette.rose, palette.amber, palette.goldLight];
const COUNT = 36;

interface PieceSpec {
  x: number;
  drift: number;
  delay: number;
  duration: number;
  spin: number;
  w: number;
  h: number;
  color: string;
}

const rand = (min: number, max: number) => min + Math.random() * (max - min);

/** One shared value drives every piece on the UI thread; skipped with Reduce Motion. */
export function Confetti() {
  const { width } = useWindowDimensions();
  const reduceMotion = useReducedMotion();
  // Random layout generated once, not per render.
  const [pieces] = useState<PieceSpec[]>(() =>
    Array.from({ length: COUNT }, (_, i) => ({
      x: rand(0, width),
      drift: rand(-60, 60),
      delay: rand(0, 500),
      duration: rand(1800, 2800),
      spin: rand(-540, 540),
      w: rand(6, 10),
      h: rand(10, 16),
      color: COLORS[i % COLORS.length]!,
    })),
  );

  if (reduceMotion) return null;
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill} className="overflow-hidden">
      {pieces.map((p, i) => (
        <Piece key={i} spec={p} />
      ))}
    </View>
  );
}

function Piece({ spec }: { spec: PieceSpec }) {
  const { height } = useWindowDimensions();
  const t = useSharedValue(0);

  useEffect(() => {
    t.value = withDelay(spec.delay, withTiming(1, { duration: spec.duration, easing: Easing.out(Easing.quad) }));
  }, [spec, t]);

  const style = useAnimatedStyle(() => ({
    opacity: t.value < 0.75 ? 1 : 1 - (t.value - 0.75) * 4,
    transform: [
      { translateX: spec.drift * t.value },
      { translateY: -40 + t.value * height * 0.75 },
      { rotate: `${spec.spin * t.value}deg` },
    ],
  }));

  return (
    <AnimatedView
      style={[
        { position: 'absolute', left: spec.x, top: 0, width: spec.w, height: spec.h, borderRadius: 2, backgroundColor: spec.color },
        style,
      ]}
    />
  );
}
