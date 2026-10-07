import { CalendarDays, Mic, PencilLine, ScanLine, Trash2, type LucideIcon } from 'lucide-react-native';
import { View } from 'react-native';

import { Card, CategoryBadge, IconButton, Money, Text } from '@/components/ui';
import { formatFullDate } from '@/lib/dates';
import type { Category, TransactionSource } from '@/schemas/models';
import type { Draft } from '@/schemas/transactionForm';
import { useTheme } from '@/theme';

const sourceMeta: Record<TransactionSource, { icon: LucideIcon; label: string }> = {
  manual: { icon: PencilLine, label: 'Manual' },
  scan: { icon: ScanLine, label: 'Scanned' },
  voice: { icon: Mic, label: 'Voice' },
};

interface DraftCardProps {
  draft: Draft;
  category?: Category;
  accountName?: string;
  currency: string;
  onEdit: () => void;
  /** Only offered when there's more than one draft */
  onRemove?: () => void;
}

/** Read-only summary of an unsaved transaction, with Edit (and Remove) actions. */
export function DraftCard({ draft, category, accountName, currency, onEdit, onRemove }: DraftCardProps) {
  const { colors } = useTheme();
  const source = sourceMeta[draft.source];
  const SourceIcon = source.icon;
  const isIncome = draft.type === 'income';

  return (
    <Card className="gap-4">
      <View className="flex-row items-start gap-3">
        <CategoryBadge icon={category?.icon ?? 'shapes'} color={category?.color ?? 'tan'} size="lg" />
        <View className="flex-1 gap-1">
          <Text variant="title" numberOfLines={1}>
            {draft.merchant || 'No merchant'}
          </Text>
          <Text variant="bodySm" tone="muted" numberOfLines={1}>
            {[category?.name ?? 'No category', accountName].filter(Boolean).join(' · ')}
          </Text>
        </View>
        <View className="flex-row gap-1">
          {onRemove && <IconButton icon={Trash2} accessibilityLabel={`Remove ${draft.merchant}`} variant="ghost" iconColor={colors.expense} onPress={onRemove} />}
          <IconButton icon={PencilLine} accessibilityLabel={`Edit ${draft.merchant}`} variant="ghost" iconColor={colors.secondary} onPress={onEdit} />
        </View>
      </View>

      <Money cents={isIncome ? draft.amount : -draft.amount} signed currency={currency} variant="moneyLg" tone={isIncome ? 'income' : 'default'} />

      <View className="flex-row flex-wrap items-center gap-x-4 gap-y-2">
        <Meta icon={CalendarDays} text={formatFullDate(draft.date)} />
        <Meta icon={SourceIcon} text={source.label} />
      </View>
      {draft.note && (
        <Text variant="bodySm" tone="muted" className="italic">
          “{draft.note}”
        </Text>
      )}
    </Card>
  );
}

function Meta({ icon: Icon, text }: { icon: LucideIcon; text: string }) {
  const { colors } = useTheme();
  return (
    <View className="flex-row items-center gap-1.5">
      <Icon size={14} color={colors.muted} strokeWidth={2} />
      <Text variant="caption" tone="muted">
        {text}
      </Text>
    </View>
  );
}
