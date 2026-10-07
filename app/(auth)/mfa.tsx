import { useLocalSearchParams } from 'expo-router';
import { KeyRound, ShieldCheck } from 'lucide-react-native';
import { useState } from 'react';
import { View } from 'react-native';

import { AuthScaffold, BackupCodeForm, CodeEntry } from '@/components/auth';
import { TextLink } from '@/components/ui';
import { useSession, useVerifyMfa } from '@/hooks';

type Method = 'totp' | 'backup';

/** Second login step for accounts with two-step verification on. */
export default function MfaScreen() {
  const { challengeId = '' } = useLocalSearchParams<{ challengeId?: string }>();
  const [method, setMethod] = useState<Method>('totp');
  const verify = useVerifyMfa();
  const { signIn } = useSession();

  const submit = async (code: string) => signIn(await verify.mutateAsync({ challengeId, code, method }));

  const isTotp = method === 'totp';
  return (
    <AuthScaffold
      icon={isTotp ? ShieldCheck : KeyRound}
      title={isTotp ? 'Two-step verification' : 'Use a backup code'}
      subtitle={
        isTotp
          ? 'Open your authenticator app and enter the 6-digit code for Monivo.'
          : 'Enter one of the backup codes you saved when you turned on two-step verification.'
      }
    >
      {/* `key` remounts the form when switching, so state and focus reset cleanly. */}
      {isTotp ? <CodeEntry key="totp" onSubmit={submit} /> : <BackupCodeForm key="backup" onSubmit={submit} />}
      <View className="items-center">
        <TextLink
          label={isTotp ? 'Use a backup code instead' : 'Use my authenticator app'}
          onPress={() => setMethod(isTotp ? 'backup' : 'totp')}
        />
      </View>
    </AuthScaffold>
  );
}
