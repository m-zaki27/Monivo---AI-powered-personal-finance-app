import { Tabs } from 'expo-router';

import { TabBar } from '@/components/navigation/TabBar';
import { useTheme } from '@/theme';

export default function TabsLayout() {
  const { colors } = useTheme();
  return (
    <Tabs
      tabBar={(props) => <TabBar {...props} />}
      // 'shift': the new tab slides in while the old one fades.
      screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: colors.bg }, animation: 'shift' }}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="transactions" />
      {/* Placeholder route: the custom tab bar opens a sheet instead of navigating here. */}
      <Tabs.Screen name="add" />
      <Tabs.Screen name="accounts" />
      <Tabs.Screen name="assistant" />
    </Tabs>
  );
}
