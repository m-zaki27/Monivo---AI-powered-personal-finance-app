import { Switch as RNSwitch, type SwitchProps } from 'react-native';

import { haptics } from '@/lib/haptics';
import { useTheme } from '@/theme/useTheme';

/** Native switch, tinted cobalt when on. */
export function Switch({ onValueChange, ...rest }: SwitchProps) {
  const { colors, palette } = useTheme();
  return (
    <RNSwitch
      trackColor={{ false: colors.raised, true: colors.secondary }}
      thumbColor={palette.white}
      // react-native-web ignores thumbColor when on and uses its own teal
      // (`activeThumbColor`), which isn't in RN's types, hence the cast.
      {...({ activeThumbColor: palette.white } as object)}
      ios_backgroundColor={colors.raised}
      onValueChange={(v) => {
        haptics.select();
        onValueChange?.(v);
      }}
      {...rest}
    />
  );
}
