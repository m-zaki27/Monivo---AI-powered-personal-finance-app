import { useState, type ReactNode } from 'react';
import { View } from 'react-native';

import { FormError } from '@/components/forms/FormError';
import { Button, OTPInput } from '@/components/ui';

interface CodeEntryProps {
  /** Throw (reject) to show the error and shake the boxes. */
  onSubmit: (code: string) => Promise<unknown>;
  submitLabel?: string;
  /** Rendered under the button, e.g. <ResendTimer /> */
  children?: ReactNode;
  autoFocus?: boolean;
}

/** Six boxes + submit; auto-submits on the last digit (button kept for accessibility and retries). */
export function CodeEntry({ onSubmit, submitLabel = 'Verify', children, autoFocus = true }: CodeEntryProps) {
  const [code, setCode] = useState('');
  const [error, setError] = useState<string>();
  const [pending, setPending] = useState(false);

  const submit = async (value: string) => {
    if (pending || value.length < 6) return;
    setPending(true);
    setError(undefined);
    try {
      await onSubmit(value);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong. Please try again.');
      setCode('');
    } finally {
      setPending(false);
    }
  };

  return (
    <View className="gap-6">
      <OTPInput
        value={code}
        autoFocus={autoFocus}
        error={!!error}
        onChange={(v) => {
          setCode(v);
          if (error) setError(undefined);
        }}
        onComplete={submit}
      />
      <FormError message={error} />
      <Button title={submitLabel} loading={pending} disabled={code.length < 6} onPress={() => submit(code)} fullWidth />
      {children}
    </View>
  );
}
