import { View } from 'react-native';

import { Skeleton, Text } from '@/components/ui';

/** Numbered codes in one column (they're 19 characters wide), styled like something you'd write down. */
export function BackupCodeGrid({ codes }: { codes: string[] }) {
  return (
    <View className="flex-row flex-wrap rounded-card border border-line bg-surface p-4">
      {codes.map((code, i) => (
        <View key={code} className="w-full flex-row items-center gap-3 px-2 py-2.5">
          <Text variant="caption" tone="muted" numberOfLines={1} style={{ width: 24, fontVariant: ['tabular-nums'] }}>
            {i + 1}.
          </Text>
          <Text variant="moneySm" selectable style={{ letterSpacing: 1.5 }}>
            {code}
          </Text>
        </View>
      ))}
    </View>
  );
}

export function BackupCodeGridSkeleton() {
  return (
    <View className="flex-row flex-wrap rounded-card border border-line bg-surface p-4">
      {Array.from({ length: 10 }, (_, i) => (
        <View key={i} className="w-full px-2 py-3">
          <Skeleton height={18} width="70%" />
        </View>
      ))}
    </View>
  );
}
