import '../global.css';
import '@/lib/animated';

import {
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
  PlusJakartaSans_800ExtraBold,
} from '@expo-google-fonts/plus-jakarta-sans';
import { SpaceGrotesk_500Medium, SpaceGrotesk_700Bold } from '@expo-google-fonts/space-grotesk';
import { QueryClientProvider } from '@tanstack/react-query';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { LogBox } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { ToastProvider } from '@/components/ui';
import { queryClient } from '@/hooks/queryClient';
import { SessionProvider, useSession } from '@/hooks/useSession';
import { ThemeProvider, useTheme } from '@/theme';

// Dev-only React Native warning on Android: a touch that *started* outside the
// JS responder system (e.g. Expo Go's floating Tools button or a native gesture)
// and *ended* on the app. Harmless, and LogBox doesn't exist in release builds.
LogBox.ignoreLogs(['Cannot record touch end without a touch start']);

// Keep the native splash up until fonts are ready — avoids a flash of system font.
SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
    PlusJakartaSans_800ExtraBold,
    SpaceGrotesk_500Medium,
    SpaceGrotesk_700Bold,
  });
  if (!fontsLoaded && !fontError) return null;

  // Provider order: gestures + safe areas are native-level, then data (and the
  // session, which clears data on sign-out), then theme, then toasts (which
  // need theme + safe areas to render).
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <SessionProvider>
            <ThemeProvider>
              <ToastProvider>
                <RootStack />
              </ToastProvider>
            </ThemeProvider>
          </SessionProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

function RootStack() {
  const { colors, isDark } = useTheme();
  const { session, isHydrated } = useSession();
  const signedIn = !!session;
  const onboarded = !!session?.onboarded;

  // Keep the splash up until we know which group to show — no flash of Welcome
  // for someone who is already signed in.
  useEffect(() => {
    if (isHydrated) SplashScreen.hideAsync().catch(() => {});
  }, [isHydrated]);

  if (!isHydrated) return null;

  /*
   * Route guards. Exactly one group is reachable at a time; when the session
   * changes, the router drops the now-forbidden screens from history and shows
   * the first allowed screen. So screens never navigate "to the dashboard"
   * after login — they update the session and the guards do the rest.
   */
  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerShown: false,
          // Matching the background prevents a white flash during transitions.
          contentStyle: { backgroundColor: colors.bg },
          animation: 'slide_from_right',
        }}
      >
        <Stack.Protected guard={signedIn && onboarded}>
          <Stack.Screen name="(tabs)" options={{ animation: 'fade' }} />
          <Stack.Screen name="(modals)" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
        </Stack.Protected>
        <Stack.Protected guard={signedIn && !onboarded}>
          <Stack.Screen name="(onboarding)" options={{ animation: 'fade' }} />
        </Stack.Protected>
        <Stack.Protected guard={!signedIn}>
          <Stack.Screen name="(auth)" options={{ animation: 'fade' }} />
        </Stack.Protected>
        {/* Dev gallery stays reachable in every state. */}
        <Stack.Screen name="dev" />
      </Stack>
    </>
  );
}
