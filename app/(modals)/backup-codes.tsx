import { router, useLocalSearchParams } from 'expo-router';
import { FileKey2, RefreshCw, Share2 } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Share, View } from 'react-native';

import { AuthScaffold, BackupCodeGrid, BackupCodeGridSkeleton, CopyButton } from '@/components/auth';
import { Button, Card, Dialog, EmptyState, ErrorState, Text, useToast } from '@/components/ui';
import { useBackupCodesStatus, useNewBackupCodes, useRegenerateBackupCodes } from '@/hooks';
import { closeModal } from '@/lib/navigation';

/**
 * Two modes. Straight after generating, the codes themselves (shown once, never
 * again: the server only keeps hashes). Any other time, how many are left, plus
 * a way to replace the whole set.
 */
export default function BackupCodesScreen() {
  const { fromSetup } = useLocalSearchParams<{ fromSetup?: string }>();
  const fresh = useNewBackupCodes();
  const status = useBackupCodesStatus();
  const regenerate = useRegenerateBackupCodes();
  const toast = useToast();
  const [confirmNew, setConfirmNew] = useState(false);
  const codes = fresh.data?.codes ?? null;
  const notEnabled = fresh.data?.codes === null;

  useEffect(() => {
    if (fromSetup) toast.show({ message: 'Two-step verification is on', tone: 'success' });
  }, [fromSetup, toast]);

  const text = (codes ?? []).join('\n');
  const share = async () => {
    try {
      await Share.share({ message: `Monivo backup codes (each works once):\n\n${text}` });
    } catch {
      toast.show({ message: "Sharing isn't available here. Copy the codes instead.", tone: 'warning' });
    }
  };

  const newSet = () =>
    regenerate.mutate(undefined, {
      onSuccess: () => setConfirmNew(false),
      onError: (e) => {
        setConfirmNew(false);
        toast.show({ message: e.message, tone: 'error' });
      },
    });

  return (
    <AuthScaffold
      leading="close"
      icon={FileKey2}
      title={codes ? 'Save your backup codes' : 'Backup codes'}
      subtitle={
        codes
          ? "If you lose your phone, each code lets you log in once. We can't show them again, so save them now, e.g. in a password manager."
          : 'Use one to log in if your authenticator app is unavailable. Each code works once.'
      }
      footer={codes ? <Button title="I've saved them" onPress={closeModal} fullWidth /> : undefined}
    >
      {codes ? (
        <>
          <BackupCodeGrid codes={codes} />
          <View className="flex-row gap-3">
            <CopyButton value={text} label="Copy all" copiedMessage="Backup codes copied" />
            <Button title="Share" leftIcon={Share2} variant="secondary" size="sm" onPress={share} />
          </View>
        </>
      ) : notEnabled ? (
        <EmptyState
          icon={FileKey2}
          title="Backup codes aren't available yet"
          message="Two-step verification is on and working. Backup codes aren't enabled on this Monivo server yet."
        />
      ) : status.isPending ? (
        <BackupCodeGridSkeleton />
      ) : status.isError ? (
        <ErrorState error={status.error} onRetry={() => status.refetch()} />
      ) : 'missing' in status.data ? (
        <EmptyState
          icon={FileKey2}
          title="No backup codes yet"
          message="Create a set so you can still get in if you lose your phone."
          actionLabel="Create backup codes"
          onAction={newSet}
        />
      ) : (
        <Card className="gap-4">
          <Text variant="moneyLg">
            {status.data.remaining} of {status.data.total}
          </Text>
          <Text tone="muted">codes left. Running low? Get a new set: the old codes stop working right away.</Text>
          <Button title="Get new codes" leftIcon={RefreshCw} variant="secondary" onPress={() => setConfirmNew(true)} />
        </Card>
      )}

      <Dialog
        visible={confirmNew}
        icon={RefreshCw}
        title="Replace your backup codes?"
        message="Your current codes stop working immediately. You'll see the new ones once, so have somewhere ready to save them."
        confirmLabel="Get new codes"
        loading={regenerate.isPending}
        onCancel={() => setConfirmNew(false)}
        onConfirm={newSet}
      />
    </AuthScaffold>
  );
}
