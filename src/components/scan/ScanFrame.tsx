import { StyleSheet, View, type ViewStyle } from 'react-native';

import { palette } from '@/theme';

const ARM = 36;
const THICK = 4;

/** Four rounded L-shaped corners marking where the receipt should go. */
export function ScanFrame({ color = palette.gold }: { color?: string }) {
  const corner = (pos: ViewStyle, borders: ViewStyle) => (
    <View
      style={[
        { position: 'absolute', width: ARM, height: ARM, borderColor: color, borderRadius: 4, ...pos },
        borders,
      ]}
    />
  );
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {corner({ top: 0, left: 0, borderTopLeftRadius: 20 }, { borderTopWidth: THICK, borderLeftWidth: THICK })}
      {corner({ top: 0, right: 0, borderTopRightRadius: 20 }, { borderTopWidth: THICK, borderRightWidth: THICK })}
      {corner({ bottom: 0, left: 0, borderBottomLeftRadius: 20 }, { borderBottomWidth: THICK, borderLeftWidth: THICK })}
      {corner({ bottom: 0, right: 0, borderBottomRightRadius: 20 }, { borderBottomWidth: THICK, borderRightWidth: THICK })}
    </View>
  );
}
