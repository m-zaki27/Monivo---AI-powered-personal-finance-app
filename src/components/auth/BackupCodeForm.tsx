import { zodResolver } from '@hookform/resolvers/zod';
import { KeyRound } from 'lucide-react-native';
import { useForm } from 'react-hook-form';
import { View } from 'react-native';

import { applyApiError, FormError, FormInput } from '@/components/forms';
import { Button } from '@/components/ui';
import { backupCodeSchema, type BackupCodeForm as Values } from '@/schemas/auth';

/** Login fallback when the authenticator isn't available. */
export function BackupCodeForm({ onSubmit }: { onSubmit: (code: string) => Promise<unknown> }) {
  const form = useForm<Values>({
    resolver: zodResolver(backupCodeSchema),
    defaultValues: { code: '' },
    mode: 'onTouched',
  });
  const { control, handleSubmit, setError, formState } = form;

  const submit = handleSubmit(async ({ code }) => {
    try {
      await onSubmit(code);
    } catch (e) {
      applyApiError(e, setError, ['code']);
    }
  });

  return (
    <View className="gap-4">
      <FormInput
        control={control}
        name="code"
        label="Backup code"
        placeholder="XXXX-XXXX-XXXX-XXXX"
        leftIcon={KeyRound}
        autoCapitalize="characters"
        autoCorrect={false}
        autoFocus
        returnKeyType="go"
        onSubmitEditing={submit}
      />
      <FormError message={formState.errors.root?.server?.message} />
      <Button title="Verify" loading={formState.isSubmitting} onPress={submit} fullWidth />
    </View>
  );
}
