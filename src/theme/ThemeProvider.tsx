import AsyncStorage from '@react-native-async-storage/async-storage';
import { vars } from 'nativewind';
import { createContext, useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useColorScheme, View, type ViewProps } from 'react-native';

import { themes, type ColorSchemeName } from './tokens';

export type ThemePreference = 'system' | 'light' | 'dark';

const STORAGE_KEY = 'monivo.themePreference';

interface PreferenceContextValue {
  preference: ThemePreference;
  setPreference: (p: ThemePreference) => void;
}

export const PreferenceContext = createContext<PreferenceContextValue>({
  preference: 'system',
  setPreference: () => {},
});

/** The resolved scheme for the nearest <ThemeScope>. */
export const SchemeContext = createContext<ColorSchemeName>('dark');

/**
 * NativeWind `vars()` turns each theme into CSS variables. Tailwind classes such
 * as `bg-surface` read `var(--color-surface)`, so a subtree flips theme just by
 * being wrapped in a different scope — no `dark:` prefix on every class.
 */
const schemeVars: Record<ColorSchemeName, ReturnType<typeof vars>> = {
  dark: vars(toVars(themes.dark)),
  light: vars(toVars(themes.light)),
};

function toVars(c: (typeof themes)['dark']) {
  return {
    '--color-bg': c.bg,
    '--color-surface': c.surface,
    '--color-raised': c.raised,
    '--color-border': c.border,
    '--color-text': c.text,
    '--color-muted': c.muted,
    '--color-scrim': c.scrim,
  };
}

interface ThemeScopeProps extends ViewProps {
  scheme: ColorSchemeName;
  children: ReactNode;
}

/** Applies a theme to everything inside it. Nestable (the /dev screen shows both). */
export function ThemeScope({ scheme, style, children, ...rest }: ThemeScopeProps) {
  return (
    <SchemeContext.Provider value={scheme}>
      <View {...rest} style={[schemeVars[scheme], style]}>
        {children}
      </View>
    </SchemeContext.Provider>
  );
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const system = useColorScheme();
  const [preference, setPreferenceState] = useState<ThemePreference>('system');

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((v) => {
        if (v === 'light' || v === 'dark' || v === 'system') setPreferenceState(v);
      })
      .catch(() => {});
  }, []);

  const setPreference = useCallback((p: ThemePreference) => {
    setPreferenceState(p);
    AsyncStorage.setItem(STORAGE_KEY, p).catch(() => {});
  }, []);

  // Dark is the hero: if the OS gives no answer, fall back to dark.
  const scheme: ColorSchemeName =
    preference === 'system' ? (system === 'light' ? 'light' : 'dark') : preference;

  const value = useMemo(() => ({ preference, setPreference }), [preference, setPreference]);

  return (
    <PreferenceContext.Provider value={value}>
      <ThemeScope scheme={scheme} className="flex-1 bg-bg">
        {children}
      </ThemeScope>
    </PreferenceContext.Provider>
  );
}
