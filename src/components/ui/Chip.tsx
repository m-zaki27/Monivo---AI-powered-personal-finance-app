import type { LucideIcon } from 'lucide-react-native';
import type { ReactNode } from 'react';

import { cn } from '@/lib/cn';
import { useTheme } from '@/theme/useTheme';

import { PressableScale } from './PressableScale';
import { Text } from './Text';

interface ChipProps {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  icon?: LucideIcon;
  /** Extra content after the label, e.g. a count */
  right?: ReactNode;
  className?: string;
}

/** Filter / choice chip. Selected = cobalt fill (the app's "active" colour). */
export function Chip({ label, selected, onPress, icon: Icon, right, className }: ChipProps) {
  const { colors, palette } = useTheme();
  const fg = selected ? palette.white : colors.text;
  return (
    <PressableScale
      onPress={onPress}
      haptic="select"
      hitSlop={{ top: 4, bottom: 4 }}
      accessibilityRole="button"
      accessibilityState={{ selected: !!selected }}
      className={cn(
        'h-10 flex-row items-center gap-2 rounded-chip border px-4',
        selected ? 'border-cobalt bg-cobalt' : 'border-glass-line bg-glass',
        className,
      )}
    >
      {Icon && <Icon size={16} color={fg} strokeWidth={2} />}
      <Text variant="bodySm" weight="semibold" tone={selected ? 'white' : 'default'}>
        {label}
      </Text>
      {right}
    </PressableScale>
  );
}
