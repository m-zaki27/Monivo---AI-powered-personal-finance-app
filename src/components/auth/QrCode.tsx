import { View } from 'react-native';
import { SvgXml } from 'react-native-svg';

/**
 * Renders the QR code Supabase generates (SVG markup) for authenticator apps.
 * Always on a white card, even in dark mode: scanners need dark-on-light.
 */
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
