import * as Speech from 'expo-speech';

export type TtsOptions = { rate: number; voice?: string };

/** Make text friendlier for the speech engine. */
export function cleanForTts(text: string): string {
  return text
    .replace(/…|\.\.\./g, ', ')
    .replace(/\s\/\s/g, '. ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function stopSpeaking() {
  Speech.stop();
}

export function speak(text: string, opts: TtsOptions, onDone?: () => void) {
  Speech.stop();
  const done = () => onDone?.();
  Speech.speak(cleanForTts(text), {
    language: 'en-US',
    rate: opts.rate,
    voice: opts.voice || undefined,
    onDone: done,
    onStopped: done,
    onError: done,
  });
}

/**
 * Speak sentences one after another. Calls onIndex(i) as each starts, onFinish() at the end.
 * Returns a cancel function.
 */
export function speakSequence(
  texts: string[],
  opts: TtsOptions,
  onIndex: (i: number) => void,
  onFinish: () => void,
  gapMs = 350,
): () => void {
  let cancelled = false;
  let timer: ReturnType<typeof setTimeout> | undefined;
  const run = (i: number) => {
    if (cancelled) return;
    if (i >= texts.length) {
      onFinish();
      return;
    }
    onIndex(i);
    Speech.speak(cleanForTts(texts[i]), {
      language: 'en-US',
      rate: opts.rate,
      voice: opts.voice || undefined,
      onDone: () => {
        if (cancelled) return;
        timer = setTimeout(() => run(i + 1), gapMs);
      },
      onError: () => {
        if (!cancelled) onFinish();
      },
    });
  };
  Speech.stop();
  run(0);
  return () => {
    cancelled = true;
    if (timer) clearTimeout(timer);
    Speech.stop();
  };
}

export async function englishVoices(): Promise<{ id: string; name: string; lang: string }[]> {
  try {
    const voices = await Speech.getAvailableVoicesAsync();
    return voices
      .filter((v) => v.language?.toLowerCase().startsWith('en'))
      .map((v) => ({ id: v.identifier, name: v.name, lang: v.language }))
      .sort((a, b) => a.lang.localeCompare(b.lang) || a.name.localeCompare(b.name));
  } catch {
    return [];
  }
}
