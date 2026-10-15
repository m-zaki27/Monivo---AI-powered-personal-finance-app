import { router } from 'expo-router';
import { Eye, EyeOff, Menu } from 'lucide-react-native';
import { useState, type ReactNode } from 'react';
import { Pressable, View } from 'react-native';

import { Avatar, Logo, Money, Skeleton, Text } from '@/components/ui';
import { useCountUp } from '@/hooks';
import { withAlpha } from '@/lib/color';
import { greetingFor } from '@/lib/dates';
import { haptics } from '@/lib/haptics';
import type { User } from '@/schemas/models';
import { useTheme } from '@/theme';

import { HeroPills } from './HeroPills';
import { HomeMenuSheet } from './HomeMenuSheet';

type HeroView = 'balance' | 'income' | 'spent';

interface HomeHeroProps {
  user?: User;
  total?: number;
  accountCount?: number;
  income?: number;
  expense?: number;
  currency: string;
  hidden: boolean;
  onToggleHidden: () => void;
}

const VIEWS: { value: HeroView; label: string }[] = [
  { value: 'balance', label: 'Balance' },
  { value: 'income', label: 'Income' },
  { value: 'spent', label: 'Spent' },
];

/** Home header and headline number; solid navy in both themes so it stands out from the glass cards. */
export function HomeHero({ user, total, accountCount, income, expense, currency, hidden, onToggleHidden }: HomeHeroProps) {
  const { palette } = useTheme();
  const ink = palette.cream;
  const inkMuted = withAlpha(ink, 0.7);
  const [view, setView] = useState<HeroView>('balance');
  const [menuOpen, setMenuOpen] = useState(false);

  const amount = useCountUp(view === 'balance' ? total : view === 'income' ? income : expense);
  const caption =
    view === 'balance'
      ? `total from ${accountCount ?? 0} ${accountCount === 1 ? 'account' : 'accounts'}`
      : view === 'income'
        ? 'earned this month'
        : 'spent this month';

  return (
    <View
      className="overflow-hidden rounded-card border"
      style={{ backgroundColor: palette.navySurface, borderColor: 'rgba(255,255,255,0.08)', boxShadow: '0px 18px 36px rgba(11,16,32,0.35)' }}
    >
      <View className="px-6 pb-10 pt-6">
        <View className="flex-row items-center justify-between">
          <RoundButton label="Open menu" ink={ink} onPress={() => setMenuOpen(true)}>
            <Menu size={22} color={ink} strokeWidth={2} />
          </RoundButton>
          <Logo size={28} withWordmark color={palette.gold} />
          <Pressable
            onPress={() => router.push('/profile')}
            accessibilityRole="button"
            accessibilityLabel="Your profile"
            hitSlop={4}
          >
            <Avatar user={user} size={48} onColor />
          </Pressable>
        </View>

        <View className="mt-12 items-center gap-1">
          <Text variant="bodySm" style={{ color: inkMuted }}>
            {greetingFor()}
            {user ? `, ${user.firstName}` : ''}
          </Text>
          {amount == null ? (
            <Skeleton height={60} width="70%" className="my-1" color={withAlpha(ink, 0.12)} />
          ) : (
            <View className="w-full items-center">
              <Money
                cents={amount}
                currency={currency}
                variant="balanceXl"
                tone="white"
                splitCents
                hidden={hidden}
                center
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.5}
              />
            </View>
          )}
          <Pressable
            onPress={() => {
              haptics.select();
              onToggleHidden();
            }}
            accessibilityRole="button"
            accessibilityLabel={hidden ? 'Show amounts' : 'Hide amounts'}
            hitSlop={8}
            className="min-h-11 flex-row items-center gap-2 px-2"
          >
            <Text variant="bodySm" style={{ color: inkMuted }}>
              {caption}
            </Text>
            {hidden ? <EyeOff size={16} color={inkMuted} /> : <Eye size={16} color={inkMuted} />}
          </Pressable>
        </View>

        <HeroPills options={VIEWS} value={view} onChange={setView} ink={ink} inkMuted={inkMuted} onInk={palette.navySurface} />
      </View>

      <HomeMenuSheet visible={menuOpen} onClose={() => setMenuOpen(false)} />
    </View>
  );
}

function RoundButton({ label, ink, onPress, children }: { label: string; ink: string; onPress: () => void; children: ReactNode }) {
  return (
    <Pressable
      onPress={() => {
        haptics.tap();
        onPress();
      }}
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={4}
      className="h-12 w-12 items-center justify-center rounded-full border"
      style={{ backgroundColor: withAlpha(ink, 0.08), borderColor: withAlpha(ink, 0.16) }}
    >
      {children}
    </Pressable>
  );
}
