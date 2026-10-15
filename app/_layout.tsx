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
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { LogBox } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { OfflineBanner } from '@/components/OfflineBanner';
import { SetupNeeded } from '@/components/SetupNeeded';
import { ToastProvider } from '@/components/ui';
import { persistOptions, queryClient } from '@/hooks/queryClient';
import { SessionProvider, useSession } from '@/hooks/useSession';
import { isSupabaseConfigured } from '@/lib/supabase';
import { ThemeProvider, useTheme } from '@/theme';

// Harmless dev-only Android warning when a touch starts outside JS (e.g. Expo Go's Tools button).
LogBox.ignoreLogs(['Cannot record touch end without a touch start', 'Ended a touch event which was not counted in `trackedTouchCount`']);

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

  // Order matters: session clears query data on sign-out; toasts need theme + safe areas.
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <PersistQueryClientProvider client={queryClient} persistOptions={persistOptions}>
          <SessionProvider>
            <ThemeProvider>
              <ToastProvider>
                <RootStack />
              </ToastProvider>
            </ThemeProvider>
          </SessionProvider>
        </PersistQueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

function RootStack() {
  const { colors, isDark } = useTheme();
  const { status, onboarded, isHydrated } = useSession();
  // Two-step-pending and mid-password-reset users stay in the auth group until they finish.
  const signedIn = status === 'signedIn';

  // Keep the splash until the session is known, so signed-in users never see Welcome flash.
  useEffect(() => {
    if (isHydrated) SplashScreen.hideAsync().catch(() => {});
  }, [isHydrated]);

  if (!isHydrated) return null;
  if (!isSupabaseConfigured) return <SetupNeeded />;

  // Route guards: one group reachable at a time. Screens update the session
  // instead of navigating; the router then shows the first allowed screen.
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
      </Stack>
      <OfflineBanner />
    </>
  );
}
