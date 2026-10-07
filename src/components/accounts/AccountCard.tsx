import { LinearGradient } from 'expo-linear-gradient';
import { MoreHorizontal, Star } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';

import { accountTypeIcons } from '@/components/add/AccountPicker';
import { Money, PressableScale, Skeleton, Text } from '@/components/ui';
import { withAlpha } from '@/lib/color';
import type { AccountType } from '@/schemas/models';
import { categoryColors, palette, type CategoryColor } from '@/theme/tokens';

const typeLabel: Record<AccountType, string> = { bank: 'Bank account', credit: 'Credit card', cash: 'Cash' };

export interface AccountCardData {
  name: string;
  type: AccountType;
  institution?: string;
  last4?: string;
  color: CategoryColor;
  balance: number;
  isDefault: boolean;
  transactionCount?: number;
}

interface AccountCardProps {
  account: AccountCardData;
  currency: string;
  onPress?: () => void;
}

const ON_CARD_MUTED = 'rgba(255,255,255,0.72)';

/**
 * Tinted gradient card, like a physical card: the account colour fading into
 * deep navy. Always dark with light text, in both themes, so every colour
 * stays readable. Also used as the live preview on the add/edit form.
 */
export function AccountCard({ account: a, currency, onPress }: AccountCardProps) {
  const tint = categoryColors[a.color];
  const Icon = accountTypeIcons[a.type];
  const subtitle = [a.institution, a.last4 && `•••• ${a.last4}`].filter(Boolean).join('  ') || typeLabel[a.type];

  return (
    <PressableScale
      onPress={onPress}
      disabled={!onPress}
      scaleTo={0.98}
      accessibilityLabel={`${a.name}, ${typeLabel[a.type]}${a.isDefault ? ', default account' : ''}`}
      accessibilityHint={onPress ? 'Opens account options' : undefined}
      className="overflow-hidden rounded-card"
      style={{ boxShadow: `0px 12px 28px ${withAlpha(tint, 0.3)}` }}
    >
      <LinearGradient colors={[tint, palette.navy]} start={{ x: 0, y: 0 }} end={{ x: 1.1, y: 1.2 }} style={StyleSheet.absoluteFill} />
      <View className="border-white/10 min-h-[176px] justify-between gap-6 rounded-card border p-5">
        <View className="flex-row items-start justify-between">
          <View className="flex-row items-center gap-3">
            <View className="bg-white/20 h-11 w-11 items-center justify-center rounded-full">
              <Icon size={22} color={palette.white} strokeWidth={2} />
            </View>
            <View className="shrink">
              <Text weight="bold" tone="white" numberOfLines={1}>
                {a.name || 'New account'}
              </Text>
              <Text variant="caption" style={{ color: ON_CARD_MUTED }} numberOfLines={1}>
                {subtitle}
              </Text>
            </View>
          </View>
          {a.isDefault ? (
            <View className="flex-row items-center gap-1 rounded-full bg-gold px-2.5 py-1">
              <Star size={12} color={palette.midnight} fill={palette.midnight} />
              <Text variant="caption" weight="bold" tone="onGold">
                Default
              </Text>
            </View>
          ) : (
            onPress && <MoreHorizontal size={20} color={ON_CARD_MUTED} />
          )}
        </View>

        <View className="flex-row items-end justify-between">
          <View>
            <Text variant="caption" style={{ color: ON_CARD_MUTED }}>
              {a.type === 'credit' ? (a.balance < 0 ? 'Owed' : 'Credit') : 'Balance'}
            </Text>
            {/* For a credit card, "−$1,286" reads better as "$1,286 owed". */}
            <Money cents={a.type === 'credit' ? Math.abs(a.balance) : a.balance} currency={currency} variant="moneyLg" tone="white" numberOfLines={1} />
          </View>
          {a.transactionCount != null && (
            <Text variant="caption" style={{ color: ON_CARD_MUTED }}>
              {a.transactionCount} {a.transactionCount === 1 ? 'transaction' : 'transactions'}
            </Text>
          )}
        </View>
      </View>
    </PressableScale>
  );
}

export function AccountCardSkeleton() {
  return <Skeleton height={176} rounded="rounded-card" />;
}
