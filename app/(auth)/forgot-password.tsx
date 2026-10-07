import { zodResolver } from '@hookform/resolvers/zod';
import { router, useLocalSearchParams } from 'expo-router';
import { KeyRound, Mail } from 'lucide-react-native';
import { useForm } from 'react-hook-form';

import { AuthScaffold } from '@/components/auth';
import { applyApiError, FormError, FormInput } from '@/components/forms';
import { Button } from '@/components/ui';
import { useRequestPasswordReset } from '@/hooks';
import { forgotPasswordSchema, type ForgotPasswordForm } from '@/schemas/auth';

export default function ForgotPasswordScreen() {
  // Carry over whatever was typed on the login screen.
  const params = useLocalSearchParams<{ email?: string }>();
  const request = useRequestPasswordReset();
  const { control, handleSubmit, setError, formState } = useForm<ForgotPasswordForm>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: params.email ?? '' },
    mode: 'onTouched',
  });

  const submit = handleSubmit(async ({ email }) => {
    try {
      await request.mutateAsync(email);
      router.push({ pathname: '/verify', params: { email, purpose: 'reset' } });
    } catch (e) {
      applyApiError(e, setError, ['email']);
    }
  });

  return (
    <AuthScaffold
      icon={KeyRound}
      title="Forgot your password?"
      subtitle="Enter your email and we'll send you a code to reset it."
    >
      <FormInput
        control={control}
        name="email"
        label="Email"
        placeholder="you@example.com"
        leftIcon={Mail}
        keyboardType="email-address"
        autoCapitalize="none"
        autoComplete="email"
        textContentType="emailAddress"
        autoFocus
        returnKeyType="send"
        onSubmitEditing={submit}
      />
      <FormError message={formState.errors.root?.server?.message} />
      <Button title="Send code" loading={formState.isSubmitting} onPress={submit} fullWidth />
    </AuthScaffold>
  );
}
