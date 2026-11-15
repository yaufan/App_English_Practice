import { useCallback, useEffect, useRef, useState } from 'react';
import { ExpoSpeechRecognitionModule, useSpeechRecognitionEvent } from 'expo-speech-recognition';
import { stopSpeaking } from './tts';

const ERROR_TEXT: Record<string, string> = {
  'no-speech': '沒有聽到聲音，再按一次麥克風試試看。',
  'speech-timeout': '沒有聽到聲音，再按一次麥克風試試看。',
  'not-allowed': '需要麥克風權限，請到手機設定開啟。',
  'audio-capture': '麥克風無法使用，請確認沒有其他 App 正在錄音。',
  network: '語音辨識需要網路，請檢查連線。',
  'service-not-allowed': '手機的語音辨識服務沒有開啟（需要 Google 語音服務）。',
  'language-not-supported': '手機的語音辨識不支援英文，請在 Google 語音服務加裝英文。',
  busy: '語音辨識忙碌中，請稍等一下再試。',
};

/**
 * Speech-to-text for one screen. Only the instance that started listening reacts to events,
 * so several mounted screens can each use this hook safely.
 */
export function useRecognizer(onFinal: (text: string) => void) {
  const [listening, setListening] = useState(false);
  const [interim, setInterim] = useState('');
  const [error, setError] = useState<string | null>(null);
  const active = useRef(false);
  const best = useRef('');
  const cb = useRef(onFinal);
  cb.current = onFinal;

  useSpeechRecognitionEvent('start', () => {
    if (active.current) setListening(true);
  });

  useSpeechRecognitionEvent('result', (e) => {
    if (!active.current) return;
    const t = e.results[0]?.transcript ?? '';
    if (t) best.current = t;
    setInterim(t);
  });

  useSpeechRecognitionEvent('error', (e) => {
    if (!active.current) return;
    if (e.error === 'aborted') return;
    if (!best.current) setError(ERROR_TEXT[e.error] ?? `語音辨識錯誤：${e.message || e.error}`);
  });

  useSpeechRecognitionEvent('end', () => {
    if (!active.current) return;
    active.current = false;
    setListening(false);
    setInterim('');
    const text = best.current.trim();
    best.current = '';
    if (text) cb.current(text);
  });

  useEffect(
    () => () => {
      if (active.current) {
        active.current = false;
        ExpoSpeechRecognitionModule.abort();
      }
    },
    [],
  );

  const start = useCallback(async () => {
    setError(null);
    stopSpeaking();
    try {
      const perm = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
      if (!perm.granted) {
        setError(ERROR_TEXT['not-allowed']);
        return;
      }
      best.current = '';
      setInterim('');
      active.current = true;
      setListening(true);
      ExpoSpeechRecognitionModule.start({
        lang: 'en-US',
        interimResults: true,
        continuous: false,
        maxAlternatives: 1,
        androidIntentOptions: {
          EXTRA_SPEECH_INPUT_COMPLETE_SILENCE_LENGTH_MILLIS: 2500,
          EXTRA_SPEECH_INPUT_POSSIBLY_COMPLETE_SILENCE_LENGTH_MILLIS: 2000,
        },
      });
    } catch (e) {
      active.current = false;
      setListening(false);
      setError(`無法啟動語音辨識：${(e as Error).message}`);
    }
  }, []);

  const stop = useCallback(() => {
    if (active.current) ExpoSpeechRecognitionModule.stop();
  }, []);

  const toggle = useCallback(() => {
    if (active.current) stop();
    else start();
  }, [start, stop]);

  return { listening, interim, error, setError, start, stop, toggle };
}
