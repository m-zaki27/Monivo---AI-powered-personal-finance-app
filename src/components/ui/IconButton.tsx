import type { LucideIcon } from 'lucide-react-native';

import { cn } from '@/lib/cn';
import { useTheme } from '@/theme/useTheme';

import { PressableScale, type PressableScaleProps } from './PressableScale';

interface IconButtonProps extends Omit<PressableScaleProps, 'children'> {
  icon: LucideIcon;
  /** Required: icon-only buttons need a screen-reader label */
  accessibilityLabel: string;
  variant?: 'surface' | 'ghost' | 'gold';
  size?: 44 | 48 | 56;
  iconColor?: string;
}

const variantClass = {
  surface: 'bg-glass border border-glass-line',
  ghost: 'bg-transparent',
  gold: 'bg-gold',
};

export function IconButton({ icon: Icon, variant = 'surface', size = 44, iconColor, className, style, ...rest }: IconButtonProps) {
  const { colors } = useTheme();
  const color = iconColor ?? (variant === 'gold' ? colors.onPrimary : colors.text);
  return (
    <PressableScale
      hitSlop={4}
      className={cn('items-center justify-center rounded-full', variantClass[variant], className)}
      style={[{ width: size, height: size }, style]}
      {...rest}
    >
      <Icon size={Math.round(size * 0.45)} color={color} strokeWidth={2} />
    </PressableScale>
  );
}
