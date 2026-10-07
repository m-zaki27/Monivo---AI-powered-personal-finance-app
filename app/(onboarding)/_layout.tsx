import { Stack } from 'expo-router';

import { useTheme } from '@/theme';

export default function OnboardingLayout() {
  const { colors } = useTheme();
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }}>
      <Stack.Screen name="currency" />
      <Stack.Screen name="balance" />
      {/* No swipe-back from the finish line. */}
      <Stack.Screen name="done" options={{ gestureEnabled: false, animation: 'fade' }} />
    </Stack>
  );
}
