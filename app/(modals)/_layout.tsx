import { Stack } from 'expo-router';

import { DraftsProvider } from '@/components/add';
import { useTheme } from '@/theme';

/** Flows that slide up over the tabs (add transaction, security…). */
export default function ModalsLayout() {
  const { colors } = useTheme();
  return (
    <DraftsProvider>
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }}>
        {/* Black behind the camera so the preview never flashes the theme background. */}
        <Stack.Screen name="scan" options={{ contentStyle: { backgroundColor: '#000' } }} />
        <Stack.Screen name="scan-review" options={{ gestureEnabled: false }} />
      </Stack>
    </DraftsProvider>
  );
}
