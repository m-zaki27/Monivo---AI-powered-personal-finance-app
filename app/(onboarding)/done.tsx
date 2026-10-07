import { Check } from 'lucide-react-native';
import { useEffect } from 'react';
import { View } from 'react-native';
import { FadeInDown, ZoomIn } from 'react-native-reanimated';

import { Confetti, OnboardingFrame } from '@/components/onboarding';
import { Button, Text } from '@/components/ui';
import { useMe, useSession } from '@/hooks';
import { AnimatedView } from '@/lib/animated';
import { haptics } from '@/lib/haptics';
import { useTheme } from '@/theme';

export default function DoneStep() {
  const { colors, gradients } = useTheme();
  const { completeOnboarding } = useSession();
  const me = useMe();

  useEffect(() => {
    haptics.success();
  }, []);

  return (
    <View className="flex-1">
      <OnboardingFrame
        step={4}
        noBack
        // Flipping `onboarded` is all it takes: the root guard swaps in the tabs.
        footer={<Button title="Go to dashboard" onPress={completeOnboarding} fullWidth />}
      >
        <View className="flex-1 items-center justify-center gap-6">
          <AnimatedView
            entering={ZoomIn.springify().damping(12).delay(150)}
            className="h-28 w-28 items-center justify-center rounded-full bg-gold"
            style={{ boxShadow: `0px 12px 40px ${gradients.goldGlow}` }}
          >
            <Check size={52} color={colors.onPrimary} strokeWidth={3} />
          </AnimatedView>
          <AnimatedView entering={FadeInDown.duration(400).delay(350)} className="items-center gap-3">
            <Text variant="h1" center>
              You're all set{me.data?.firstName ? `, ${me.data.firstName}` : ''}
            </Text>
            <Text tone="muted" center className="max-w-[300px]">
              Your money, in one calm place. Let's see where it's going.
            </Text>
          </AnimatedView>
        </View>
      </OnboardingFrame>
      <Confetti />
    </View>
  );
}
