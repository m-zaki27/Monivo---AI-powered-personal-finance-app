import type { LucideIcon } from 'lucide-react-native';
import { ActivityIndicator, View } from 'react-native';

import { cn } from '@/lib/cn';
import { useTheme } from '@/theme/useTheme';

import { PressableScale, type PressableScaleProps } from './PressableScale';
import { Text, type TextTone } from './Text';

type Variant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

const containerClass: Record<Variant, string> = {
  primary: 'bg-gold',
  secondary: 'bg-raised border border-line',
  outline: 'bg-transparent border border-line',
  ghost: 'bg-transparent',
  danger: 'bg-rose',
};

const textTone: Record<Variant, TextTone> = {
  primary: 'onGold',
  secondary: 'default',
  outline: 'default',
  ghost: 'cobalt',
  danger: 'white',
};

// sm is still 44px tall — the minimum comfortable touch target.
const sizeClass: Record<Size, string> = { sm: 'h-11 px-4', md: 'h-12 px-6', lg: 'h-14 px-8' };

export interface ButtonProps extends Omit<PressableScaleProps, 'children'> {
  title: string;
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  leftIcon?: LucideIcon;
  rightIcon?: LucideIcon;
  fullWidth?: boolean;
}

export function Button({
  title,
  variant = 'primary',
  size = 'lg',
  loading,
  disabled,
  leftIcon: Left,
  rightIcon: Right,
  fullWidth,
  className,
  style,
  ...rest
}: ButtonProps) {
  const { colors, palette, gradients } = useTheme();
  const iconColor = {
    primary: colors.onPrimary,
    secondary: colors.text,
    outline: colors.text,
    ghost: colors.secondary,
    danger: palette.white,
  }[variant];
  const inactive = disabled || loading;

  return (
    <PressableScale
      disabled={inactive}
      haptic={variant === 'primary' ? 'press' : 'tap'}
      accessibilityState={{ disabled: !!inactive, busy: !!loading }}
      accessibilityLabel={title}
      className={cn(
        'flex-row items-center justify-center rounded-full',
        containerClass[variant],
        sizeClass[size],
        fullWidth && 'w-full',
        inactive && 'opacity-50',
        className,
      )}
      style={[variant === 'primary' && !inactive && { boxShadow: `0px 8px 20px ${gradients.goldGlow}` }, style]}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator color={iconColor} />
      ) : (
        <View className="flex-row items-center gap-2">
          {Left && <Left size={20} color={iconColor} strokeWidth={2} />}
          <Text variant={size === 'sm' ? 'bodySm' : 'body'} weight="bold" tone={textTone[variant]}>
            {title}
          </Text>
          {Right && <Right size={20} color={iconColor} strokeWidth={2} />}
        </View>
      )}
    </PressableScale>
  );
}
