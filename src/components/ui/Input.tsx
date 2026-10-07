import { AlertCircle, Eye, EyeOff, type LucideIcon } from 'lucide-react-native';
import { useState, type ReactNode, type Ref } from 'react';
import { Pressable, TextInput, View, type TextInputProps } from 'react-native';

import { cn } from '@/lib/cn';
import { useTheme } from '@/theme/useTheme';

import { Text } from './Text';

export interface InputProps extends TextInputProps {
  ref?: Ref<TextInput>;
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: LucideIcon;
  /** Custom node on the right (e.g. a "Copy" button) */
  right?: ReactNode;
  containerClassName?: string;
}

/**
 * Plain controlled input. Works with React Hook Form via <Controller>
 * (value / onChangeText / onBlur). If `secureTextEntry` is set, an eye
 * toggle appears automatically.
 */
export function Input({
  ref,
  label,
  error,
  hint,
  leftIcon: Left,
  right,
  secureTextEntry,
  containerClassName,
  className,
  onFocus,
  onBlur,
  editable = true,
  ...rest
}: InputProps) {
  const { colors, isDark } = useTheme();
  const [focused, setFocused] = useState(false);
  const [hidden, setHidden] = useState(true);
  const borderClass = error ? 'border-rose' : focused ? 'border-cobalt' : 'border-line';

  return (
    <View className={cn('gap-2', containerClassName)}>
      {label && (
        <Text variant="bodySm" weight="semibold" tone="muted">
          {label}
        </Text>
      )}
      <View
        className={cn(
          'h-14 flex-row items-center gap-3 rounded-input border bg-surface px-4',
          borderClass,
          !editable && 'opacity-60',
        )}
      >
        {Left && <Left size={20} color={focused ? colors.secondary : colors.muted} strokeWidth={2} />}
        <TextInput
          ref={ref}
          editable={editable}
          placeholderTextColor={colors.muted}
          selectionColor={colors.secondary}
          keyboardAppearance={isDark ? 'dark' : 'light'}
          secureTextEntry={secureTextEntry && hidden}
          accessibilityLabel={label ?? rest.placeholder}
          accessibilityHint={error}
          onFocus={(e) => {
            setFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            onBlur?.(e);
          }}
          className={cn('h-full min-w-0 flex-1 font-medium text-base text-ink', className)}
          {...rest}
        />
        {secureTextEntry && (
          <Pressable
            hitSlop={12}
            onPress={() => setHidden((h) => !h)}
            accessibilityRole="button"
            accessibilityLabel={hidden ? 'Show password' : 'Hide password'}
          >
            {hidden ? <Eye size={20} color={colors.muted} /> : <EyeOff size={20} color={colors.muted} />}
          </Pressable>
        )}
        {right}
      </View>
      {error ? (
        <View className="flex-row items-center gap-1.5">
          <AlertCircle size={14} color={colors.expense} strokeWidth={2} />
          <Text variant="caption" tone="expense">
            {error}
          </Text>
        </View>
      ) : hint ? (
        <Text variant="caption" tone="muted">
          {hint}
        </Text>
      ) : null}
    </View>
  );
}
