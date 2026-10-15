import { StyleSheet, useWindowDimensions } from 'react-native';
import Svg, { Circle, Defs, RadialGradient, Stop } from 'react-native-svg';

import { useTheme } from '@/theme/useTheme';

/** Static SVG glows that tint the see-through cards; cheaper than live blur on Android. */
export function Ambient() {
  const { width, height } = useWindowDimensions();
  const { colors } = useTheme();
  const r = width * 0.85;
  const glows = [
    { id: 'a', cx: width * 0.08, cy: height * 0.04, color: colors.primary, alpha: colors.ambient[0] },
    { id: 'b', cx: width, cy: height * 0.38, color: colors.secondary, alpha: colors.ambient[1] },
    { id: 'c', cx: width * 0.2, cy: height * 0.92, color: colors.income, alpha: colors.ambient[2] },
  ];

  return (
    <Svg width={width} height={height} style={StyleSheet.absoluteFill} pointerEvents="none">
      <Defs>
        {glows.map((g) => (
          <RadialGradient key={g.id} id={`glow-${g.id}`} cx={g.cx} cy={g.cy} r={r} gradientUnits="userSpaceOnUse">
            <Stop offset="0" stopColor={g.color} stopOpacity={g.alpha} />
            <Stop offset="1" stopColor={g.color} stopOpacity={0} />
          </RadialGradient>
        ))}
      </Defs>
      {glows.map((g) => (
        <Circle key={g.id} cx={g.cx} cy={g.cy} r={r} fill={`url(#glow-${g.id})`} />
      ))}
    </Svg>
  );
}
