import { View } from 'react-native';
import { FadeInDown } from 'react-native-reanimated';

import { LogoMark, PressableScale, Text } from '@/components/ui';
import { AnimatedView } from '@/lib/animated';
import { useTheme } from '@/theme';

/** Empty state: a short hello and the starter questions as big tappable rows. */
export function AssistantWelcome({ name, prompts, onPick }: { name?: string; prompts: string[]; onPick: (p: string) => void }) {
  const { gradients } = useTheme();
  return (
    <View className="flex-1 justify-center gap-8 px-6">
      <AnimatedView entering={FadeInDown.duration(400)} className="items-center gap-4">
        <View className="h-16 w-16 items-center justify-center rounded-full bg-midnight" style={{ boxShadow: `0px 8px 24px ${gradients.goldGlow}` }}>
          <LogoMark size={32} />
        </View>
        <Text variant="h2" center>
          Hi{name ? ` ${name}` : ''}, what do you want to know?
        </Text>
        <Text tone="muted" center>
          Ask about spending, your budget or subscriptions. I'll answer from your own numbers.
        </Text>
      </AnimatedView>
      <View className="gap-2">
        {prompts.map((p, i) => (
          <AnimatedView key={p} entering={FadeInDown.duration(400).delay(100 + i * 60)}>
            <PressableScale onPress={() => onPick(p)} scaleTo={0.98} accessibilityLabel={p} className="min-h-12 justify-center rounded-input border border-line bg-surface px-4 py-3">
              <Text weight="semibold">{p}</Text>
            </PressableScale>
          </AnimatedView>
        ))}
      </View>
    </View>
  );
}
