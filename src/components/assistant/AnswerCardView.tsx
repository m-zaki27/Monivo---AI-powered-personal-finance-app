import { TrendingDown, TrendingUp } from 'lucide-react-native';
import { View } from 'react-native';

import { Money, ProgressBar, Text } from '@/components/ui';
import { formatMoney } from '@/lib/money';
import type { AnswerCard } from '@/services';
import { useTheme } from '@/theme';
import { categoryColors } from '@/theme/tokens';

/** Inline mini chart / summary under an assistant answer; plain Views, no chart library. */
export function AnswerCardView({ card, currency }: { card: AnswerCard; currency: string }) {
  if (card.kind === 'bars') return <Bars card={card} currency={currency} />;
  if (card.kind === 'budget') return <BudgetSummary card={card} currency={currency} />;
  return <Stat card={card} currency={currency} />;
}

function Shell({ children }: { children: React.ReactNode }) {
  return <View className="mt-3 gap-3 rounded-input border border-line bg-surface p-4">{children}</View>;
}

function Bars({ card, currency }: { card: Extract<AnswerCard, { kind: 'bars' }>; currency: string }) {
  const max = Math.max(...card.items.map((i) => i.value), 1);
  return (
    <Shell>
      <Text variant="caption" weight="bold" tone="muted">
        {card.title}
      </Text>
      {card.items.map((item) => (
        <View key={item.label} className="gap-1.5">
          <View className="flex-row justify-between gap-2">
            <Text variant="bodySm" weight="semibold" numberOfLines={1} className="flex-1">
              {item.label}
            </Text>
            <Money cents={item.value} currency={currency} variant="moneySm" />
          </View>
          <View className="h-2 overflow-hidden rounded-full bg-raised">
            <View className="h-full rounded-full" style={{ width: `${(item.value / max) * 100}%`, backgroundColor: categoryColors[item.color] }} />
          </View>
        </View>
      ))}
    </Shell>
  );
}

function BudgetSummary({ card, currency }: { card: Extract<AnswerCard, { kind: 'budget' }>; currency: string }) {
  const ratio = card.spent / card.limit;
  const fmt = (c: number) => formatMoney(c, { currency, hideZeroCents: true });
  return (
    <Shell>
      <View className="flex-row items-baseline justify-between">
        <Money cents={card.spent} currency={currency} variant="moneyMd" />
        <Text variant="caption" tone="muted">
          of {fmt(card.limit)}
        </Text>
      </View>
      <ProgressBar value={ratio} warnAt={card.threshold} />
      <View className="flex-row justify-between">
        <Text variant="caption" tone="muted">
          {Math.round(ratio * 100)}% used
        </Text>
        <Text variant="caption" tone={card.projected > card.limit ? 'warning' : 'muted'}>
          On pace for {fmt(card.projected)}
        </Text>
      </View>
    </Shell>
  );
}

function Stat({ card, currency }: { card: Extract<AnswerCard, { kind: 'stat' }>; currency: string }) {
  const { colors } = useTheme();
  const up = (card.deltaPct ?? 0) > 0;
  return (
    <Shell>
      <Text variant="caption" tone="muted">
        {card.label}
      </Text>
      <Money cents={card.value} currency={currency} variant="moneyLg" />
      {card.caption && (
        <Text variant="caption" tone="muted">
          {card.caption}
        </Text>
      )}
      {card.deltaPct != null && (
        <View className="flex-row items-center gap-1">
          {up ? <TrendingUp size={14} color={colors.expense} /> : <TrendingDown size={14} color={colors.income} />}
          <Text variant="caption" tone={up ? 'expense' : 'income'}>
            {Math.abs(card.deltaPct)}% vs last month
          </Text>
        </View>
      )}
    </Shell>
  );
}
