import { useContext, useMemo } from 'react';

import { PreferenceContext, SchemeContext } from './ThemeProvider';
import { accents, gradients, palette, shadows, themes } from './tokens';

/**
 * Raw token values for the current scope. Use classes for normal styling;
 * reach for this when a prop needs a real colour string (icons, SVG, charts,
 * gradients, shadows).
 */
export function useTheme() {
  const scheme = useContext(SchemeContext);
  const { preference, setPreference } = useContext(PreferenceContext);

  return useMemo(() => {
    const colors = { ...themes[scheme], ...accents };
    return {
      scheme,
      isDark: scheme === 'dark',
      colors,
      palette,
      gradients,
      shadow: {
        card: shadows.card(colors.shadow),
        raised: shadows.raised(colors.shadow),
      },
      preference,
      setPreference,
    };
  }, [scheme, preference, setPreference]);
}

export type Theme = ReturnType<typeof useTheme>;
