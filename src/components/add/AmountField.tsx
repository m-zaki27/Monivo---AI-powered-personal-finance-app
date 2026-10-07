import { AlertCircle } from 'lucide-react-native';
import { useRef, useState } from 'react';
import { Pressable, TextInput, View } from 'react-native';

import { Text } from '@/components/ui';
import { findCurrency } from '@/lib/currencies';
import { sanitizeAmountInput } from '@/lib/money';
import { useTheme } from '@/theme';
import { fonts } from '@/theme/tokens';

interface AmountFieldProps {
  value: string;
  onChange: (v: string) => void;
  onBlur?: () => void;
  currency: string;
  /** Colours the number: sky for income, default ink for expenses */
  tone?: 'income' | 'expense';
  error?: string;
  size?: 'lg' | 'md';
  autoFocus?: boolean;
}

/**
 * The big amount. A real TextInput with the decimal keypad (not our custom
 * Keypad) because this screen also has text fields, and two keyboards
 * fighting for space is worse than one.
 */
export function AmountField({ value, onChange, onBlur, currency, tone = 'expense', error, size = 'lg', autoFocus }: AmountFieldProps) {
  const { colors, isDark } = useTheme();
  const ref = useRef<TextInput>(null);
  const [textWidth, setTextWidth] = useState(0);
  const fontSize = size === 'lg' ? (value.length > 9 ? 40 : 52) : 36;
  const color = error ? colors.expense : tone === 'income' ? colors.income : colors.text;
  const symbol = findCurrency(currency).symbol;
  const textStyle = { fontFamily: fonts.numBold, fontSize, letterSpacing: -fontSize * 0.04, fontVariant: ['tabular-nums' as const] };

  return (
    <View className="items-center gap-2">
      {/* Tapping anywhere on the row focuses the input; the symbol isn't part of it. */}
      <Pressable onPress={() => ref.current?.focus()} className="max-w-full flex-row items-center justify-center" accessible={false}>
        {/* Invisible copy of the text, measured so the input hugs its content.
            Without it a TextInput keeps a fixed width and the number can't stay centred. */}
        <Text
          accessibilityElementsHidden
          importantForAccessibility="no"
          style={[textStyle, { position: 'absolute', opacity: 0 }]}
          onLayout={(e) => setTextWidth(e.nativeEvent.layout.width)}
        >
          {value || '0'}
        </Text>
        <Text variant="moneyLg" tone="muted" className="mr-1">
          {symbol}
        </Text>
        <TextInput
          ref={ref}
          value={value}
          onChangeText={(t) => onChange(sanitizeAmountInput(t))}
          onBlur={onBlur}
          placeholder="0"
          placeholderTextColor={colors.muted}
          keyboardType="decimal-pad"
          keyboardAppearance={isDark ? 'dark' : 'light'}
          selectionColor={colors.secondary}
          autoFocus={autoFocus}
          accessibilityLabel="Amount"
          accessibilityHint={error}
          maxLength={13}
          style={[textStyle, { color, width: textWidth + 8, minWidth: 32, padding: 0 }]}
        />
      </Pressable>
      {error && (
        <View className="flex-row items-center gap-1.5">
          <AlertCircle size={14} color={colors.expense} />
          <Text variant="caption" tone="expense">
            {error}
          </Text>
        </View>
      )}
    </View>
  );
}
