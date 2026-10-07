import { formatMoney, splitMoney, type Cents } from '@/lib/money';

import { Text, type TextProps } from './Text';

interface MoneyProps extends Omit<TextProps, 'children'> {
  cents: Cents;
  currency?: string;
  signed?: boolean;
  /** Colours by sign: positive = income (sky), negative = expense (rose) */
  colorBySign?: boolean;
  /** Render cents smaller and muted (for big balance displays) */
  splitCents?: boolean;
  hidden?: boolean;
  /** "$2,850" instead of "$2,850.00" for whole amounts */
  hideZeroCents?: boolean;
}

export function Money({
  cents,
  currency,
  signed,
  colorBySign,
  splitCents,
  hidden,
  hideZeroCents,
  variant = 'moneyMd',
  tone,
  ...rest
}: MoneyProps) {
  const resolvedTone = tone ?? (colorBySign ? (cents > 0 ? 'income' : cents < 0 ? 'expense' : 'default') : 'default');

  if (hidden) {
    return (
      <Text variant={variant} tone={resolvedTone} accessibilityLabel="Amount hidden" {...rest}>
        ••••••
      </Text>
    );
  }

  if (splitCents) {
    const { whole, fraction } = splitMoney(cents, currency);
    return (
      <Text variant={variant} tone={resolvedTone} {...rest}>
        {whole}
        <Text variant={variant} tone={resolvedTone} className="opacity-50">
          {fraction}
        </Text>
      </Text>
    );
  }

  return (
    <Text variant={variant} tone={resolvedTone} {...rest}>
      {formatMoney(cents, { currency, signed, hideZeroCents })}
    </Text>
  );
}
