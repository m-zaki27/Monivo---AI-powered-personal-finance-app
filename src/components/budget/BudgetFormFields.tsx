import { Mail } from 'lucide-react-native';
import { Controller, type UseFormReturn } from 'react-hook-form';
import { View } from 'react-native';

import { AmountField } from '@/components/add/AmountField';
import { Card, ProgressBar, Slider, Switch, Text } from '@/components/ui';
import { withAlpha } from '@/lib/color';
import { formatMoney, parseToCents } from '@/lib/money';
import type { BudgetFormValues } from '@/schemas/accountForm';
import { useTheme } from '@/theme';

interface BudgetFormFieldsProps {
  form: UseFormReturn<BudgetFormValues>;
  currency: string;
  /** Spent so far this month, for the live preview */
  spent?: number;
}

/** Everything updates live as you type or drag, so the effect of a change is visible before saving. */
export function BudgetFormFields({ form, currency, spent }: BudgetFormFieldsProps) {
  const { colors } = useTheme();
  const { control } = form;
  const v = form.watch();
  const limit = parseToCents(v.monthlyLimit) ?? 0;
  const pct = Math.round(v.alertThreshold * 100);
  const alertAt = Math.round(limit * v.alertThreshold);
  const fmt = (c: number) => formatMoney(c, { currency, hideZeroCents: true });

  return (
    <View className="gap-8">
      <View className="items-center gap-1">
        <Text variant="bodySm" tone="muted">
          Monthly spending limit
        </Text>
        <Controller
          control={control}
          name="monthlyLimit"
          render={({ field, fieldState }) => (
            <AmountField value={field.value} onChange={field.onChange} onBlur={field.onBlur} currency={currency} error={fieldState.error?.message} />
          )}
        />
      </View>

      {spent != null && limit > 0 && (
        <Card variant="raised" className="gap-3">
          <View className="flex-row justify-between">
            <Text variant="bodySm" weight="semibold">
              This month so far
            </Text>
            <Text variant="bodySm" weight="bold" style={{ fontVariant: ['tabular-nums'] }}>
              {Math.round((spent / limit) * 100)}%
            </Text>
          </View>
          <ProgressBar value={spent / limit} warnAt={v.alertThreshold} />
          <Text variant="caption" tone="muted">
            {fmt(spent)} spent of {fmt(limit)}
          </Text>
        </Card>
      )}

      <View className="gap-3">
        <View className="flex-row items-baseline justify-between">
          <Text weight="semibold">Warn me at</Text>
          <Text variant="moneyMd" tone="warning">
            {pct}%
          </Text>
        </View>
        <Controller
          control={control}
          name="alertThreshold"
          render={({ field }) => (
            <Slider
              value={field.value}
              onChange={field.onChange}
              min={0.5}
              max={1}
              step={0.05}
              color={colors.warning}
              accessibilityLabel="Alert threshold"
              formatValue={(x) => `${Math.round(x * 100)} percent`}
            />
          )}
        />
        <Text variant="caption" tone="muted">
          {limit > 0 ? `The budget bar turns amber at ${fmt(alertAt)}.` : 'Set a limit to see when alerts kick in.'}
        </Text>
      </View>

      <Controller
        control={control}
        name="emailAlerts"
        render={({ field }) => (
          <View className="flex-row items-center gap-4 rounded-card border border-glass-line bg-glass p-4">
            <View className="h-11 w-11 items-center justify-center rounded-full" style={{ backgroundColor: withAlpha(colors.secondary, 0.14) }}>
              <Mail size={20} color={colors.secondary} strokeWidth={2} />
            </View>
            <View className="flex-1">
              <Text weight="semibold">Email alerts</Text>
              <Text variant="caption" tone="muted">
                {field.value ? `We'll email you when you pass ${pct}%` : 'Off. You will only see alerts in the app'}
              </Text>
            </View>
            <Switch value={field.value} onValueChange={field.onChange} accessibilityLabel="Email alerts" />
          </View>
        )}
      />
    </View>
  );
}
