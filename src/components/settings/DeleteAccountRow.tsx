import { Trash2, UserX } from 'lucide-react-native';
import { useState } from 'react';

import { Dialog, useToast } from '@/components/ui';
import { useDeleteMyAccount } from '@/hooks';

import { SettingsRow } from './SettingsRow';

/**
 * Both app stores require an in-app way to delete your account. After it
 * succeeds the session is gone, so the route guards return to Welcome.
 */
export function DeleteAccountRow() {
  const toast = useToast();
  const remove = useDeleteMyAccount();
  const [confirming, setConfirming] = useState(false);

  return (
    <>
      <SettingsRow icon={UserX} label="Delete account" destructive onPress={() => setConfirming(true)} />
      <Dialog
        visible={confirming}
        tone="danger"
        icon={Trash2}
        title="Delete your Monivo account?"
        message="This permanently deletes your account and everything in it. It can't be undone."
        confirmLabel="Delete my account"
        loading={remove.isPending}
        onCancel={() => setConfirming(false)}
        onConfirm={() =>
          remove.mutate(undefined, {
            onSuccess: () => toast.show({ message: 'Your account was deleted', tone: 'success' }),
            onError: (e) => toast.show({ message: e.message, tone: 'error' }),
            onSettled: () => setConfirming(false),
          })
        }
      />
    </>
  );
}
