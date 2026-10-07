import * as Clipboard from 'expo-clipboard';
import { Check, Copy } from 'lucide-react-native';
import { useEffect, useState } from 'react';

import { Button, useToast } from '@/components/ui';

interface CopyButtonProps {
  value: string;
  /** Toast text after copying */
  copiedMessage?: string;
  label?: string;
}

/** Copies `value`; the icon flips to a check for 2 seconds as confirmation. */
export function CopyButton({ value, copiedMessage = 'Copied', label = 'Copy' }: CopyButtonProps) {
  const toast = useToast();
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const id = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(id);
  }, [copied]);

  return (
    <Button
      title={copied ? 'Copied' : label}
      leftIcon={copied ? Check : Copy}
      variant="secondary"
      size="sm"
      onPress={async () => {
        await Clipboard.setStringAsync(value);
        setCopied(true);
        toast.show({ message: copiedMessage, tone: 'success' });
      }}
    />
  );
}
