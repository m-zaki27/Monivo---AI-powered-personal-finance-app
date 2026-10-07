import type { ReactNode } from 'react';
import { View } from 'react-native';

import { Text } from '@/components/ui';

export function DevSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View className="gap-3">
      <Text variant="overline" tone="muted">
        {title}
      </Text>
      <View className="gap-3">{children}</View>
    </View>
  );
}

export function Row({ children }: { children: ReactNode }) {
  return <View className="flex-row flex-wrap items-center gap-3">{children}</View>;
}
