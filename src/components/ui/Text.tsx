import { Text as RNText, type TextProps as RNTextProps, type TextStyle } from 'react-native';

import { cn } from '@/lib/cn';
import { typeScale } from '@/theme/tokens';

type Scale = keyof typeof typeScale;

const variantFont: Record<Scale, string> = {
  balanceXl: 'font-num-bold',
  balance: 'font-num-bold',
  moneyLg: 'font-num-bold',
  moneyMd: 'font-num-bold',
  moneySm: 'font-num-bold',
  h1: 'font-extrabold',
  h2: 'font-bold',
  title: 'font-bold',
  body: 'font-medium',
  bodySm: 'font-medium',
  caption: 'font-semibold',
  overline: 'font-bold uppercase',
};

// Full class strings (never `font-${x}`): Tailwind finds classes by scanning
// source text, so dynamically built names would silently be missing.
const weights = {
  regular: 'font-regular',
  medium: 'font-medium',
  semibold: 'font-semibold',
  bold: 'font-bold',
  extrabold: 'font-extrabold',
} as const;

const tones = {
  default: 'text-ink',
  muted: 'text-muted',
  gold: 'text-gold',
  cobalt: 'text-cobalt',
  income: 'text-sky',
  expense: 'text-rose',
  warning: 'text-amber',
  onGold: 'text-on-gold',
  white: 'text-white',
} as const;

export type TextTone = keyof typeof tones;
export type TextVariant = Scale;

export interface TextProps extends RNTextProps {
  variant?: TextVariant;
  tone?: TextTone;
  /** Override weight for body text, e.g. 'semibold' */
  weight?: keyof typeof weights;
  center?: boolean;
  className?: string;
}

const isNumeric = (v: Scale) => v.startsWith('money') || v.startsWith('balance');

/** All app text goes through this — it picks the font file, size and colour. */
export function Text({ variant = 'body', tone = 'default', weight, center, className, style, ...rest }: TextProps) {
  const [fontSize, lineHeight, letterSpacing] = typeScale[variant];
  const scaleStyle: TextStyle = {
    fontSize,
    lineHeight,
    letterSpacing,
    // Tabular figures keep digits the same width, so totals don't "wiggle".
    ...(isNumeric(variant) && { fontVariant: ['tabular-nums'] }),
  };
  return (
    <RNText
      maxFontSizeMultiplier={isNumeric(variant) ? 1.2 : 1.5}
      className={cn(weight ? weights[weight] : variantFont[variant], tones[tone], center && 'text-center', className)}
      style={[scaleStyle, style]}
      {...rest}
    />
  );
}
