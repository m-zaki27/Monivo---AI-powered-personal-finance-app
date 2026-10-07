import { useDefaultAccount } from '@/hooks';
import type { TransactionFormValues } from '@/schemas/transactionForm';

/** Starting values for a blank manual entry: expense, today, default account. */
export function useDraftDefaults(): TransactionFormValues {
  const account = useDefaultAccount();
  return {
    type: 'expense',
    amount: '',
    merchant: '',
    categoryId: '',
    accountId: account.data?.id ?? '',
    date: new Date().toISOString(),
    note: '',
  };
}
