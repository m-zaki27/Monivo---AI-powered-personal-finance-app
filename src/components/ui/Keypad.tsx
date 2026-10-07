import { Delete } from 'lucide-react-native';
import { View } from 'react-native';

import { useTheme } from '@/theme/useTheme';

import { PressableScale } from './PressableScale';
import { Text } from './Text';

export type KeypadKey = '0' | '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '.' | 'backspace';

const ROWS: KeypadKey[][] = [
  ['1', '2', '3'],
  ['4', '5', '6'],
  ['7', '8', '9'],
  ['.', '0', 'backspace'],
];

interface KeypadProps {
  onKey: (key: KeypadKey) => void;
  /** Long-press backspace clears everything */
  onClear?: () => void;
  allowDecimal?: boolean;
}

/** Custom numeric keypad — pair with `applyKeypadKey()` from lib/money. */
export function Keypad({ onKey, onClear, allowDecimal = true }: KeypadProps) {
  const { colors } = useTheme();
  return (
    <View className="gap-2">
      {ROWS.map((row, r) => (
        <View key={r} className="flex-row gap-2">
          {row.map((key) => {
            if (key === '.' && !allowDecimal) return <View key={key} className="h-16 flex-1" />;
            const isBack = key === 'backspace';
            return (
              <PressableScale
                key={key}
                haptic="select"
                scaleTo={0.92}
                onPress={() => onKey(key)}
                onLongPress={isBack ? onClear : undefined}
                accessibilityLabel={isBack ? 'Delete' : key === '.' ? 'Decimal point' : key}
                className="h-16 flex-1 items-center justify-center rounded-input"
              >
                {isBack ? (
                  <Delete size={26} color={colors.text} strokeWidth={2} />
                ) : (
                  <Text variant="moneyLg">
                    {key}
                  </Text>
                )}
              </PressableScale>
            );
          })}
        </View>
      ))}
    </View>
  );
}
