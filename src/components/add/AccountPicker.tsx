import { Banknote, CreditCard, Landmark, type LucideIcon } from 'lucide-react-native';
import { ScrollView, View } from 'react-native';

import { Chip, Skeleton } from '@/components/ui';
import type { AccountType, AccountWithBalance } from '@/schemas/models';

import { FieldLabel } from './FieldLabel';

export const accountTypeIcons: Record<AccountType, LucideIcon> = {
  cash: Banknote,
  bank: Landmark,
  credit: CreditCard,
};

interface AccountPickerProps {
  accounts: AccountWithBalance[] | undefined;
  value: string;
  onChange: (id: string) => void;
  error?: string;
}

export function AccountPicker({ accounts, value, onChange, error }: AccountPickerProps) {
  return (
    <View className="gap-3">
      <FieldLabel label="Account" error={error} />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-2" className="-mx-6 px-6">
        {!accounts
          ? [0, 1, 2].map((i) => <Skeleton key={i} width={120} height={40} rounded="rounded-chip" />)
          : accounts.map((a) => (
              <Chip key={a.id} label={a.name} icon={accountTypeIcons[a.type]} selected={a.id === value} onPress={() => onChange(a.id)} />
            ))}
        <View className="w-6" />
      </ScrollView>
    </View>
  );
}
