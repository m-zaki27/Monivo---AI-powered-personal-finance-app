import { router, useLocalSearchParams } from 'expo-router';
import { MailCheck } from 'lucide-react-native';

import { AuthScaffold, CodeEntry, ResendTimer } from '@/components/auth';
import { Text } from '@/components/ui';
import { useResendCode, useSession, useVerifyEmail, useVerifyResetCode } from '@/hooks';

type Purpose = 'signup' | 'reset';

/** One screen for both email-code flows; `purpose` decides what success does. */
export default function VerifyScreen() {
  const { email = '', purpose = 'signup' } = useLocalSearchParams<{ email?: string; purpose?: Purpose }>();
  const { signIn } = useSession();
  const verifyEmail = useVerifyEmail();
  const verifyReset = useVerifyResetCode();
  const resend = useResendCode();

  const submit = async (code: string) => {
    if (purpose === 'reset') {
      const { resetToken } = await verifyReset.mutateAsync({ email, code });
      router.replace({ pathname: '/reset-password', params: { token: resetToken } });
    } else {
      // A new account isn't onboarded yet, so the guard sends them to onboarding.
      signIn(await verifyEmail.mutateAsync({ email, code }));
    }
  };

  return (
    <AuthScaffold
      icon={MailCheck}
      title="Check your email"
      subtitle={
        <Text tone="muted">
          We sent a 6-digit code to <Text weight="bold">{email || 'your email'}</Text>. Enter it below.
        </Text>
      }
    >
      <CodeEntry onSubmit={submit} submitLabel={purpose === 'reset' ? 'Continue' : 'Verify email'}>
        <ResendTimer onResend={() => resend.mutateAsync(email)} />
      </CodeEntry>
    </AuthScaffold>
  );
}
