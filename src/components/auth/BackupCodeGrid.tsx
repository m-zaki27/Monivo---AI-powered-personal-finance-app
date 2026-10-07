import { View } from 'react-native';

import { Skeleton, Text } from '@/components/ui';

/** Two columns of numbered codes, styled like something you'd write down. */
export function BackupCodeGrid({ codes }: { codes: string[] }) {
  return (
    <View className="flex-row flex-wrap rounded-card border border-line bg-surface p-4">
      {codes.map((code, i) => (
        <View key={code} className="w-1/2 flex-row items-center gap-2 px-2 py-3">
          <Text variant="caption" tone="muted" numberOfLines={1} style={{ width: 24, fontVariant: ['tabular-nums'] }}>
            {i + 1}.
          </Text>
          <Text variant="moneySm" selectable style={{ letterSpacing: 1 }}>
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
        <View key={i} className="w-1/2 px-2 py-3">
          <Skeleton height={20} width="80%" />
        </View>
      ))}
    </View>
  );
}
