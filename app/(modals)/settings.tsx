import Constants from 'expo-constants';
import { router } from 'expo-router';
import { Bell, Coins, Download, LogOut, Mail, Palette, Target } from 'lucide-react-native';
import { useState } from 'react';
import { View } from 'react-native';

import { ProfileCard, SecuritySection, SettingsRow, SettingsSection, useExportAll } from '@/components/settings';
import { Dialog, Header, Screen, SegmentedControl, Text } from '@/components/ui';
import { useBudget, useCurrency, useMe, useSession, useUpdateMe } from '@/hooks';
import { withAlpha } from '@/lib/color';
import { findCurrency } from '@/lib/currencies';
import { useTheme, type ThemePreference } from '@/theme';

export default function SettingsScreen() {
  const { colors, palette, preference, setPreference } = useTheme();
  const me = useMe();
  const user = me.data;
  const budget = useBudget();
  const currency = useCurrency();
  const updateMe = useUpdateMe();
  const { signOut } = useSession();
  const { exportAll, exporting } = useExportAll(currency);
  const [confirmLogout, setConfirmLogout] = useState(false);
  const cur = findCurrency(currency);

  const setNotification = (key: 'push' | 'weeklyRecap', value: boolean) =>
    user && updateMe.mutate({ notifications: { ...user.notifications, [key]: value } });

  return (
    <Screen scroll header={<Header title="Settings" leading="close" />} contentClassName="gap-6 pt-4">
      <ProfileCard user={user} onPress={() => router.push('/profile')} />

      <SettingsSection title="Preferences">
        <SettingsRow icon={Coins} color={palette.gold} label="Currency" value={`${cur.flag} ${cur.code}`} onPress={() => router.push('/settings-currency')} />
        <View className="gap-3 px-4 py-3">
          <View className="flex-row items-center gap-3">
            <View className="h-9 w-9 items-center justify-center rounded-full" style={{ backgroundColor: withAlpha(colors.secondary, 0.14) }}>
              <Palette size={18} color={colors.secondary} />
            </View>
            <Text weight="semibold">Appearance</Text>
          </View>
          <SegmentedControl<ThemePreference>
            accessibilityLabel="Appearance"
            value={preference}
            onChange={setPreference}
            segments={[
              { value: 'system', label: 'System' },
              { value: 'light', label: 'Light' },
              { value: 'dark', label: 'Dark' },
            ]}
          />
        </View>
      </SettingsSection>

      <SecuritySection enabled={!!user?.mfaEnabled} />

      <SettingsSection title="Notifications">
        <SettingsRow
          icon={Bell}
          label="Push notifications"
          description="Budget warnings and big expenses"
          toggle={{ value: !!user?.notifications.push, onChange: (v) => setNotification('push', v), disabled: !user }}
        />
        <SettingsRow
          icon={Mail}
          label="Weekly recap email"
          description="Your top categories and a tip, every Monday"
          toggle={{ value: !!user?.notifications.weeklyRecap, onChange: (v) => setNotification('weeklyRecap', v), disabled: !user }}
        />
        <SettingsRow
          icon={Target}
          color={colors.warning}
          label="Budget alerts"
          value={budget.data ? (budget.data.emailAlerts ? `Email at ${Math.round(budget.data.alertThreshold * 100)}%` : 'Email off') : undefined}
          onPress={() => router.push('/budget')}
        />
      </SettingsSection>

      <SettingsSection title="Data">
        <SettingsRow
          icon={Download}
          label={exporting ? 'Preparing export…' : 'Export all transactions'}
          description="A CSV you can open in any spreadsheet"
          onPress={exporting ? undefined : exportAll}
        />
        <SettingsRow icon={LogOut} label="Log out" destructive onPress={() => setConfirmLogout(true)} />
      </SettingsSection>

      <Text variant="caption" tone="muted" center className="pb-2">
        Monivo {Constants.expoConfig?.version ?? ''}
      </Text>

      <Dialog
        visible={confirmLogout}
        icon={LogOut}
        title="Log out of Monivo?"
        message="Your data stays safe. You'll need your password (and code, if two-step is on) to come back."
        confirmLabel="Log out"
        onCancel={() => setConfirmLogout(false)}
        onConfirm={() => {
          setConfirmLogout(false);
          // The route guards take it from here: signed out → Welcome.
          signOut();
        }}
      />
    </Screen>
  );
}
