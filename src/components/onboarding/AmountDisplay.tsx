import { View } from 'react-native';

import { Text } from '@/components/ui';

interface AmountDisplayProps {
  /** Raw typed string from the keypad, e.g. "1250.5" */
  value: string;
  symbol: string;
}

/** "1250.5" → "1,250.5" — groups the whole part, keeps what was typed after the dot. */
function groupDigits(value: string) {
  const [whole = '', frac] = value.split('.');
  const grouped = (whole || '0').replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return frac === undefined ? grouped : `${grouped}.${frac}`;
}

/**
 * Steps the size down as the number grows so it always fits on one line.
 * (RN's adjustsFontSizeToFit would do this, but it's iOS-only.)
 */
function sizeFor(text: string): number {
  const n = text.length;
  if (n <= 6) return 64;
  if (n <= 8) return 56;
  if (n <= 10) return 46;
  if (n <= 12) return 40;
  return 34;
}

/** The huge number on the starting-balance step. */
export function AmountDisplay({ value, symbol }: AmountDisplayProps) {
  const empty = value === '';
  const text = groupDigits(value);
  const fontSize = sizeFor(text);
  return (
    <View className="items-center gap-1" accessibilityLiveRegion="polite" accessibilityLabel={`${symbol}${value || '0'}`}>
      <View className="w-full flex-row items-start justify-center px-2">
        <Text variant="moneyLg" tone="muted" className="mr-1 mt-2">
          {symbol}
        </Text>
        <Text
          variant="balanceXl"
          tone={empty ? 'muted' : 'default'}
          numberOfLines={1}
          style={{ fontSize, lineHeight: fontSize * 1.12, letterSpacing: -fontSize * 0.04 }}
        >
          {text}
        </Text>
      </View>
    </View>
  );
}
