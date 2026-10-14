import { router } from 'expo-router';
import { MicOff } from 'lucide-react-native';
import { useRef } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { FadeIn } from 'react-native-reanimated';

import { useDrafts } from '@/components/add';
import { Button, ErrorState, Header, Screen, Text } from '@/components/ui';
import { MicButton, useVoiceCapture, VoiceResults, Waveform } from '@/components/voice';
import { formatCountdown, useCurrency, useDefaultAccount, useProcessVoice } from '@/hooks';
import { AnimatedView } from '@/lib/animated';
import { newDraftKey } from '@/schemas/transactionForm';
import type { VoiceInput } from '@/services';
import { useTheme } from '@/theme';

type VoiceView = 'idle' | 'listening' | 'processing' | 'results' | 'empty' | 'error';

const titles: Record<Exclude<VoiceView, 'results'>, string> = {
  idle: 'What did you spend?',
  listening: 'Listening…',
  processing: 'Got it. Working it out…',
  empty: "I didn't catch an amount",
  error: 'Something went wrong',
};

export default function VoiceScreen() {
  const { colors } = useTheme();
  const currency = useCurrency();
  const account = useDefaultAccount();
  const parse = useProcessVoice();
  const { drafts, setDrafts } = useDrafts();
  // Kept so "Try again" after an error re-sends the same recording.
  const lastInput = useRef<VoiceInput | null>(null);

  const process = (input: VoiceInput) => {
    lastInput.current = input;
    parse.mutate(input, {
      onSuccess: ({ items }) =>
        setDrafts(items.map((it) => ({ ...it, key: newDraftKey(), accountId: account.data?.id ?? '', source: 'voice' }))),
    });
  };

  const capture = useVoiceCapture((input) => {
    if (input.kind === 'demo' && !input.transcript.trim()) return;
    process(input);
  });
  // The AI's transcript once it's back; while the demo plays, its words.
  const transcript = parse.data?.transcript ?? capture.transcript;

  // One value describes the whole screen, so each state renders exactly one way.
  const view: VoiceView = parse.isPending
    ? 'processing'
    : parse.isError
      ? 'error'
      : parse.isSuccess && capture.phase === 'stopped'
        ? drafts.length > 0
          ? 'results'
          : 'empty'
        : capture.phase === 'listening'
          ? 'listening'
          : 'idle';

  const tryAgain = () => {
    parse.reset();
    setDrafts([]);
    capture.reset();
  };

  if (view === 'results') {
    return (
      <Screen
        scroll
        header={<Header title="Voice" leading="close" />}
        footer={
          <View className="gap-3">
            <Button title="Looks right" onPress={() => router.push('/confirm')} fullWidth />
            <Button title="Try again" variant="ghost" onPress={tryAgain} fullWidth />
          </View>
        }
        contentClassName="pt-4"
      >
        <VoiceResults transcript={transcript} currency={currency} />
      </Screen>
    );
  }

  return (
    <Screen header={<Header title="Voice" leading="close" />}>
      <View className="flex-1 items-center justify-between py-6">
        <View className="w-full items-center gap-4">
          <Text variant="h2" center>
            {titles[view]}
          </Text>
          <View className="min-h-[120px] w-full items-center justify-center px-2" accessibilityLiveRegion="polite">
            {view === 'idle' && (
              <Text tone="muted" center>
                Say it naturally, like “Twelve fifty for lunch at Chipotle”. You can mention a few at once.
              </Text>
            )}
            {view === 'listening' && capture.mode === 'real' && (
              <AnimatedView entering={FadeIn} className="items-center gap-2">
                <Text variant="moneyLg" style={{ fontVariant: ['tabular-nums'] }}>
                  {formatCountdown(capture.seconds)}
                </Text>
                <Text tone="muted" center>
                  Speak naturally. Tap stop when you're done.
                </Text>
              </AnimatedView>
            )}
            {((view === 'listening' && capture.mode === 'demo') || view === 'processing') && (
              <AnimatedView entering={FadeIn}>
                <Text variant="title" center className="leading-8">
                  {capture.mode === 'demo' ? capture.transcript || '…' : 'Reading your voice note…'}
                </Text>
              </AnimatedView>
            )}
            {view === 'empty' && (
              <Text tone="muted" center>
                Try again with an amount and where, like “Coffee for five dollars”.
              </Text>
            )}
            {view === 'error' && (
              <ErrorState compact error={parse.error} onRetry={() => lastInput.current && process(lastInput.current)} />
            )}
          </View>
        </View>

        <View className="w-full items-center gap-2">
          {view === 'processing' ? (
            <View className="h-20 justify-center">
              <ActivityIndicator color={colors.secondary} size="large" />
            </View>
          ) : (
            <Waveform level={capture.level} />
          )}
          <MicButton
            listening={view === 'listening'}
            disabled={view === 'processing'}
            onPress={() => {
              if (view === 'listening') return void capture.stop();
              if (view === 'empty' || view === 'error') tryAgain();
              void capture.start();
            }}
          />
          <Text variant="bodySm" tone="muted">
            {view === 'listening' ? 'Tap to stop' : view === 'processing' ? 'One moment' : 'Tap to start'}
          </Text>
          {capture.micDenied && (
            <View className="mt-2 flex-row items-center gap-2 px-6">
              <MicOff size={16} color={colors.warning} />
              <Text variant="caption" tone="warning" className="flex-1">
                Microphone access is off, so this was a demo with a sample sentence. Turn it on in Settings to use your voice.
              </Text>
            </View>
          )}
        </View>
      </View>
    </Screen>
  );
}
