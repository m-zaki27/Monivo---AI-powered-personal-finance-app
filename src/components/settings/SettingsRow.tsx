import { ChevronRight, type LucideIcon } from 'lucide-react-native';
import { Children, Fragment, type ReactNode } from 'react';
import { View } from 'react-native';

import { Card, PressableScale, Switch, Text } from '@/components/ui';
import { withAlpha } from '@/lib/color';
import { useTheme } from '@/theme';

interface SettingsRowProps {
  icon: LucideIcon;
  /** Icon tint; defaults to cobalt */
  color?: string;
  label: string;
  /** Second line, e.g. "Get an email every Monday" */
  description?: string;
  /** Short value on the right, e.g. "USD" */
  value?: string;
  onPress?: () => void;
  /** Renders a switch instead of a chevron */
  toggle?: { value: boolean; onChange: (v: boolean) => void; disabled?: boolean };
  destructive?: boolean;
}

/** One row: tinted icon badge, label (+ description), then a value + chevron or a switch. */
export function SettingsRow({ icon: Icon, color, label, description, value, onPress, toggle, destructive }: SettingsRowProps) {
  const { colors } = useTheme();
  const tint = destructive ? colors.expense : (color ?? colors.secondary);

  const content = (
    <>
      <View className="h-9 w-9 items-center justify-center rounded-full" style={{ backgroundColor: withAlpha(tint, 0.14) }}>
        <Icon size={18} color={tint} strokeWidth={2} />
      </View>
      <View className="flex-1 gap-0.5">
        <Text weight="semibold" tone={destructive ? 'expense' : 'default'}>
          {label}
        </Text>
        {description && (
          <Text variant="caption" tone="muted">
            {description}
          </Text>
        )}
      </View>
      {value && (
        <Text variant="bodySm" tone="muted" numberOfLines={1} className="max-w-[45%]">
          {value}
        </Text>
      )}
      {toggle ? (
        <Switch value={toggle.value} onValueChange={toggle.onChange} disabled={toggle.disabled} accessibilityLabel={label} />
      ) : (
        onPress && !destructive && <ChevronRight size={18} color={colors.muted} />
      )}
    </>
  );

  const className = 'min-h-[60px] flex-row items-center gap-3 px-4 py-3';
  // Toggle rows aren't pressable as a whole: the switch is the control, which
  // avoids two touch targets fighting over one gesture.
  if (onPress && !toggle) {
    return (
      <PressableScale onPress={onPress} scaleTo={0.98} accessibilityLabel={label} accessibilityHint={description} className={className}>
        {content}
      </PressableScale>
    );
  }
  return <View className={className}>{content}</View>;
}

/** Overline title + a card of rows separated by hairlines. */
export function SettingsSection({ title, children }: { title: string; children: ReactNode }) {
  const rows = Children.toArray(children).filter(Boolean);
  return (
    <View className="gap-2">
      <Text variant="overline" tone="muted" className="px-1">
        {title}
      </Text>
      <Card padding="none" className="overflow-hidden">
        {rows.map((row, i) => (
          <Fragment key={i}>
            {i > 0 && <View className="ml-16 h-px bg-line" />}
            {row}
          </Fragment>
        ))}
      </Card>
    </View>
  );
}
