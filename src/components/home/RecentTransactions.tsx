import { router } from 'expo-router';
import { Receipt } from 'lucide-react-native';
import { View } from 'react-native';

import { TransactionRow, TransactionRowSkeleton } from '@/components/transactions';
import { Card, EmptyState, ErrorState, SectionHeader } from '@/components/ui';
import { useAccountMap, useCategoryMap } from '@/hooks';
import type { Transaction } from '@/schemas/models';

interface RecentTransactionsProps {
  transactions?: Transaction[];
  error?: unknown;
  onRetry: () => void;
  currency: string;
}

export function RecentTransactions({ transactions, error, onRetry, currency }: RecentTransactionsProps) {
  const categories = useCategoryMap();
  const accounts = useAccountMap();

  return (
    <Card padding="sm" className="px-4">
      <View className="px-2">
        <SectionHeader title="Recent" actionLabel="See all" onAction={() => router.push('/transactions')} />
      </View>
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
        transactions.map((t) => (
          <TransactionRow
            key={t.id}
            transaction={t}
            category={categories.get(t.categoryId)}
            accountName={accounts.get(t.accountId)?.name}
            currency={currency}
            showDate
          />
        ))
      )}
    </Card>
  );
}
