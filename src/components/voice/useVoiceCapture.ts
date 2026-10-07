import {
  AudioModule,
  RecordingPresets,
  setAudioModeAsync,
  useAudioRecorder,
  useAudioRecorderState,
} from 'expo-audio';
import { useCallback, useEffect, useRef, useState } from 'react';

import { sampleUtterances } from '@/services/ai';

export type CapturePhase = 'idle' | 'listening' | 'stopped';

const WORD_MS = 230;

/** dB from the recorder (-160 silent … 0 loudest) → 0–1. Speech sits around -45…-10. */
const normalizeDb = (db: number) => Math.min(1, Math.max(0, (db + 55) / 45));

/**
 * Records from the mic (so the waveform reacts to your real voice) while a mock
 * recognizer "hears" a sample sentence word by word. When the real speech API
 * lands, the recording file (recorder.uri) gets uploaded and the mock goes away.
 * If the mic is unavailable (denied, web, simulator), the waveform is simulated.
 */
export function useVoiceCapture(onFinish: (transcript: string) => void) {
  const recorder = useAudioRecorder({ ...RecordingPresets.HIGH_QUALITY, isMeteringEnabled: true });
  const recorderState = useAudioRecorderState(recorder, 100);
  const [phase, setPhase] = useState<CapturePhase>('idle');
  const [transcript, setTranscript] = useState('');
  const [micDenied, setMicDenied] = useState(false);
  const [fakeLevel, setFakeLevel] = useState(0);

  const usingMic = useRef(false);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const transcriptRef = useRef('');
  // Always call the latest onFinish without restarting anything.
  const onFinishRef = useRef(onFinish);
  onFinishRef.current = onFinish;

  // clearTimeout also clears intervals: timers and intervals share one ID pool.
  const clearTimers = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  };

  const stopMic = useCallback(async () => {
    if (!usingMic.current) return;
    usingMic.current = false;
    try {
      await recorder.stop();
      await setAudioModeAsync({ allowsRecording: false });
    } catch {
      // Already stopped: nothing to clean up.
    }
  }, [recorder]);

  const stop = useCallback(async () => {
    clearTimers();
    setPhase('stopped');
    setFakeLevel(0);
    await stopMic();
    onFinishRef.current(transcriptRef.current);
  }, [stopMic]);

  const start = useCallback(async () => {
    transcriptRef.current = '';
    setTranscript('');
    setPhase('listening');

    try {
      const permission = await AudioModule.requestRecordingPermissionsAsync();
      setMicDenied(!permission.granted);
      if (permission.granted) {
        await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
        await recorder.prepareToRecordAsync();
        recorder.record();
        usingMic.current = true;
      }
    } catch {
      usingMic.current = false;
    }

    // Mock recognizer: reveal a sample sentence word by word, then stop.
    const words = sampleUtterances[Math.floor(Math.random() * sampleUtterances.length)]!.split(' ');
    let i = 0;
    timers.current.push(
      setInterval(() => {
        i++;
        transcriptRef.current = words.slice(0, i).join(' ');
        setTranscript(transcriptRef.current);
        if (i >= words.length) {
          clearTimers();
          timers.current.push(setTimeout(stop, 700));
        }
      }, WORD_MS),
    );
    timers.current.push(setInterval(() => setFakeLevel(0.3 + Math.random() * 0.7), 110));
  }, [recorder, stop]);

  const reset = useCallback(() => {
    clearTimers();
    transcriptRef.current = '';
    setTranscript('');
    setPhase('idle');
  }, []);

  // Leaving the screen mid-recording must release the mic.
  useEffect(
    () => () => {
      clearTimers();
      void stopMic();
    },
    [stopMic],
  );

  const metering = recorderState.metering;
  const level = phase !== 'listening' ? 0 : usingMic.current && metering != null ? normalizeDb(metering) : fakeLevel;

  return { phase, transcript, level, micDenied, start, stop, reset };
}
