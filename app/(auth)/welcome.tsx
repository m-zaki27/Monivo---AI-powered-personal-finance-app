import { Redirect, router } from 'expo-router';
import { View } from 'react-native';
import { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { GradientMesh } from '@/components/auth';
import { Button, Logo, Text } from '@/components/ui';
import { useSession } from '@/hooks';
import { AnimatedView } from '@/lib/animated';

const enter = (i: number) => FadeInDown.duration(500).delay(120 + i * 90);

export default function WelcomeScreen() {
  const insets = useSafeAreaInsets();
  const { status } = useSession();
  // Reopening the app mid-login (password done, code not yet) resumes at the code screen.
  if (status === 'mfaRequired') return <Redirect href="/mfa" />;
  return (
    <View className="flex-1 bg-bg">
      <GradientMesh />
      <View className="flex-1 justify-between px-6" style={{ paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 }}>
        <AnimatedView entering={enter(0)}>
          <Logo size={40} withWordmark />
        </AnimatedView>

        <View className="gap-10">
          <View className="gap-4">
            <AnimatedView entering={enter(1)}>
              <Text style={{ fontSize: 44, lineHeight: 50, letterSpacing: -1.5 }} weight="extrabold">
                Know where{'\n'}your money{'\n'}
                <Text style={{ fontSize: 44, lineHeight: 50, letterSpacing: -1.5 }} weight="extrabold" tone="gold">
                  goes.
                </Text>
              </Text>
            </AnimatedView>
            <AnimatedView entering={enter(2)}>
              <Text tone="muted" className="max-w-[320px]">
                Track spending in seconds, stay on budget, and get a clear picture of every account.
              </Text>
            </AnimatedView>
          </View>

          <AnimatedView entering={enter(3)} className="gap-3">
            <Button title="Create account" onPress={() => router.push('/sign-up')} fullWidth />
            <Button title="Log in" variant="secondary" onPress={() => router.push('/log-in')} fullWidth />
            <Text variant="caption" tone="muted" center className="mt-2">
              By continuing you agree to our Terms and Privacy Policy.
            </Text>
          </AnimatedView>
        </View>
      </View>
    </View>
  );
}
