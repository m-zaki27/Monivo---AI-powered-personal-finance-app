import type { ReactNode } from 'react';
import { View } from 'react-native';

import { Text } from './Text';
import { TextLink } from './TextLink';

interface SectionHeaderProps {
  title: string;
  /** e.g. "See all" */
  actionLabel?: string;
  onAction?: () => void;
  right?: ReactNode;
  /** For card-less sections: bigger title over a hairline rule with a gold underline */
  prominent?: boolean;
}

export function SectionHeader({ title, actionLabel, onAction, right, prominent }: SectionHeaderProps) {
  const trailing = actionLabel && onAction ? <TextLink label={actionLabel} onPress={onAction} /> : right;

  if (!prominent) {
    return (
      <View className="min-h-11 flex-row items-center justify-between">
        <Text variant="title" accessibilityRole="header">
          {title}
        </Text>
        {trailing}
      </View>
    );
  }

  return (
    <View>
      <View className="min-h-11 flex-row items-end justify-between pb-2">
        <Text variant="h2" accessibilityRole="header">
          {title}
        </Text>
        {trailing}
      </View>
      <View className="h-px bg-line">
        <View className="absolute -top-px left-0 h-[3px] w-10 rounded-full bg-gold" />
      </View>
    </View>
  );
}
