import { View } from 'react-native';

import { Text } from '@/components/ui';

import { CopyButton } from './CopyButton';

/** The setup key in groups of four, which is far easier to type into another app. */
export function SecretKey({ secret }: { secret: string }) {
  const grouped = secret.match(/.{1,4}/g)?.join(' ') ?? secret;
  return (
    <View className="gap-4 rounded-input border border-line bg-raised p-4">
      <Text
        variant="moneySm"
        selectable
        accessibilityLabel={`Setup key: ${secret.split('').join(' ')}`}
        style={{ letterSpacing: 1.5, lineHeight: 26 }}
      >
        {grouped}
      </Text>
      <View className="self-start">
        <CopyButton value={secret} copiedMessage="Setup key copied" label="Copy key" />
      </View>
    </View>
  );
}
