/**
 * Monivo design tokens — the single source of truth for every visual value.
 * tailwind.config.js imports this file, and useTheme() exposes it to JS
 * (SVG, charts, gradients) where class names can't reach.
 */

export const palette = {
  midnight: '#0B1020',
  navy: '#0E1630',
  navySurface: '#131A2E',
  navyRaised: '#1C2540',
  ivory: '#FBF8F1',
  ivoryRaised: '#F3EFE6',
  white: '#FFFFFF',
  ink: '#14182B',
  cream: '#F4F1EA',
  gold: '#F5B83D',
  goldLight: '#FFD37A',
  goldDeep: '#E39B1B',
  cobalt: '#2F6BFF',
  sky: '#3BC9F5',
  rose: '#FF4D79',
  amber: '#FF9F1C',
} as const;

export type ColorSchemeName = 'light' | 'dark';

export interface ThemeColors {
  bg: string;
  surface: string;
  raised: string;
  border: string;
  text: string;
  muted: string;
  /** Overlay behind sheets/dialogs */
  scrim: string;
  /** Tab bar fill (used on top of / instead of blur) */
  tabBar: string;
  /** Primary-coloured logo mark (gold on dark, navy on light) */
  logo: string;
  /** Shadow tint */
  shadow: string;
}

export const themes: Record<ColorSchemeName, ThemeColors> = {
  dark: {
    bg: palette.midnight,
    surface: palette.navySurface,
    raised: palette.navyRaised,
    border: 'rgba(255,255,255,0.08)',
    text: palette.cream,
    muted: '#8C95B0',
    scrim: 'rgba(5,8,18,0.6)',
    tabBar: 'rgba(19,26,46,0.78)',
    logo: palette.gold,
    shadow: 'rgba(0,4,16,0.55)',
  },
  light: {
    bg: palette.ivory,
    surface: palette.white,
    raised: palette.ivoryRaised,
    border: 'rgba(20,24,43,0.08)',
    text: palette.ink,
    muted: '#6B7390',
    scrim: 'rgba(20,24,43,0.35)',
    tabBar: 'rgba(255,255,255,0.82)',
    logo: palette.navy,
    shadow: 'rgba(47,60,110,0.14)',
  },
};

/** Accents are the same in both themes. */
export const accents = {
  primary: palette.gold,
  onPrimary: palette.midnight,
  secondary: palette.cobalt,
  income: palette.sky,
  expense: palette.rose,
  warning: palette.amber,
} as const;

export const gradients = {
  hero: [palette.cobalt, palette.navy] as const,
  heroGlow: 'rgba(245,184,61,0.38)',
  gold: [palette.goldLight, palette.gold, palette.goldDeep] as const,
  goldGlow: 'rgba(245,184,61,0.45)',
} as const;

/**
 * Category colours. Chosen from the brand hues plus a few neighbours
 * (pink, teal, orange, tan) — no purple, violet, emerald, slate or coral.
 */
export const categoryColors = {
  cobalt: palette.cobalt,
  sky: palette.sky,
  rose: palette.rose,
  amber: palette.amber,
  gold: palette.gold,
  pink: '#FF7AB8',
  teal: '#17B7C9',
  orange: '#F2702C',
  tan: '#C79A68',
  steel: '#6F8CC9',
} as const;
export type CategoryColor = keyof typeof categoryColors;

/** 8px grid. Half-step (4) is allowed for tight icon/text gaps only. */
export const spacing = {
  half: 4,
  xs: 8,
  sm: 16,
  md: 24,
  lg: 32,
  xl: 40,
  xxl: 48,
} as const;

export const radius = {
  sm: 12,
  input: 16,
  chip: 16,
  card: 24,
  sheet: 32,
  pill: 999,
} as const;

export const fonts = {
  regular: 'PlusJakartaSans_400Regular',
  medium: 'PlusJakartaSans_500Medium',
  semibold: 'PlusJakartaSans_600SemiBold',
  bold: 'PlusJakartaSans_700Bold',
  extrabold: 'PlusJakartaSans_800ExtraBold',
  numMedium: 'SpaceGrotesk_500Medium',
  numBold: 'SpaceGrotesk_700Bold',
} as const;

/** [fontSize, lineHeight, letterSpacing] */
export const typeScale = {
  balanceXl: [56, 60, -2],
  balance: [44, 50, -1.5],
  moneyLg: [28, 34, -0.8],
  moneyMd: [20, 26, -0.4],
  moneySm: [16, 22, -0.2],
  h1: [30, 38, -0.6],
  h2: [24, 30, -0.4],
  title: [18, 24, -0.2],
  body: [16, 24, 0],
  bodySm: [14, 20, 0],
  caption: [12, 16, 0.2],
  overline: [11, 14, 1.2],
} as const;

export const shadows = {
  /** Uses RN's cross-platform boxShadow so the tint shows on Android too. */
  card: (tint: string) => `0px 8px 24px ${tint}`,
  raised: (tint: string) => `0px 12px 32px ${tint}`,
  glow: (tint: string) => `0px 6px 20px ${tint}`,
} as const;

export const motion = {
  pressScale: 0.96,
  fast: 150,
  base: 240,
  slow: 400,
  spring: { damping: 18, stiffness: 220, mass: 0.9 },
} as const;

export const hitSlop = 44;
