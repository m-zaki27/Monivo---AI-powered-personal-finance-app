import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { AmountDisplay, OnboardingFrame } from '@/components/onboarding';
import { Button, Keypad, Text, useToast } from '@/components/ui';
import { useCompleteOnboarding } from '@/hooks';
import { findCurrency } from '@/lib/currencies';
import { applyKeypadKey, parseToCents } from '@/lib/money';

export default function BalanceStep() {
  const params = useLocalSearchParams<{ currency?: string }>();
  const currency = findCurrency(params.currency);
  const [amount, setAmount] = useState('');
  const complete = useCompleteOnboarding();
  const toast = useToast();

  const submit = () =>
    complete.mutate(
      // Integer cents from here on; the typed string never leaves this screen.
      { currency: currency.code, startingBalance: parseToCents(amount) ?? 0 },
      {
        onSuccess: () => router.push('/done'),
        onError: (e) => toast.show({ message: e.message, tone: 'error' }),
      },
    );

  return (
    <OnboardingFrame
      step={2}
      footer={<Button title={amount ? 'Continue' : 'Start from zero'} loading={complete.isPending} onPress={submit} fullWidth />}
    >
      <View className="flex-1 justify-center gap-3">
        <Text variant="title" center>
          What's your starting balance?
        </Text>
        <Text variant="bodySm" tone="muted" center>
          Roughly what's in your main account today.
        </Text>
        <View className="mt-6">
          <AmountDisplay value={amount} symbol={currency.symbol} />
        </View>
      </View>
      <View className="pb-4">
        <Keypad
          allowDecimal={currency.decimals > 0}
          onKey={(k) => setAmount((a) => applyKeypadKey(a, k))}
          onClear={() => setAmount('')}
        />
      </View>
    </OnboardingFrame>
  );
}
