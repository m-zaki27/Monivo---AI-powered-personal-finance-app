import { zodResolver } from '@hookform/resolvers/zod';
import { Lock, ShieldCheck } from 'lucide-react-native';
import { useForm } from 'react-hook-form';

import { AuthScaffold } from '@/components/auth';
import { applyApiError, FormError, FormInput } from '@/components/forms';
import { Button, useToast } from '@/components/ui';
import { useResetPassword, useSession } from '@/hooks';
import { PASSWORD_HINT, resetPasswordSchema, type ResetPasswordForm } from '@/schemas/auth';

export default function ResetPasswordScreen() {
  const reset = useResetPassword();
  const { setRecovering, signOut } = useSession();
  const toast = useToast();
  const { control, handleSubmit, setError, setFocus, formState } = useForm<ResetPasswordForm>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: '', confirm: '' },
    mode: 'onTouched',
  });

  const submit = handleSubmit(async ({ password }) => {
    try {
      await reset.mutateAsync(password);
      toast.show({ message: 'Password updated. Welcome back!', tone: 'success' });
      // The reset code already signed them in: clearing the flag lets the guard open the app.
      setRecovering(false);
    } catch (e) {
      applyApiError(e, setError, ['password']);
    }
  });

  return (
    <AuthScaffold
      icon={ShieldCheck}
      title="Set a new password"
      subtitle="Pick something you haven't used here before."
      leading={false}
      footer={
        // Leaving now must not leave a half-finished reset session behind.
        <Button title="Cancel" variant="ghost" onPress={() => void signOut()} fullWidth />
      }
    >
      <FormInput
        control={control}
        name="password"
        label="New password"
        placeholder="Create a password"
        hint={PASSWORD_HINT}
        leftIcon={Lock}
        secureTextEntry
        autoComplete="new-password"
        textContentType="newPassword"
        autoFocus
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
      <Button title="Update password" loading={formState.isSubmitting} onPress={submit} fullWidth />
    </AuthScaffold>
  );
}
