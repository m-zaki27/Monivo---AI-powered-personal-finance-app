import { Copy, Mail, Search } from 'lucide-react-native';
import { useState } from 'react';
import { View } from 'react-native';

import { IconButton, Input, Keypad, Money, OTPInput, SegmentedControl, Text } from '@/components/ui';
import { applyKeypadKey, parseToCents } from '@/lib/money';
import { useTheme } from '@/theme';

import { DevSection } from './DevSection';

export function FormsSection() {
  const { colors } = useTheme();
  const [otp, setOtp] = useState('');
  const [type, setType] = useState<'expense' | 'income'>('expense');
  const [amount, setAmount] = useState('');

  return (
    <>
      <DevSection title="Inputs">
        <Input label="Email" placeholder="you@example.com" leftIcon={Mail} keyboardType="email-address" autoCapitalize="none" />
        <Input label="Password" placeholder="At least 8 characters" secureTextEntry />
        <Input placeholder="Search transactions" leftIcon={Search} />
        <Input label="Email" value="alex@" error="Enter a valid email address" onChangeText={() => {}} />
        <Input
          label="Setup key"
          value="JBSW Y3DP EHPK 3PXP"
          editable={false}
          right={<IconButton icon={Copy} accessibilityLabel="Copy key" variant="ghost" />}
          hint="Disabled with a custom right accessory"
        />
      </DevSection>

      <DevSection title="Segmented control">
        <SegmentedControl
          accessibilityLabel="Transaction type"
          value={type}
          onChange={setType}
          segments={[
            { value: 'expense', label: 'Expense', activeColor: colors.expense },
            { value: 'income', label: 'Income', activeColor: colors.income },
          ]}
        />
      </DevSection>

      <DevSection title="OTP input">
        <OTPInput value={otp} onChange={setOtp} />
        <OTPInput value="12345" onChange={() => {}} error />
        <Text variant="caption" tone="muted">
          Second row shows the error state (it shakes when the error appears).
        </Text>
      </DevSection>

      <DevSection title="Keypad">
        <View className="items-center py-2">
          <Money cents={parseToCents(amount) ?? 0} variant="balance" />
        </View>
        <Keypad onKey={(k) => setAmount((a) => applyKeypadKey(a, k))} onClear={() => setAmount('')} />
      </DevSection>
    </>
  );
}
