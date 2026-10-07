import { ArrowUp } from 'lucide-react-native';
import { useState } from 'react';
import { Platform, TextInput, View } from 'react-native';

import { IconButton } from '@/components/ui';
import { useTheme } from '@/theme';

interface ChatInputProps {
  onSend: (text: string) => void;
  disabled?: boolean;
}

/** Pill input with a gold send button that only lights up when there's something to send. */
export function ChatInput({ onSend, disabled }: ChatInputProps) {
  const { colors, isDark } = useTheme();
  const [text, setText] = useState('');
  const canSend = text.trim().length > 0 && !disabled;

  const send = () => {
    if (!canSend) return;
    onSend(text.trim());
    setText('');
  };

  return (
    <View className="min-h-14 flex-row items-end gap-2 rounded-[28px] border border-line bg-surface py-1.5 pl-5 pr-1.5">
      <TextInput
        value={text}
        onChangeText={setText}
        placeholder="Ask about your money…"
        placeholderTextColor={colors.muted}
        selectionColor={colors.secondary}
        keyboardAppearance={isDark ? 'dark' : 'light'}
        multiline
        // Web renders multiline inputs as a 2-row textarea by default.
        numberOfLines={Platform.OS === 'web' ? 1 : undefined}
        maxLength={300}
        returnKeyType="send"
        submitBehavior="submit"
        onSubmitEditing={send}
        accessibilityLabel="Message"
        className="max-h-28 min-w-0 flex-1 py-3 font-medium text-base text-ink"
      />
      <IconButton
        icon={ArrowUp}
        accessibilityLabel="Send"
        variant={canSend ? 'gold' : 'surface'}
        iconColor={canSend ? colors.onPrimary : colors.muted}
        disabled={!canSend}
        onPress={send}
      />
    </View>
  );
}
