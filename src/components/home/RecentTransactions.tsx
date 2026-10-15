import { router } from 'expo-router';
import { Receipt } from 'lucide-react-native';
import { View } from 'react-native';
import { FadeInDown, LinearTransition } from 'react-native-reanimated';

import { TransactionRow, TransactionRowSkeleton } from '@/components/transactions';
import { EmptyState, ErrorState, SectionHeader } from '@/components/ui';
import { useAccountMap, useCategoryMap } from '@/hooks';
import { AnimatedView } from '@/lib/animated';
import type { Transaction } from '@/schemas/models';

interface RecentTransactionsProps {
  transactions?: Transaction[];
  error?: unknown;
  onRetry: () => void;
  currency: string;
}

/** Latest few transactions as a plain list. */
export function RecentTransactions({ transactions, error, onRetry, currency }: RecentTransactionsProps) {
  const categories = useCategoryMap();
  const accounts = useAccountMap();

  return (
    <View className="gap-2">
      <SectionHeader prominent title="Recent" actionLabel="See all" onAction={() => router.push('/transactions')} />
      {error ? (
        <ErrorState compact error={error} onRetry={onRetry} />
      ) : !transactions ? (
        [0, 1, 2, 3, 4].map((i) => <TransactionRowSkeleton key={i} />)
      ) : transactions.length === 0 ? (
        <EmptyState
          compact
          icon={Receipt}
          title="No transactions yet"
          message="Add one with the + button and it'll show up here."
        />
      ) : (
        // Rows drift up one after another; when one is added or removed the rest slide into place.
        transactions.map((t, i) => (
          <AnimatedView key={t.id} entering={FadeInDown.duration(320).delay(i * 60)} layout={LinearTransition.springify().damping(18)}>
            <TransactionRow
              transaction={t}
              category={categories.get(t.categoryId)}
              accountName={accounts.get(t.accountId)?.name}
              currency={currency}
              showDate
            />
          </AnimatedView>
        ))
      )}
    </View>
  );
}
