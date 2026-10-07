import { LinearGradient } from 'expo-linear-gradient';
import { Sparkles } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Image, View } from 'react-native';
import { Easing, useAnimatedStyle, useReducedMotion, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';

import { Text } from '@/components/ui';
import { AnimatedView } from '@/lib/animated';
import { withAlpha } from '@/lib/color';
import { useTheme } from '@/theme';

import { SampleReceipt } from './SampleReceipt';

const STEPS = ['Finding the total…', 'Reading the merchant…', 'Checking the date…', 'Picking a category…'];
const HEIGHT = 360;

/** The photo with a glowing line sweeping over it while the "AI" works. */
export function ScanningView({ photo }: { photo: string | null }) {
  const { colors } = useTheme();
  const reduceMotion = useReducedMotion();
  const y = useSharedValue(0);
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (!reduceMotion) y.value = withRepeat(withTiming(1, { duration: 1600, easing: Easing.inOut(Easing.quad) }), -1, true);
    const id = setInterval(() => setStep((s) => (s + 1) % STEPS.length), 900);
    return () => clearInterval(id);
  }, [reduceMotion, y]);

  const lineStyle = useAnimatedStyle(() => ({ transform: [{ translateY: y.value * (HEIGHT - 48) }] }));

  return (
    <View className="items-center gap-6">
      <View className="w-full overflow-hidden rounded-card border border-line" style={{ height: HEIGHT }}>
        {photo && photo !== 'sample' ? <Image source={{ uri: photo }} className="flex-1" resizeMode="cover" /> : <SampleReceipt />}
        <View className="absolute inset-0" style={{ backgroundColor: 'rgba(11,16,32,0.25)' }} />
        {/* The scan line: a soft cobalt glow with a bright core. */}
        <AnimatedView className="absolute inset-x-0 top-0 h-12" style={lineStyle}>
          <LinearGradient colors={['transparent', withAlpha(colors.secondary, 0.45), 'transparent']} style={{ flex: 1 }} />
          <View className="absolute inset-x-0 top-6 h-0.5" style={{ backgroundColor: colors.income, boxShadow: `0px 0px 12px ${colors.income}` }} />
        </AnimatedView>
      </View>
      <View className="items-center gap-2" accessibilityLiveRegion="polite">
        <View className="flex-row items-center gap-2">
          <Sparkles size={20} color={colors.primary} strokeWidth={2} />
          <Text variant="title">AI is reading your receipt</Text>
        </View>
        <Text variant="bodySm" tone="muted">
          {STEPS[step]}
        </Text>
      </View>
    </View>
  );
}
