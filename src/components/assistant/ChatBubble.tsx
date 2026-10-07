import { memo } from 'react';
import { View } from 'react-native';
import { FadeInUp } from 'react-native-reanimated';

import { LogoMark, Text } from '@/components/ui';
import { AnimatedView } from '@/lib/animated';
import { cn } from '@/lib/cn';
import type { AnswerCard } from '@/services';
import { palette } from '@/theme';

import { AnswerCardView } from './AnswerCardView';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  card?: AnswerCard;
  error?: boolean;
}

/** User: cobalt, right-aligned. Assistant: raised surface, left, with the logo as its avatar. */
export const ChatBubble = memo(function ChatBubble({ message, currency }: { message: ChatMessage; currency: string }) {
  const mine = message.role === 'user';
  return (
    <AnimatedView entering={FadeInUp.duration(250)} className={cn('flex-row items-end gap-2', mine ? 'justify-end pl-12' : 'pr-8')}>
      {!mine && <AssistantAvatar />}
      <View
        className={cn(
          'shrink rounded-card px-4 py-3',
          mine ? 'rounded-br-sm bg-cobalt' : 'rounded-bl-sm border border-line bg-raised',
          message.error && 'border-rose',
        )}
      >
        <Text tone={mine ? 'white' : message.error ? 'expense' : 'default'}>{message.text}</Text>
        {message.card && <AnswerCardView card={message.card} currency={currency} />}
      </View>
    </AnimatedView>
  );
});

export function AssistantAvatar() {
  return (
    <View className="h-8 w-8 items-center justify-center rounded-full border border-line bg-midnight" accessibilityElementsHidden>
      <LogoMark size={18} color={palette.gold} />
    </View>
  );
}
