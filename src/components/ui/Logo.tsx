import { View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { useTheme } from '@/theme/useTheme';

import { Text } from './Text';

interface LogoProps {
  size?: number;
  withWordmark?: boolean;
  /** Override the automatic gold-on-dark / navy-on-light colour */
  color?: string;
}

/**
 * The Monivo mark: a rounded "M" whose middle rises into a small peak,
 * hinting at a chart ticking upward. One stroked path with round joins.
 */
export function LogoMark({ size = 40, color }: Omit<LogoProps, 'withWordmark'>) {
  const { colors } = useTheme();
  const stroke = color ?? colors.logo;
  return (
    <Svg width={size} height={size} viewBox="0 0 48 48" accessibilityLabel="Monivo logo">
      <Path
        d="M9 38 V12 L19 26 L24 18 L29 26 L39 12 V38"
        fill="none"
        stroke={stroke}
        strokeWidth={6}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function Logo({ size = 40, withWordmark = false, color }: LogoProps) {
  const { colors } = useTheme();
  if (!withWordmark) return <LogoMark size={size} color={color} />;
  return (
    <View className="flex-row items-center gap-2">
      <LogoMark size={size} color={color} />
      <Text
        weight="extrabold"
        style={{ fontSize: size * 0.7, lineHeight: size * 0.85, letterSpacing: -0.8, color: color ?? colors.text }}
      >
        Monivo
      </Text>
    </View>
  );
}
