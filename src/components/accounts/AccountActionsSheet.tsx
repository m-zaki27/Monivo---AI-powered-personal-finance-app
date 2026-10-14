import { ChevronRight, PencilLine, Star, Trash2, type LucideIcon } from 'lucide-react-native';
import { useState } from 'react';
import { View } from 'react-native';

import { BottomSheet, PressableScale, Text } from '@/components/ui';
import { withAlpha } from '@/lib/color';
import type { AccountWithBalance } from '@/schemas/models';
import { useTheme } from '@/theme';

interface AccountActionsSheetProps {
  account: AccountWithBalance | null;
  onClose: () => void;
  onSetDefault: (a: AccountWithBalance) => void;
  onEdit: (a: AccountWithBalance) => void;
  onDelete: (a: AccountWithBalance) => void;
}

export function AccountActionsSheet({ account, onClose, onSetDefault, onEdit, onDelete }: AccountActionsSheetProps) {
  const { colors } = useTheme();
  // Remember the last account so the sheet keeps its content while it slides away.
  // (Updating state during render is React's pattern for "remember a previous prop".)
  const [last, setLast] = useState(account);
  if (account && account !== last) setLast(account);
  const shown = account ?? last;

  const run = (fn: (a: AccountWithBalance) => void) => () => {
    onClose();
    if (shown) fn(shown);
  };

  if (!shown) return null;
  return (
    <BottomSheet visible={!!account} onClose={onClose} title={shown.name}>
      <View className="gap-2">
        {!shown.isDefault && (
          <Action icon={Star} color={colors.primary} label="Set as default" hint="New transactions start with this account" onPress={run(onSetDefault)} />
        )}
        <Action icon={PencilLine} color={colors.secondary} label="Edit account" onPress={run(onEdit)} />
        <Action icon={Trash2} color={colors.expense} label="Delete account" destructive onPress={run(onDelete)} />
      </View>
    </BottomSheet>
  );
}

interface ActionProps {
  icon: LucideIcon;
  color: string;
  label: string;
  hint?: string;
  destructive?: boolean;
  onPress: () => void;
}

function Action({ icon: Icon, color, label, hint, destructive, onPress }: ActionProps) {
  const { colors } = useTheme();
  return (
    <PressableScale
      onPress={onPress}
      scaleTo={0.98}
      accessibilityLabel={label}
      accessibilityHint={hint}
      className="min-h-16 flex-row items-center gap-4 rounded-input px-2 py-2"
    >
      <View className="h-11 w-11 items-center justify-center rounded-full" style={{ backgroundColor: withAlpha(color, 0.14) }}>
        <Icon size={20} color={color} strokeWidth={2} />
      </View>
      <View className="flex-1">
        <Text weight="semibold" tone={destructive ? 'expense' : 'default'}>
          {label}
        </Text>
        {hint && (
          <Text variant="caption" tone="muted">
            {hint}
          </Text>
        )}
      </View>
      <ChevronRight size={18} color={colors.muted} />
    </PressableScale>
  );
}
