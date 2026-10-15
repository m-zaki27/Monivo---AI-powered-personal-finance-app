import { zodResolver } from '@hookform/resolvers/zod';
import { Mail } from 'lucide-react-native';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { View } from 'react-native';
import { z } from 'zod';

import { CodeEntry, ResendTimer } from '@/components/auth';
import { applyApiError, FormError, FormInput } from '@/components/forms';
import { Button, Header, Screen, Text, useToast } from '@/components/ui';
import { useMe, useRequestEmailChange, useResendEmailChange, useVerifyEmailChange } from '@/hooks';
import { closeModal } from '@/lib/navigation';
import { emailSchema } from '@/schemas/auth';

/** New email → code from the new inbox → code from the current one (Supabase secure email change). */
type Step = { kind: 'email' } | { kind: 'newCode' | 'currentCode'; newEmail: string };

export default function ChangeEmailScreen() {
  const me = useMe();
  const [step, setStep] = useState<Step>({ kind: 'email' });
  const currentEmail = me.data?.email ?? '';

  return (
    <Screen scroll header={<Header title="Change email" />} contentClassName="pt-4">
      {step.kind === 'email' ? (
        <EmailStep currentEmail={currentEmail} onSent={(newEmail) => setStep({ kind: 'newCode', newEmail })} />
      ) : (
        <CodeStep
          // A fresh component per step, so the code boxes start empty.
          key={step.kind}
          step={step.kind}
          sentTo={step.kind === 'newCode' ? step.newEmail : currentEmail}
          newEmail={step.newEmail}
          onVerified={() => (step.kind === 'newCode' ? setStep({ kind: 'currentCode', newEmail: step.newEmail }) : undefined)}
        />
      )}
    </Screen>
  );
}

function EmailStep({ currentEmail, onSent }: { currentEmail: string; onSent: (newEmail: string) => void }) {
  const request = useRequestEmailChange();
  const schema = z.object({
    email: emailSchema.refine((v) => v.toLowerCase() !== currentEmail.toLowerCase(), "That's already your email"),
  });
  const { control, handleSubmit, setError, formState } = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { email: '' },
    mode: 'onTouched',
  });

  const submit = handleSubmit((v) =>
    request.mutate(v.email, {
      onSuccess: () => onSent(v.email),
      onError: (e) => applyApiError(e, setError, ['email']),
    }),
  );

  return (
    <View className="gap-4">
      <Text tone="muted">
        Now using <Text weight="bold">{currentEmail}</Text>. We'll send a code to your new address and one to this one, to make sure it's really you.
      </Text>
      <FormInput
        control={control}
        name="email"
        label="New email"
        leftIcon={Mail}
        keyboardType="email-address"
        autoCapitalize="none"
        autoComplete="email"
        returnKeyType="send"
        onSubmitEditing={submit}
      />
      <FormError message={formState.errors.root?.server?.message} />
      <Button title="Send codes" loading={request.isPending} onPress={submit} fullWidth className="mt-2" />
    </View>
  );
}

interface CodeStepProps {
  step: 'newCode' | 'currentCode';
  sentTo: string;
  newEmail: string;
  onVerified: () => void;
}

function CodeStep({ step, sentTo, newEmail, onVerified }: CodeStepProps) {
  const verify = useVerifyEmailChange();
  const resend = useResendEmailChange();
  const toast = useToast();

  const submit = async (code: string) => {
    await verify.mutateAsync({ email: sentTo, code });
    if (step === 'newCode') return onVerified();
    toast.show({ message: `Your email is now ${newEmail}`, tone: 'success' });
    closeModal();
  };

  return (
    <View className="gap-6">
      <View className="gap-2">
        <Text variant="caption" tone="muted">
          Step {step === 'newCode' ? 1 : 2} of 2
        </Text>
        <Text tone="muted">
          {step === 'newCode' ? 'Enter the 6-digit code we sent to your new email, ' : 'Now enter the code we sent to your current email, '}
          <Text weight="bold">{sentTo}</Text>. Check spam if it isn't there in a minute.
        </Text>
      </View>
      <CodeEntry onSubmit={submit} submitLabel={step === 'newCode' ? 'Continue' : 'Change email'}>
        {/* One resend sends both codes again. */}
        <ResendTimer seconds={60} onResend={() => resend.mutateAsync(newEmail)} />
      </CodeEntry>
    </View>
  );
}
