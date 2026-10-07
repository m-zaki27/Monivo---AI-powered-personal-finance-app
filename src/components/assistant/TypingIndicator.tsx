import { useEffect } from 'react';
import { View } from 'react-native';
import { FadeIn, useAnimatedStyle, useSharedValue, withDelay, withRepeat, withSequence, withTiming } from 'react-native-reanimated';

import { AnimatedView } from '@/lib/animated';
import { useTheme } from '@/theme';

import { AssistantAvatar } from './ChatBubble';

/** Three dots that bob in turn while the assistant "thinks". */
export function TypingIndicator() {
  return (
    <AnimatedView entering={FadeIn} className="flex-row items-end gap-2" accessibilityLabel="Assistant is typing" accessibilityLiveRegion="polite">
      <AssistantAvatar />
      <View className="flex-row gap-1.5 rounded-card rounded-bl-sm border border-line bg-raised px-4 py-4">
        {[0, 1, 2].map((i) => (
          <Dot key={i} delay={i * 150} />
        ))}
      </View>
    </AnimatedView>
  );
}

function Dot({ delay }: { delay: number }) {
  const { colors } = useTheme();
  const y = useSharedValue(0);
  useEffect(() => {
    y.value = withDelay(delay, withRepeat(withSequence(withTiming(-4, { duration: 260 }), withTiming(0, { duration: 260 })), -1));
  }, [delay, y]);
  const style = useAnimatedStyle(() => ({ transform: [{ translateY: y.value }], opacity: 0.5 + (-y.value / 4) * 0.5 }));
  return <AnimatedView className="h-2 w-2 rounded-full" style={[{ backgroundColor: colors.muted }, style]} />;
}
