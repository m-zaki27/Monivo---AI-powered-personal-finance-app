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

/** Chat lives in screen state: tabs stay mounted, so it survives tab switches. */
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
    // Recent turns travel with the question, so follow-ups ("and last month?") make sense.
    const history = messages.filter((m) => !m.error).map((m) => ({ role: m.role, text: m.text }));
    setMessages((m) => [...m, { id: nextId(), role: 'user', text }]);
    ask.mutate({ question: text, history }, {
      onSuccess: (reply) => {
        setMessages((m) => [...m, { id: nextId(), role: 'assistant', text: reply.text, card: reply.card }]);
        setFollowUps(reply.followUps?.length ? reply.followUps : starterPrompts);
      },
      // Show the real reason (e.g. the daily limit) rather than a generic apology.
      onError: (e) => setMessages((m) => [...m, { id: nextId(), role: 'assistant', text: e.message, error: true }]),
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
