import { Search } from 'lucide-react-native';
import { ScrollView, View } from 'react-native';

import { Chip, Input } from '@/components/ui';
import type { AccountWithBalance, TransactionType } from '@/schemas/models';

export interface TransactionFilterState {
  search: string;
  type?: TransactionType;
  accountId?: string;
}

interface TransactionFilterBarProps {
  value: TransactionFilterState;
  onChange: (next: TransactionFilterState) => void;
  accounts: AccountWithBalance[];
}

/** Type and account filters combine; "All" clears both. */
export function TransactionFilterBar({ value, onChange, accounts }: TransactionFilterBarProps) {
  const set = (patch: Partial<TransactionFilterState>) => onChange({ ...value, ...patch });
  const toggleType = (t: TransactionType) => set({ type: value.type === t ? undefined : t });

  return (
    <View className="gap-3">
      <View className="px-6">
        <Input
          value={value.search}
          onChangeText={(search) => set({ search })}
          placeholder="Search merchant, category or note"
          leftIcon={Search}
          autoCorrect={false}
          returnKeyType="search"
          clearButtonMode="while-editing"
          accessibilityLabel="Search transactions"
        />
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerClassName="gap-2 px-6"
        keyboardShouldPersistTaps="handled"
      >
        <Chip label="All" selected={!value.type && !value.accountId} onPress={() => set({ type: undefined, accountId: undefined })} />
        <Chip label="Income" selected={value.type === 'income'} onPress={() => toggleType('income')} />
        <Chip label="Expense" selected={value.type === 'expense'} onPress={() => toggleType('expense')} />
        <View className="mx-1 w-px self-stretch bg-line" />
        {accounts.map((a) => (
          <Chip
            key={a.id}
            label={a.name}
            selected={value.accountId === a.id}
            onPress={() => set({ accountId: value.accountId === a.id ? undefined : a.id })}
          />
        ))}
      </ScrollView>
    </View>
  );
}
