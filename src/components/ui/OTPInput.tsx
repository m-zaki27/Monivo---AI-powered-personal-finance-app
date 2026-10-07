import { useEffect, useRef, useState } from 'react';
import { TextInput, View } from 'react-native';
import { useAnimatedStyle, useSharedValue, withSequence, withTiming } from 'react-native-reanimated';

import { AnimatedView } from '@/lib/animated';
import { cn } from '@/lib/cn';
import { useTheme } from '@/theme/useTheme';

interface OTPInputProps {
  value: string;
  onChange: (value: string) => void;
  /** Fires once every box is filled */
  onComplete?: (code: string) => void;
  length?: number;
  error?: boolean;
  autoFocus?: boolean;
}

/**
 * Six real inputs (not one hidden one) so each box is individually focusable.
 * Typing advances, backspace on an empty box steps back, and pasting or
 * SMS autofill distributes the digits across the boxes.
 */
export function OTPInput({ value, onChange, onComplete, length = 6, error, autoFocus }: OTPInputProps) {
  const { colors, isDark } = useTheme();
  const refs = useRef<(TextInput | null)[]>([]);
  const [focused, setFocused] = useState<number | null>(null);
  const shake = useSharedValue(0);

  useEffect(() => {
    if (error) {
      shake.value = withSequence(
        ...[-8, 8, -6, 6, -3, 0].map((v) => withTiming(v, { duration: 50 })),
      );
    }
  }, [error, shake]);

  const shakeStyle = useAnimatedStyle(() => ({ transform: [{ translateX: shake.value }] }));

  const setDigits = (next: string) => {
    const clean = next.replace(/\D/g, '').slice(0, length);
    onChange(clean);
    if (clean.length === length) onComplete?.(clean);
    return clean;
  };

  const handleChange = (index: number, text: string) => {
    let digits = text.replace(/\D/g, '');
    const current = value[index] ?? '';
    // Typing into an already-filled box: keep only the new digit.
    if (current && digits.length === 2) digits = digits.replace(current, '') || current;
    if (digits.length > 1) {
      // Paste / autofill: fill from this box onward.
      const clean = setDigits(value.slice(0, index) + digits);
      refs.current[Math.min(clean.length, length - 1)]?.focus();
      return;
    }
    const chars = value.split('');
    chars[index] = digits;
    const clean = setDigits(chars.join('').slice(0, length));
    if (digits && index < length - 1) refs.current[Math.min(index + 1, clean.length)]?.focus();
  };

  const handleBackspace = (index: number) => {
    if (value[index]) return; // the change handler clears the current box
    if (index > 0) {
      setDigits(value.slice(0, index - 1));
      refs.current[index - 1]?.focus();
    }
  };

  return (
    <AnimatedView className="flex-row justify-between gap-2" style={shakeStyle}>
      {Array.from({ length }, (_, i) => {
        const char = value[i] ?? '';
        const isFocused = focused === i;
        return (
          <View
            key={i}
            className={cn(
              'h-14 flex-1 items-center justify-center rounded-input border bg-surface',
              error ? 'border-rose' : isFocused ? 'border-cobalt' : char ? 'border-muted' : 'border-line',
            )}
            style={{ maxWidth: 56 }}
          >
            <TextInput
              ref={(r) => {
                refs.current[i] = r;
              }}
              value={char}
              autoFocus={autoFocus && i === 0}
              onChangeText={(t) => handleChange(i, t)}
              onKeyPress={(e) => e.nativeEvent.key === 'Backspace' && handleBackspace(i)}
              onFocus={() => {
                // Don't allow gaps: tapping a later box jumps to the first empty one.
                if (i > value.length) return refs.current[value.length]?.focus();
                setFocused(i);
              }}
              onBlur={() => setFocused((f) => (f === i ? null : f))}
              keyboardType="number-pad"
              keyboardAppearance={isDark ? 'dark' : 'light'}
              textContentType={i === 0 ? 'oneTimeCode' : 'none'}
              autoComplete={i === 0 ? 'sms-otp' : 'off'}
              selectionColor={colors.secondary}
              maxLength={length}
              accessibilityLabel={`Digit ${i + 1} of ${length}`}
              className="h-full w-full text-center font-num-bold text-2xl text-ink"
              style={{ fontVariant: ['tabular-nums'] }}
            />
          </View>
        );
      })}
    </AnimatedView>
  );
}
