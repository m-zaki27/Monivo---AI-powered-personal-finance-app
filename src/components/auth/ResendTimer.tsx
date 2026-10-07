import { View } from 'react-native';

import { Text, TextLink, useToast } from '@/components/ui';
import { formatCountdown, useCountdown } from '@/hooks/useCountdown';

interface ResendTimerProps {
  onResend: () => Promise<unknown>;
  /** Seconds before another code can be requested */
  seconds?: number;
}

/** "Resend code in 0:24", then a link once the wait is over. */
export function ResendTimer({ onResend, seconds = 30 }: ResendTimerProps) {
  const { remaining, done, restart } = useCountdown(seconds);
  const toast = useToast();

  const resend = async () => {
    restart(); // start the wait straight away so a double tap can't send twice
    try {
      await onResend();
      toast.show({ message: 'New code sent', tone: 'success' });
    } catch (e) {
      toast.show({ message: e instanceof Error ? e.message : "Couldn't send a new code", tone: 'error' });
    }
  };

  return (
    <View className="min-h-11 flex-row items-center justify-center gap-1">
      <Text variant="bodySm" tone="muted">
        Didn't get it?
      </Text>
      {done ? (
        <TextLink label="Resend code" onPress={resend} />
      ) : (
        <Text variant="bodySm" weight="semibold" tone="muted" accessibilityLiveRegion="polite">
          Resend in <Text variant="bodySm" weight="bold" style={{ fontVariant: ['tabular-nums'] }}>{formatCountdown(remaining)}</Text>
        </Text>
      )}
    </View>
  );
}
