import { Trash2 } from 'lucide-react-native';
import { memo, useRef } from 'react';
import { Pressable, View } from 'react-native';
import ReanimatedSwipeable, { type SwipeableMethods } from 'react-native-gesture-handler/ReanimatedSwipeable';
import { useAnimatedStyle, type SharedValue } from 'react-native-reanimated';

import { Text } from '@/components/ui';
import { AnimatedView } from '@/lib/animated';
import { haptics } from '@/lib/haptics';
import { formatMoney } from '@/lib/money';
import type { Category, Transaction } from '@/schemas/models';
import { useTheme } from '@/theme';

import { TransactionRow } from './TransactionRow';

const ACTION_WIDTH = 88;

interface SwipeableTransactionRowProps {
  transaction: Transaction;
  category?: Category;
  accountName?: string;
  currency: string;
  onDelete: (t: Transaction) => void;
}

/** Swipe-to-delete, also exposed via accessibilityActions since screen readers can't swipe. */
export const SwipeableTransactionRow = memo(function SwipeableTransactionRow({ onDelete, ...row }: SwipeableTransactionRowProps) {
  const ref = useRef<SwipeableMethods>(null);
  const t = row.transaction;
  const label = `${t.merchant}, ${t.type === 'income' ? 'income' : 'expense'} ${formatMoney(t.amount, { currency: row.currency })}, ${row.category?.name ?? ''}`;
  const del = () => {
    haptics.warning();
    ref.current?.close();
    onDelete(row.transaction);
  };

  return (
    <ReanimatedSwipeable
      ref={ref}
      friction={2}
      rightThreshold={ACTION_WIDTH / 2}
      overshootRight={false}
      onSwipeableWillOpen={() => haptics.select()}
      renderRightActions={(_progress, translation) => <DeleteAction translation={translation} onPress={del} />}
    >
      <View
        className="bg-bg px-6"
        accessible
        accessibilityLabel={label}
        accessibilityActions={[{ name: 'delete', label: 'Delete transaction' }]}
        onAccessibilityAction={(e) => e.nativeEvent.actionName === 'delete' && del()}
      >
        <TransactionRow {...row} />
      </View>
    </ReanimatedSwipeable>
  );
});

function DeleteAction({ translation, onPress }: { translation: SharedValue<number>; onPress: () => void }) {
  const { colors, palette } = useTheme();
  const style = useAnimatedStyle(() => ({
    transform: [{ translateX: translation.value + ACTION_WIDTH }],
  }));

  return (
    <AnimatedView style={[{ width: ACTION_WIDTH, backgroundColor: colors.expense }, style]}>
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel="Delete"
        className="flex-1 items-center justify-center gap-1"
      >
        <Trash2 size={20} color={palette.white} strokeWidth={2} />
        <Text variant="caption" weight="bold" tone="white">
          Delete
        </Text>
      </Pressable>
    </AnimatedView>
  );
}
