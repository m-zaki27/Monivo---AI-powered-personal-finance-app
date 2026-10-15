import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import { Lock, Mail, User } from 'lucide-react-native';
import { useForm } from 'react-hook-form';

import { AuthScaffold, AuthSwitch } from '@/components/auth';
import { applyApiError, FormError, FormInput } from '@/components/forms';
import { Button, Text, TextLink } from '@/components/ui';
import { useSignUp } from '@/hooks';
import { PASSWORD_HINT, signUpSchema, type SignUpForm } from '@/schemas/auth';

export default function SignUpScreen() {
  const signUp = useSignUp();
  const { control, handleSubmit, setError, setFocus, formState } = useForm<SignUpForm>({
    resolver: zodResolver(signUpSchema),
    defaultValues: { name: '', email: '', password: '', confirm: '' },
    // No errors while first typing; validate on blur, then live while fixing.
    mode: 'onTouched',
  });

  const submit = handleSubmit(async ({ name, email, password }) => {
    try {
      const { needsVerification } = await signUp.mutateAsync({ name, email, password });
      // Without email confirmation Supabase signs them in and the guard moves to onboarding.
      if (needsVerification) router.push({ pathname: '/verify', params: { email, purpose: 'signup' } });
    } catch (e) {
      applyApiError(e, setError, ['email']);
    }
  });

  return (
    <AuthScaffold
      title="Create your account"
      subtitle="It takes about a minute. No card needed."
      footer={
        <AuthSwitch>
          <Text variant="bodySm" tone="muted">
            Already have an account?
          </Text>
          <TextLink label="Log in" onPress={() => router.replace('/log-in')} />
        </AuthSwitch>
      }
    >
      <FormInput
        control={control}
        name="name"
        label="Full name"
        placeholder="Alex Morgan"
        leftIcon={User}
        autoComplete="name"
        textContentType="name"
        returnKeyType="next"
        onSubmitEditing={() => setFocus('email')}
      />
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
        returnKeyType="next"
        onSubmitEditing={() => setFocus('password')}
      />
      <FormInput
        control={control}
        name="password"
        label="Password"
        placeholder="Create a password"
        hint={PASSWORD_HINT}
        leftIcon={Lock}
        secureTextEntry
        autoComplete="new-password"
        textContentType="newPassword"
        returnKeyType="next"
        onSubmitEditing={() => setFocus('confirm')}
      />
      <FormInput
        control={control}
        name="confirm"
        label="Confirm password"
        placeholder="Type it again"
        leftIcon={Lock}
        secureTextEntry
        autoComplete="new-password"
        textContentType="newPassword"
        returnKeyType="go"
        onSubmitEditing={submit}
      />
      <FormError message={formState.errors.root?.server?.message} />
      <Button title="Create account" loading={formState.isSubmitting} onPress={submit} fullWidth className="mt-2" />
    </AuthScaffold>
  );
}
