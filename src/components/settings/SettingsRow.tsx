import { ChevronRight, type LucideIcon } from 'lucide-react-native';
import { Children, Fragment, type ReactNode } from 'react';
import { View } from 'react-native';

import { Card, PressableScale, Switch, Text } from '@/components/ui';
import { withAlpha } from '@/lib/color';
import { useTheme } from '@/theme';

interface SettingsRowProps {
  icon: LucideIcon;
  color?: string;
  label: string;
  description?: string;
  value?: string;
  onPress?: () => void;
  toggle?: { value: boolean; onChange: (v: boolean) => void; disabled?: boolean };
  destructive?: boolean;
}

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
  // Only the switch is pressable, so two touch targets don't fight over one gesture.
  if (onPress && !toggle) {
    return (
      <PressableScale onPress={onPress} scaleTo={0.98} accessibilityLabel={label} accessibilityHint={description} className={className}>
        {content}
      </PressableScale>
    );
  }
  return <View className={className}>{content}</View>;
}

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
