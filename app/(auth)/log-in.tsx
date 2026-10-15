import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import { Lock, Mail } from 'lucide-react-native';
import { useForm } from 'react-hook-form';
import { View } from 'react-native';

import { AuthScaffold, AuthSwitch } from '@/components/auth';
import { applyApiError, FormError, FormInput } from '@/components/forms';
import { Button, Text, TextLink } from '@/components/ui';
import { useLogIn } from '@/hooks';
import { logInSchema, type LogInForm } from '@/schemas/auth';

export default function LogInScreen() {
  const logIn = useLogIn();
  const { control, handleSubmit, setError, setFocus, getValues, formState } = useForm<LogInForm>({
    resolver: zodResolver(logInSchema),
    defaultValues: { email: '', password: '' },
    mode: 'onTouched',
  });

  const submit = handleSubmit(async (values) => {
    try {
      const result = await logIn.mutateAsync(values);
      if (result.status === 'mfa_required') router.push('/mfa');
      else if (result.status === 'unconfirmed') router.push({ pathname: '/verify', params: { email: values.email, purpose: 'signup' } });
      // 'ok': the session is stored and the route guard shows the app.
    } catch (e) {
      applyApiError(e, setError, []);
    }
  });

  return (
    <AuthScaffold
      title="Welcome back"
      subtitle="Log in to see your money."
      footer={
        <AuthSwitch>
          <Text variant="bodySm" tone="muted">
            New to Monivo?
          </Text>
          <TextLink label="Create account" onPress={() => router.replace('/sign-up')} />
        </AuthSwitch>
      }
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
        returnKeyType="next"
        onSubmitEditing={() => setFocus('password')}
      />
      <View>
        <FormInput
          control={control}
          name="password"
          label="Password"
          placeholder="Your password"
          leftIcon={Lock}
          secureTextEntry
          autoComplete="current-password"
          textContentType="password"
          returnKeyType="go"
          onSubmitEditing={submit}
        />
        <TextLink
          label="Forgot password?"
          className="self-end"
          onPress={() => router.push({ pathname: '/forgot-password', params: { email: getValues('email') } })}
        />
      </View>
      <FormError message={formState.errors.root?.server?.message} />
      <Button title="Log in" loading={formState.isSubmitting} onPress={submit} fullWidth />
    </AuthScaffold>
  );
}
