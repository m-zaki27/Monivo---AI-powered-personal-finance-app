import { useEffect, type ReactNode } from 'react';
import { View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedProps,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';

import { AnimatedView } from '@/lib/animated';

export interface RingSegment {
  key: string;
  /** 0–1 share of the full circle */
  value: number;
  color: string;
}

interface RingProps {
  size: number;
  stroke: number;
  segments: RingSegment[];
  trackColor: string;
  /** Shown in the middle (e.g. a percentage) */
  children?: ReactNode;
  accessibilityLabel?: string;
}

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const EASE = Easing.out(Easing.cubic);

/** SVG gauge: each segment is a dashed circle rotated to start where the previous one ends. */
export function Ring({ size, stroke, segments, trackColor, children, accessibilityLabel }: RingProps) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const center = size / 2;
  const reduceMotion = useReducedMotion();
  const turn = useSharedValue(reduceMotion || segments.length < 2 ? 0 : -50);

  useEffect(() => {
    turn.value = withTiming(0, { duration: 700, easing: EASE });
  }, [turn]);

  const spin = useAnimatedStyle(() => ({ transform: [{ rotate: `${turn.value}deg` }] }));
  // Round caps extend stroke/2 past each end, so trim adjacent dashes by a full stroke.
  const gap = segments.length > 1 ? stroke + 3 : 0;
  const shares = segments.map((s) => Math.min(Math.max(s.value, 0), 1));
  const starts = shares.map((_, i) => shares.slice(0, i).reduce((sum, v) => sum + v, 0) * c);

  return (
    <View style={{ width: size, height: size }} accessible={!!accessibilityLabel} accessibilityLabel={accessibilityLabel}>
      <AnimatedView style={[{ width: size, height: size }, spin]}>
        <Svg width={size} height={size}>
          <Circle cx={center} cy={center} r={r} stroke={trackColor} strokeWidth={stroke} fill="none" />
          {segments.length === 1 ? (
            <GaugeArc share={shares[0]!} c={c} r={r} center={center} stroke={stroke} color={segments[0]!.color} reduceMotion={reduceMotion} />
          ) : (
            segments.map((s, i) =>
              shares[i]! > 0 ? (
                <SegmentArc
                  key={s.key}
                  length={Math.max(shares[i]! * c - gap, 0.01)}
                  start={starts[i]!}
                  c={c}
                  r={r}
                  center={center}
                  stroke={stroke}
                  color={s.color}
                  delay={reduceMotion ? 0 : 120 + i * 110}
                />
              ) : null,
            )
          )}
        </Svg>
      </AnimatedView>
      {children && <View className="absolute inset-0 items-center justify-center">{children}</View>}
    </View>
  );
}

interface ArcBase {
  c: number;
  r: number;
  center: number;
  stroke: number;
  color: string;
}

/** Single gauge: the dash is the whole circle, and the offset reveals `visible` of it. */
function GaugeArc({ share, c, r, center, stroke, color, reduceMotion }: ArcBase & { share: number; reduceMotion: boolean }) {
  const visible = useSharedValue(reduceMotion ? share * c : 0);
  useEffect(() => {
    visible.value = reduceMotion ? share * c : withTiming(share * c, { duration: 900, easing: EASE });
  }, [share, c, visible, reduceMotion]);

  const props = useAnimatedProps(() => ({
    strokeDashoffset: c - visible.value,
    // A zero-length dash with round caps would still draw a dot.
    strokeOpacity: visible.value < 0.5 ? 0 : 1,
  }));

  return (
    <AnimatedCircle
      cx={center}
      cy={center}
      r={r}
      stroke={color}
      strokeWidth={stroke}
      strokeLinecap="round"
      fill="none"
      strokeDasharray={`${c} ${c}`}
      transform={`rotate(-90 ${center} ${center})`}
      animatedProps={props}
    />
  );
}

/** One slice of a multi-segment ring, fading in after `delay` ms. */
function SegmentArc({ length, start, c, r, center, stroke, color, delay }: ArcBase & { length: number; start: number; delay: number }) {
  const opacity = useSharedValue(delay ? 0 : 1);
  useEffect(() => {
    opacity.value = withDelay(delay, withTiming(1, { duration: 350 }));
  }, [delay, opacity]);
  const props = useAnimatedProps(() => ({ strokeOpacity: opacity.value }));

  return (
    <AnimatedCircle
      cx={center}
      cy={center}
      r={r}
      stroke={color}
      strokeWidth={stroke}
      strokeLinecap="round"
      fill="none"
      strokeDasharray={`${length} ${c}`}
      strokeDashoffset={-start}
      transform={`rotate(-90 ${center} ${center})`}
      animatedProps={props}
    />
  );
}
