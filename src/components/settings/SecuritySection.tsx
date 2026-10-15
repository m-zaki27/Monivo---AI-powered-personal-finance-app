import { router } from 'expo-router';
import { FileKey2, ShieldCheck, ShieldOff } from 'lucide-react-native';
import { useState } from 'react';

import { Dialog, useToast } from '@/components/ui';
import { useBackupCodesStatus, useDisableMfa } from '@/hooks';
import { useTheme } from '@/theme';

import { SettingsRow, SettingsSection } from './SettingsRow';

/** The MFA switch opens the setup flow and shows "on" only once verified; turning off confirms first. */
export function SecuritySection({ enabled }: { enabled: boolean }) {
  const { colors } = useTheme();
  const toast = useToast();
  const disable = useDisableMfa();
  const [confirmOff, setConfirmOff] = useState(false);
  const backup = useBackupCodesStatus();
  const backupValue = backup.data && !('missing' in backup.data) ? `${backup.data.remaining} left` : undefined;

  return (
    <>
      <SettingsSection title="Security">
        <SettingsRow
          icon={ShieldCheck}
          color={colors.income}
          label="Two-step verification"
          description={enabled ? 'On. You enter a code when you log in' : 'Add a code from an authenticator app'}
          toggle={{ value: enabled, onChange: (on) => (on ? router.push('/mfa-setup') : setConfirmOff(true)) }}
        />
        {enabled && (
          <SettingsRow
            icon={FileKey2}
            label="Backup codes"
            description="For when your phone isn't handy"
            value={backupValue}
            onPress={() => router.push('/backup-codes')}
          />
        )}
      </SettingsSection>

      <Dialog
        visible={confirmOff}
        tone="danger"
        icon={ShieldOff}
        title="Turn off two-step verification?"
        message="Your account will only be protected by your password, and your backup codes will stop working."
        confirmLabel="Turn off"
        loading={disable.isPending}
        onCancel={() => setConfirmOff(false)}
        onConfirm={() =>
          disable.mutate(undefined, {
            onSuccess: () => toast.show({ message: 'Two-step verification is off', tone: 'warning' }),
            onError: (e) => toast.show({ message: e.message, tone: 'error' }),
            onSettled: () => setConfirmOff(false),
          })
        }
      />
    </>
  );
}
