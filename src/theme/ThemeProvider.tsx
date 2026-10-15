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

// Themes as CSS variables, so wrapping a subtree in a scope re-themes it without `dark:` classes.
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
    '--color-glass': c.glass,
    '--color-glass-border': c.glassBorder,
  };
}

interface ThemeScopeProps extends ViewProps {
  scheme: ColorSchemeName;
  children: ReactNode;
}

/** Nestable (e.g. sheets re-apply it on web). */
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

  // Default to dark when the OS reports no preference.
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
