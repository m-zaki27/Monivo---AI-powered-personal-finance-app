import type { ReactNode } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';

import { cn } from '@/lib/cn';
import { useTheme } from '@/theme/useTheme';

import { PressableScale } from './PressableScale';

const padClass = { none: '', sm: 'p-4', md: 'p-6' } as const;

interface CardProps {
  children: ReactNode;
  variant?: 'surface' | 'raised';
  padding?: keyof typeof padClass;
  onPress?: () => void;
  accessibilityLabel?: string;
  className?: string;
  style?: StyleProp<ViewStyle>;
}

/** 24px radius, hairline translucent border, soft tinted shadow. */
export function Card({ children, variant = 'surface', padding = 'md', onPress, accessibilityLabel, className, style }: CardProps) {
  const { shadow } = useTheme();
  const classes = cn(
    'rounded-card border border-line',
    variant === 'surface' ? 'bg-surface' : 'bg-raised',
    padClass[padding],
    className,
  );
  const styles = [{ boxShadow: shadow.card }, style];

  if (onPress) {
    return (
      <PressableScale onPress={onPress} scaleTo={0.98} accessibilityLabel={accessibilityLabel} className={classes} style={styles}>
        {children}
      </PressableScale>
    );
  }
  return (
    <View className={classes} style={styles}>
      {children}
    </View>
  );
}
