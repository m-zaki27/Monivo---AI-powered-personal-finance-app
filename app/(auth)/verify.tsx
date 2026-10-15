import { router, useLocalSearchParams } from 'expo-router';
import { MailCheck } from 'lucide-react-native';

import { AuthScaffold, CodeEntry, ResendTimer } from '@/components/auth';
import { Text } from '@/components/ui';
import { useResendCode, useSession, useVerifyEmail, useVerifyResetCode } from '@/hooks';
import type { CodePurpose } from '@/services';

/** One screen for both email-code flows; `purpose` decides what success does. */
export default function VerifyScreen() {
  const { email = '', purpose = 'signup' } = useLocalSearchParams<{ email?: string; purpose?: CodePurpose }>();
  const { setRecovering } = useSession();
  const verifyEmail = useVerifyEmail();
  const verifyReset = useVerifyResetCode();
  const resend = useResendCode();

  const submit = async (code: string) => {
    if (purpose === 'reset') {
      // The reset code signs them in; flag it first so the guards keep them here for a new password.
      setRecovering(true);
      try {
        const { needsMfa } = await verifyReset.mutateAsync({ email, code });
        // With two-step on, the authenticator code comes before the new password.
        router.replace(needsMfa ? { pathname: '/mfa', params: { next: 'reset-password' } } : '/reset-password');
      } catch (e) {
        setRecovering(false);
        throw e;
      }
    } else {
      // Supabase signs the new user in; the guard sends them to onboarding.
      await verifyEmail.mutateAsync({ email, code });
    }
  };

  return (
    <AuthScaffold
      icon={MailCheck}
      title="Check your email"
      subtitle={
        <Text tone="muted">
          We sent a 6-digit code to <Text weight="bold">{email || 'your email'}</Text>. Enter it below. Check spam if it isn't there in a minute.
        </Text>
      }
    >
      <CodeEntry onSubmit={submit} submitLabel={purpose === 'reset' ? 'Continue' : 'Verify email'}>
        {/* Supabase allows one email per minute, so the wait matches. */}
        <ResendTimer seconds={60} onResend={() => resend.mutateAsync({ email, purpose })} />
      </CodeEntry>
    </AuthScaffold>
  );
}
