import {
  AudioModule,
  RecordingPresets,
  setAudioModeAsync,
  useAudioRecorder,
  useAudioRecorderState,
} from 'expo-audio';
import { File } from 'expo-file-system';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';

import { sampleUtterances, type VoiceInput } from '@/services/ai';

export type CapturePhase = 'idle' | 'listening' | 'stopped';
/** real = your recorded voice goes to the AI; demo = a sample sentence, no microphone needed */
export type CaptureMode = 'real' | 'demo';

const WORD_MS = 230;
/** Long notes cost more and rarely help; stop automatically after a minute. */
const MAX_SECONDS = 60;

/** dB from the recorder (-160 silent … 0 loudest) → 0–1. Speech sits around -45…-10. */
const normalizeDb = (db: number) => Math.min(1, Math.max(0, (db + 55) / 45));

/**
 * Records a voice note and hands it to `onFinish` when you stop. With a
 * microphone it records for real (the waveform follows your voice); without
 * one (web, simulator, permission off) it plays a sample sentence word by
 * word so the flow can still be tried.
 */
export function useVoiceCapture(onFinish: (input: VoiceInput) => void) {
  const recorder = useAudioRecorder({ ...RecordingPresets.HIGH_QUALITY, isMeteringEnabled: true });
  const recorderState = useAudioRecorderState(recorder, 100);
  const [phase, setPhase] = useState<CapturePhase>('idle');
  const [mode, setMode] = useState<CaptureMode>('real');
  const [transcript, setTranscript] = useState('');
  const [micDenied, setMicDenied] = useState(false);
  const [fakeLevel, setFakeLevel] = useState(0);

  const recording = useRef(false);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const transcriptRef = useRef('');
  const modeRef = useRef<CaptureMode>('real');
  // Always call the latest onFinish without restarting anything.
  const onFinishRef = useRef(onFinish);
  onFinishRef.current = onFinish;

  // clearTimeout also clears intervals: timers and intervals share one ID pool.
  const clearTimers = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  };

  /** Stops the recorder and returns the recording as base64 (null if nothing was recorded). */
  const stopMic = useCallback(async (): Promise<string | null> => {
    if (!recording.current) return null;
    recording.current = false;
    try {
      await recorder.stop();
      await setAudioModeAsync({ allowsRecording: false });
      return recorder.uri ? await new File(recorder.uri).base64() : null;
    } catch {
      return null;
    }
  }, [recorder]);

  const stop = useCallback(async () => {
    clearTimers();
    setPhase('stopped');
    setFakeLevel(0);
    if (modeRef.current === 'demo') {
      onFinishRef.current({ kind: 'demo', transcript: transcriptRef.current });
      return;
    }
    const base64 = await stopMic();
    // Both platforms record AAC in an .m4a file with this preset.
    if (base64) onFinishRef.current({ kind: 'audio', base64, mimeType: 'audio/m4a' });
    else setPhase('idle');
  }, [stopMic]);

  const startDemo = useCallback(() => {
    modeRef.current = 'demo';
    setMode('demo');
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
  }, [stop]);

  const start = useCallback(async () => {
    transcriptRef.current = '';
    setTranscript('');
    setPhase('listening');

    // Web recordings aren't a format the AI accepts, so the browser uses the demo.
    if (Platform.OS === 'web') return startDemo();
    try {
      const permission = await AudioModule.requestRecordingPermissionsAsync();
      setMicDenied(!permission.granted);
      if (!permission.granted) return startDemo();
      await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
      await recorder.prepareToRecordAsync();
      recorder.record();
      recording.current = true;
      modeRef.current = 'real';
      setMode('real');
      timers.current.push(setTimeout(stop, MAX_SECONDS * 1000));
    } catch {
      startDemo();
    }
  }, [recorder, startDemo, stop]);

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
  const level = phase !== 'listening' ? 0 : mode === 'real' && metering != null ? normalizeDb(metering) : fakeLevel;
  const seconds = Math.floor((recorderState.durationMillis ?? 0) / 1000);

  return { phase, mode, transcript, level, seconds, micDenied, start, stop, reset };
}
