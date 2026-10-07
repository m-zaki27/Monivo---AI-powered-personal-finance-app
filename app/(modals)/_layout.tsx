import { Stack } from 'expo-router';

import { useTheme } from '@/theme';

/** Flows that slide up over the tabs (add transaction, edit account, settings…). */
export default function ModalsLayout() {
  const { colors } = useTheme();
  return <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }} />;
}
