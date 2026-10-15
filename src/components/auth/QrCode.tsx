import { View } from 'react-native';
import { SvgXml } from 'react-native-svg';

/** Supabase's QR SVG, always on white: scanners need dark-on-light. */
export function QrCode({ svg, size = 200 }: { svg: string; size?: number }) {
  return (
    <View
      accessibilityRole="image"
      accessibilityLabel="QR code for your authenticator app"
      className="items-center justify-center self-center rounded-card bg-white p-4"
    >
      <SvgXml xml={svg} width={size} height={size} />
    </View>
  );
}
