import { CloudOff, type LucideIcon } from 'lucide-react-native';
import { View } from 'react-native';

import { withAlpha } from '@/lib/color';
import { cn } from '@/lib/cn';
import { useTheme } from '@/theme/useTheme';

import { Button } from './Button';
import { Text } from './Text';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
  tone?: 'default' | 'error';
  compact?: boolean;
  className?: string;
}

export function EmptyState({ icon: Icon, title, message, actionLabel, onAction, tone = 'default', compact, className }: EmptyStateProps) {
  const { colors } = useTheme();
  const accent = tone === 'error' ? colors.expense : colors.secondary;
  return (
    <View className={cn('items-center px-6', compact ? 'gap-2 py-6' : 'gap-3 py-12', className)}>
      <View
        className="mb-2 items-center justify-center rounded-full"
        style={{ width: compact ? 56 : 72, height: compact ? 56 : 72, backgroundColor: withAlpha(accent, 0.14) }}
      >
        <Icon size={compact ? 24 : 30} color={accent} strokeWidth={2} />
      </View>
      <Text variant="title" center>
        {title}
      </Text>
      {message && (
        <Text variant="bodySm" tone="muted" center className="max-w-[280px]">
          {message}
        </Text>
      )}
      {actionLabel && onAction && (
        <Button title={actionLabel} onPress={onAction} variant="secondary" size="sm" className="mt-3" />
      )}
    </View>
  );
}

/** Standard error block for failed queries. */
export function ErrorState({ error, onRetry, compact }: { error?: unknown; onRetry?: () => void; compact?: boolean }) {
  const message = error instanceof Error ? error.message : 'Something went wrong. Please try again.';
  return (
    <EmptyState
      icon={CloudOff}
      tone="error"
      title="Couldn't load this"
      message={message}
      actionLabel={onRetry ? 'Try again' : undefined}
      onAction={onRetry}
      compact={compact}
    />
  );
}
