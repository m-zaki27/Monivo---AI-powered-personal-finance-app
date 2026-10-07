import { Pressable } from 'react-native';

import { haptics } from '@/lib/haptics';
import { cn } from '@/lib/cn';

import { Text, type TextVariant } from './Text';

interface TextLinkProps {
  label: string;
  onPress: () => void;
  variant?: TextVariant;
  disabled?: boolean;
  className?: string;
}

/** Inline cobalt link. Padded to a 44px touch target even when the text is small. */
export function TextLink({ label, onPress, variant = 'bodySm', disabled, className }: TextLinkProps) {
  return (
    <Pressable
      accessibilityRole="link"
      accessibilityState={{ disabled: !!disabled }}
      disabled={disabled}
      hitSlop={8}
      onPress={() => {
        haptics.tap();
        onPress();
      }}
      className={cn('min-h-11 justify-center', disabled && 'opacity-50', className)}
    >
      {({ pressed }) => (
        <Text variant={variant} weight="bold" tone="cobalt" style={{ opacity: pressed ? 0.6 : 1 }}>
          {label}
        </Text>
      )}
    </Pressable>
  );
}
