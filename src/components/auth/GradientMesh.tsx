import { useEffect } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Defs, RadialGradient, Rect, Stop } from 'react-native-svg';

import { AnimatedView } from '@/lib/animated';
import { useTheme } from '@/theme';

interface BlobProps {
  color: string;
  opacity: number;
  size: number;
  x: number;
  y: number;
  /** How far (px) it drifts back and forth */
  drift: number;
  duration: number;
}

/**
 * A "mesh" built from a few large radial-gradient blobs that drift slowly.
 * Each blob is its own SVG fading from colour to transparent, so they blend
 * where they overlap. Motion stops if the user has Reduce Motion turned on.
 */
function Blob({ color, opacity, size, x, y, drift, duration }: BlobProps) {
  const reduceMotion = useReducedMotion();
  const t = useSharedValue(0);
  const id = `blob-${color.replace('#', '')}`;

  useEffect(() => {
    if (reduceMotion) return;
    t.value = withRepeat(withTiming(1, { duration, easing: Easing.inOut(Easing.sin) }), -1, true);
  }, [reduceMotion, duration, t]);

  const style = useAnimatedStyle(() => ({
    transform: [{ translateX: drift * (t.value - 0.5) }, { translateY: drift * 0.6 * (0.5 - t.value) }],
  }));

  return (
    <AnimatedView pointerEvents="none" style={[{ position: 'absolute', left: x - size / 2, top: y - size / 2 }, style]}>
      <Svg width={size} height={size}>
        <Defs>
          <RadialGradient id={id} cx="50%" cy="50%" r="50%">
            <Stop offset="0" stopColor={color} stopOpacity={opacity} />
            <Stop offset="1" stopColor={color} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Rect width={size} height={size} fill={`url(#${id})`} />
      </Svg>
    </AnimatedView>
  );
}

export function GradientMesh() {
  const { width, height } = useWindowDimensions();
  const { isDark, palette } = useTheme();
  const big = Math.max(width, height) * 1.1;

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill} className="overflow-hidden bg-bg">
      <Blob color={palette.cobalt} opacity={isDark ? 0.7 : 0.3} size={big} x={width * 0.1} y={height * 0.12} drift={60} duration={9000} />
      <Blob color={palette.sky} opacity={isDark ? 0.25 : 0.2} size={big * 0.7} x={width * 0.95} y={height * 0.35} drift={50} duration={11000} />
      <Blob color={palette.gold} opacity={isDark ? 0.4 : 0.35} size={big * 0.75} x={width * 0.9} y={height * 0.78} drift={40} duration={10000} />
      {isDark && <Blob color={palette.navy} opacity={0.9} size={big * 0.9} x={width * 0.2} y={height * 0.85} drift={30} duration={12000} />}
    </View>
  );
}
