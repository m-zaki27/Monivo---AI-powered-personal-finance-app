import { RotateCcw } from 'lucide-react-native';
import { useRef, useState } from 'react';
import { FlatList, KeyboardAvoidingView, Platform, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AssistantWelcome, ChatBubble, ChatInput, SuggestionChips, TypingIndicator, type ChatMessage } from '@/components/assistant';
import { Header, IconButton, TAB_BAR_SPACE } from '@/components/ui';
import { useAskAssistant, useCurrency, useKeyboardVisible, useMe } from '@/hooks';
import { starterPrompts } from '@/services/assistant';

let messageId = 0;
const nextId = () => `m${++messageId}`;

/**
 * The conversation lives in this screen's state: tabs stay mounted, so it
 * survives switching tabs, and "New chat" clears it. Each question is a
 * mutation; its pending state drives the typing indicator.
 */
export default function AssistantScreen() {
  const insets = useSafeAreaInsets();
  const keyboardUp = useKeyboardVisible();
  const currency = useCurrency();
  const me = useMe();
  const ask = useAskAssistant();
  const list = useRef<FlatList<ChatMessage>>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [followUps, setFollowUps] = useState<string[]>(starterPrompts);

  const send = (text: string) => {
    if (ask.isPending) return;
    setMessages((m) => [...m, { id: nextId(), role: 'user', text }]);
    ask.mutate(text, {
      onSuccess: (reply) => {
        setMessages((m) => [...m, { id: nextId(), role: 'assistant', text: reply.text, card: reply.card }]);
        setFollowUps(reply.followUps ?? starterPrompts);
      },
      onError: () =>
        setMessages((m) => [...m, { id: nextId(), role: 'assistant', text: "Sorry, I couldn't answer that just now. Try again in a moment.", error: true }]),
    });
  };

  const reset = () => {
    setMessages([]);
    setFollowUps(starterPrompts);
  };

  const empty = messages.length === 0;

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1 bg-bg" style={{ paddingTop: insets.top }}>
      <View className="px-6">
        <Header
          large
          title="Assistant"
          subtitle={empty ? undefined : 'Answers from your own numbers'}
          right={!empty && <IconButton icon={RotateCcw} accessibilityLabel="New chat" onPress={reset} />}
        />
      </View>

      {empty ? (
        <AssistantWelcome name={me.data?.firstName} prompts={starterPrompts} onPick={send} />
      ) : (
        <FlatList
          ref={list}
          data={messages}
          keyExtractor={(m) => m.id}
          renderItem={({ item }) => <ChatBubble message={item} currency={currency} />}
          ListFooterComponent={ask.isPending ? <TypingIndicator /> : null}
          contentContainerClassName="gap-3 px-6 py-4"
          // Keep the newest message in view as the list grows.
          onContentSizeChange={() => list.current?.scrollToEnd({ animated: true })}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
          showsVerticalScrollIndicator={false}
          className="flex-1"
        />
      )}

      {/* The tab bar hides while typing, so the bottom gap shrinks to match. */}
      <View className="gap-3 pt-2" style={{ paddingBottom: keyboardUp ? 12 : insets.bottom + TAB_BAR_SPACE - 20 }}>
        {!empty && <SuggestionChips prompts={followUps} onPick={send} disabled={ask.isPending} />}
        <View className="px-6">
          <ChatInput onSend={send} disabled={ask.isPending} />
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
