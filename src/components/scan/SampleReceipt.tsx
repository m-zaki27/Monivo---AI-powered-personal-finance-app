import { View } from 'react-native';

import { palette } from '@/theme';

/**
 * A drawn receipt (grey lines on white) standing in for a photo on web and
 * simulators, which have no camera. Purely decorative.
 */
export function SampleReceipt() {
  const line = (w: `${number}%`, h = 6, strong = false) => (
    <View style={{ width: w, height: h, borderRadius: 3, backgroundColor: strong ? 'rgba(14,22,48,0.55)' : 'rgba(14,22,48,0.18)' }} />
  );
  return (
    <View accessibilityElementsHidden className="flex-1 gap-3 p-6" style={{ backgroundColor: palette.white }}>
      <View className="items-center gap-2 pb-2">
        {line('55%', 10, true)}
        {line('40%')}
      </View>
      {Array.from({ length: 7 }, (_, i) => (
        <View key={i} className="flex-row justify-between">
          {line(`${40 + ((i * 17) % 25)}%` as `${number}%`)}
          {line('16%')}
        </View>
      ))}
      <View className="my-2 h-px" style={{ backgroundColor: 'rgba(14,22,48,0.2)' }} />
      <View className="flex-row justify-between">
        {line('30%', 9, true)}
        {line('22%', 9, true)}
      </View>
    </View>
  );
}
