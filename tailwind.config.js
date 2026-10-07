// Tailwind 3 loads its config through `jiti`, which can require TypeScript,
// so the tokens file stays the single source of truth.
const { accents, palette, radius, fonts, categoryColors } = require('./src/theme/tokens.ts');

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{ts,tsx}', './src/**/*.{ts,tsx}'],
  presets: [require('nativewind/preset')],
  // NativeWind's web runtime calls colorScheme.set() on load, which throws under
  // the default 'media' mode. Theming is driven by <ThemeScope> vars, not `dark:`.
  darkMode: 'class',
  theme: {
    // Replacing (not extending) the palette means off-brand colours such as
    // purple-500 or slate-400 simply don't exist as classes.
    colors: {
      transparent: 'transparent',
      white: '#FFFFFF',
      black: '#000000',
      // Theme-dependent — values come from CSS variables set by <ThemeScope>.
      bg: 'var(--color-bg)',
      surface: 'var(--color-surface)',
      raised: 'var(--color-raised)',
      line: 'var(--color-border)',
      ink: 'var(--color-text)',
      muted: 'var(--color-muted)',
      scrim: 'var(--color-scrim)',
      // Accents — identical in both themes.
      gold: accents.primary,
      'on-gold': accents.onPrimary,
      cobalt: accents.secondary,
      sky: accents.income,
      rose: accents.expense,
      amber: accents.warning,
      navy: palette.navy,
      midnight: palette.midnight,
      cream: palette.cream,
      ...categoryColors,
    },
    borderRadius: {
      none: '0px',
      sm: `${radius.sm}px`,
      input: `${radius.input}px`,
      chip: `${radius.chip}px`,
      card: `${radius.card}px`,
      sheet: `${radius.sheet}px`,
      full: '9999px',
    },
    fontFamily: {
      sans: [fonts.medium],
      regular: [fonts.regular],
      medium: [fonts.medium],
      semibold: [fonts.semibold],
      bold: [fonts.bold],
      extrabold: [fonts.extrabold],
      num: [fonts.numMedium],
      'num-bold': [fonts.numBold],
    },
    extend: {},
  },
  plugins: [],
};
