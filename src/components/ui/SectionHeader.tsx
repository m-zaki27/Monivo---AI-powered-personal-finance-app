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
}

/** Title row above a dashboard section, with an optional link on the right. */
export function SectionHeader({ title, actionLabel, onAction, right }: SectionHeaderProps) {
  return (
    <View className="min-h-11 flex-row items-center justify-between">
      <Text variant="title" accessibilityRole="header">
        {title}
      </Text>
      {actionLabel && onAction ? <TextLink label={actionLabel} onPress={onAction} /> : right}
    </View>
  );
}
