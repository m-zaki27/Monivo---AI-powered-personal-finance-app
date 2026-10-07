import { AlertTriangle, Trash2 } from 'lucide-react-native';
import { View } from 'react-native';

import { Dialog, Text } from '@/components/ui';
import { withAlpha } from '@/lib/color';
import type { AccountWithBalance } from '@/schemas/models';
import { useTheme } from '@/theme';

interface DeleteAccountDialogProps {
  account: AccountWithBalance | null;
  onCancel: () => void;
  onConfirm: (a: AccountWithBalance) => void;
  loading?: boolean;
}

/**
 * Two variants. An empty account gets a plain "are you sure". One with
 * history gets a warning box spelling out what else disappears, and a button
 * that says it too ("Delete account and 24 transactions"), so nobody loses
 * data by tapping through.
 */
export function DeleteAccountDialog({ account, onCancel, onConfirm, loading }: DeleteAccountDialogProps) {
  const { colors } = useTheme();
  const count = account?.transactionCount ?? 0;
  const plural = count === 1 ? 'transaction' : 'transactions';

  return (
    <Dialog
      visible={!!account}
      tone="danger"
      icon={Trash2}
      title={`Delete ${account?.name ?? 'account'}?`}
      message={count === 0 ? "This account has no transactions. This can't be undone." : undefined}
      confirmLabel={count === 0 ? 'Delete account' : `Delete account and ${count} ${plural}`}
      onConfirm={() => account && onConfirm(account)}
      onCancel={onCancel}
      loading={loading}
    >
      {count > 0 && (
        <View
          className="flex-row gap-3 rounded-input border p-4"
          style={{ backgroundColor: withAlpha(colors.warning, 0.1), borderColor: withAlpha(colors.warning, 0.35) }}
        >
          <AlertTriangle size={20} color={colors.warning} strokeWidth={2} />
          <View className="flex-1 gap-1">
            <Text weight="bold">
              This account has {count} {plural}
            </Text>
            <Text variant="bodySm" tone="muted">
              They'll be deleted too, and your balances and budget will change. This can't be undone.
            </Text>
          </View>
        </View>
      )}
    </Dialog>
  );
}
