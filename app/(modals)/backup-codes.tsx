import { router, useLocalSearchParams } from 'expo-router';
import { FileKey2, Share2 } from 'lucide-react-native';
import { useEffect } from 'react';
import { Share, View } from 'react-native';

import { AuthScaffold, BackupCodeGrid, BackupCodeGridSkeleton, CopyButton } from '@/components/auth';
import { Button, EmptyState, ErrorState, useToast } from '@/components/ui';
import { useBackupCodes } from '@/hooks';

export default function BackupCodesScreen() {
  const { fromSetup } = useLocalSearchParams<{ fromSetup?: string }>();
  const codes = useBackupCodes();
  const toast = useToast();
  const text = (codes.data ?? []).join('\n');

  useEffect(() => {
    if (fromSetup) toast.show({ message: 'Two-step verification is on', tone: 'success' });
  }, [fromSetup, toast]);

  const share = async () => {
    try {
      // RN's built-in Share sends plain text; expo-sharing is for files (we'll use it for CSV export).
      await Share.share({ message: `Monivo backup codes (each works once):\n\n${text}` });
    } catch {
      toast.show({ message: "Sharing isn't available here. Copy the codes instead.", tone: 'warning' });
    }
  };

  return (
    <AuthScaffold
      leading="close"
      icon={FileKey2}
      title="Save your backup codes"
      subtitle="If you lose your phone, each code lets you log in once. Keep them somewhere safe, like a password manager."
      footer={<Button title="I've saved them" onPress={() => router.back()} fullWidth />}
    >
      {codes.isPending ? (
        <BackupCodeGridSkeleton />
      ) : codes.isError ? (
        <ErrorState error={codes.error} onRetry={() => codes.refetch()} />
      ) : codes.data.length === 0 ? (
        <EmptyState
          icon={FileKey2}
          title="No backup codes yet"
          message="Turn on two-step verification to get a set."
          actionLabel="Set it up"
          onAction={() => router.replace('/mfa-setup')}
        />
      ) : (
        <>
          <BackupCodeGrid codes={codes.data} />
          <View className="flex-row gap-3">
            <CopyButton value={text} label="Copy all" copiedMessage="Backup codes copied" />
            <Button title="Share" leftIcon={Share2} variant="secondary" size="sm" onPress={share} />
          </View>
        </>
      )}
    </AuthScaffold>
  );
}
