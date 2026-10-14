import { router } from 'expo-router';
import type { ReactNode } from 'react';
import { View } from 'react-native';

import { AuthScaffold, CodeEntry, QrCode, SecretKey } from '@/components/auth';
import { ErrorState, Skeleton, Text } from '@/components/ui';
import { useConfirmMfaSetup, useMfaSetup } from '@/hooks';

export default function MfaSetupScreen() {
  const setup = useMfaSetup();
  const confirm = useConfirmMfaSetup();

  const submit = async (code: string) => {
    if (!setup.data) return;
    await confirm.mutateAsync({ factorId: setup.data.factorId, code });
    router.replace({ pathname: '/backup-codes', params: { fromSetup: '1' } });
  };

  return (
    <AuthScaffold
      leading="close"
      title="Turn on two-step verification"
      subtitle="Each time you log in, you'll also enter a code from an authenticator app like Google Authenticator or 1Password."
    >
      {setup.isPending ? (
        <View className="items-center gap-4">
          <Skeleton width={232} height={232} rounded="rounded-card" />
          <Skeleton height={88} rounded="rounded-input" />
        </View>
      ) : setup.isError ? (
        <ErrorState error={setup.error} onRetry={() => setup.refetch()} />
      ) : (
        <View className="gap-8">
          <Step n={1} title="Scan this code with your authenticator app">
            <QrCode svg={setup.data.qrSvg} />
          </Step>
          <Step n={2} title="Can't scan? Enter this key instead">
            <SecretKey secret={setup.data.secret} />
          </Step>
          <Step n={3} title="Enter the 6-digit code the app shows">
            <CodeEntry onSubmit={submit} submitLabel="Turn on" autoFocus={false} />
          </Step>
        </View>
      )}
    </AuthScaffold>
  );
}

function Step({ n, title, children }: { n: number; title: string; children: ReactNode }) {
  return (
    <View className="gap-4">
      <View className="flex-row items-center gap-3">
        <View className="h-7 w-7 items-center justify-center rounded-full bg-cobalt">
          <Text variant="caption" weight="bold" tone="white">
            {n}
          </Text>
        </View>
        <Text weight="bold" className="flex-1">
          {title}
        </Text>
      </View>
      {children}
    </View>
  );
}
