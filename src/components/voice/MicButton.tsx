import { LinearGradient } from 'expo-linear-gradient';
import { Mic, Square } from 'lucide-react-native';
import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { PressableScale } from '@/components/ui';
import { AnimatedView } from '@/lib/animated';
import { useTheme } from '@/theme';

const SIZE = 112;

interface MicButtonProps {
  listening: boolean;
  onPress: () => void;
  disabled?: boolean;
}

export function MicButton({ listening, onPress, disabled }: MicButtonProps) {
  const { gradients, colors } = useTheme();
  const reduceMotion = useReducedMotion();
  const pulse = useSharedValue(0);

  useEffect(() => {
    if (listening && !reduceMotion) {
      pulse.value = 0;
      pulse.value = withRepeat(withTiming(1, { duration: 1400, easing: Easing.out(Easing.quad) }), -1, false);
    } else {
      pulse.value = withTiming(0, { duration: 200 });
    }
  }, [listening, reduceMotion, pulse]);

  const ring = useAnimatedStyle(() => ({
    opacity: listening ? 0.5 * (1 - pulse.value) : 0,
    transform: [{ scale: 1 + pulse.value * 0.6 }],
  }));

  const Icon = listening ? Square : Mic;
  return (
    <View className="items-center justify-center" style={{ width: SIZE * 1.7, height: SIZE * 1.7 }}>
      <AnimatedView className="absolute rounded-full bg-gold" style={[{ width: SIZE, height: SIZE }, ring]} />
      <PressableScale
        onPress={onPress}
        disabled={disabled}
        haptic="press"
        scaleTo={0.92}
        accessibilityLabel={listening ? 'Stop listening' : 'Start speaking'}
        className="items-center justify-center overflow-hidden rounded-full"
        style={{ width: SIZE, height: SIZE, boxShadow: `0px 10px 32px ${gradients.goldGlow}`, opacity: disabled ? 0.5 : 1 }}
      >
        <LinearGradient colors={gradients.gold} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
        {/* View wrapper keeps the icon above the gradient on web. */}
        <View>
          <Icon size={listening ? 34 : 44} color={colors.onPrimary} fill={listening ? colors.onPrimary : 'transparent'} strokeWidth={2} />
        </View>
      </PressableScale>
    </View>
  );
}
