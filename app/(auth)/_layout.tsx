import { Stack } from 'expo-router';

import { useTheme } from '@/theme';

/** Signed-out screens. The first screen listed is where the guard sends people. */
export default function AuthLayout() {
  const { colors } = useTheme();
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }}>
      <Stack.Screen name="welcome" options={{ animation: 'fade' }} />
      <Stack.Screen name="sign-up" />
      <Stack.Screen name="log-in" />
      <Stack.Screen name="forgot-password" />
      <Stack.Screen name="verify" />
      <Stack.Screen name="reset-password" />
      <Stack.Screen name="mfa" />
    </Stack>
  );
}
