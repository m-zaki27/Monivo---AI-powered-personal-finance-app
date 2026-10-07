import { LinearGradient } from 'expo-linear-gradient';
import { Eye, EyeOff, TrendingDown, TrendingUp } from 'lucide-react-native';
import { Pressable, StyleSheet, View } from 'react-native';
import Svg, { Defs, RadialGradient, Rect, Stop } from 'react-native-svg';

import { Money, Skeleton, Text } from '@/components/ui';
import { haptics } from '@/lib/haptics';
import { useTheme } from '@/theme';

interface BalanceCardProps {
  total?: number;
  accountCount?: number;
  /** Income minus expenses this month */
  net?: number;
  currency: string;
  hidden: boolean;
  onToggleHidden: () => void;
  loading?: boolean;
}

const ON_HERO_MUTED = 'rgba(244,241,234,0.7)';
const SKELETON_ON_HERO = 'rgba(255,255,255,0.14)';

/**
 * The hero card: cobalt → deep navy, with a soft gold glow in one corner.
 * It's dark in both themes on purpose (it's the brand moment), so its text is
 * always light rather than following the theme.
 */
export function BalanceCard({ total, accountCount, net, currency, hidden, onToggleHidden, loading }: BalanceCardProps) {
  const { gradients, palette } = useTheme();
  const up = (net ?? 0) >= 0;
  const Trend = up ? TrendingUp : TrendingDown;

  return (
    <View className="overflow-hidden rounded-card" style={{ boxShadow: `0px 16px 32px rgba(47,107,255,0.28)` }}>
      <LinearGradient colors={gradients.hero} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
      <Svg width="100%" height="100%" style={StyleSheet.absoluteFill} pointerEvents="none">
        <Defs>
          <RadialGradient id="heroGlow" cx="100%" cy="100%" r="70%">
            <Stop offset="0" stopColor={palette.gold} stopOpacity={0.45} />
            <Stop offset="1" stopColor={palette.gold} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Rect width="100%" height="100%" fill="url(#heroGlow)" />
      </Svg>
      <View className="border-white/10 gap-5 rounded-card border p-6">
        <View className="flex-row items-center justify-between">
          <Text variant="bodySm" weight="semibold" style={{ color: ON_HERO_MUTED }}>
            Total balance
          </Text>
          <Pressable
            onPress={() => {
              haptics.select();
              onToggleHidden();
            }}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={hidden ? 'Show balance' : 'Hide balance'}
            className="-mr-2 h-11 w-11 items-center justify-center rounded-full"
          >
            {hidden ? <EyeOff size={20} color={palette.cream} /> : <Eye size={20} color={palette.cream} />}
          </Pressable>
        </View>

        {loading || total == null ? (
          <View className="gap-3">
            <Skeleton height={48} width="70%" color={SKELETON_ON_HERO} />
            <Skeleton height={14} width="45%" color={SKELETON_ON_HERO} />
          </View>
        ) : (
          <View className="gap-3">
            <Money cents={total} currency={currency} variant="balance" tone="white" splitCents hidden={hidden} numberOfLines={1} />
            <View className="flex-row flex-wrap items-center gap-2">
              {net != null && (
                <View className="bg-white/15 flex-row items-center gap-1.5 rounded-full px-3 py-1">
                  <Trend size={14} color={up ? palette.sky : palette.rose} strokeWidth={2.5} />
                  <Money cents={net} signed currency={currency} variant="moneySm" tone="white" hidden={hidden} />
                  <Text variant="caption" style={{ color: ON_HERO_MUTED }}>
                    this month
                  </Text>
                </View>
              )}
              <Text variant="caption" style={{ color: ON_HERO_MUTED }}>
                across {accountCount} {accountCount === 1 ? 'account' : 'accounts'}
              </Text>
            </View>
          </View>
        )}
      </View>
    </View>
  );
}
