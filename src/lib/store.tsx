import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import type { ModelId } from './claude';
import type { Level } from './prompts';
import { type CardState, type Rating, dayNumber, schedule } from './srs';
import type { VocabItem } from '../data/decks';
import type { Passage } from '../data/listening';

export type Settings = {
  model: ModelId;
  level: Level;
  rate: number;
  voice: string;
  showZh: boolean;
  autoPlay: boolean;
  newPerDay: number;
};

export const DEFAULT_SETTINGS: Settings = {
  model: 'claude-haiku-5-5',
  level: 'A2',
  rate: 0.85,
  voice: '',
  showZh: true,
  autoPlay: true,
  newPerDay: 10,
};

export type SavedItem = VocabItem & { createdAt: number; source?: string };

export type Progress = {
  srs: Record<string, CardState>;
  saved: SavedItem[];
  newLog: { day: number; count: number };
  activeDays: number[];
  passages: Passage[];
  listenDone: Record<string, { correct: number; total: number; day: number }>;
  talkDone: Record<string, number>;
};

const EMPTY_PROGRESS: Progress = {
  srs: {},
  saved: [],
  newLog: { day: 0, count: 0 },
  activeDays: [],
  passages: [],
  listenDone: {},
  talkDone: {},
};

const K_SETTINGS = 'settings.v1';
const K_PROGRESS = 'progress.v1';
const K_API = 'anthropic_api_key';

async function readKey(): Promise<string> {
  try {
    if (Platform.OS === 'web') return (await AsyncStorage.getItem(K_API)) ?? '';
    return (await SecureStore.getItemAsync(K_API)) ?? '';
  } catch {
    return '';
  }
}

async function writeKey(v: string): Promise<void> {
  if (Platform.OS === 'web') {
    if (v) await AsyncStorage.setItem(K_API, v);
    else await AsyncStorage.removeItem(K_API);
    return;
  }
  if (v) await SecureStore.setItemAsync(K_API, v);
  else await SecureStore.deleteItemAsync(K_API);
}

type Store = {
  ready: boolean;
  today: number;
  settings: Settings;
  updateSettings: (patch: Partial<Settings>) => void;
  apiKey: string;
  setApiKey: (v: string) => Promise<void>;
  progress: Progress;
  newLeftToday: number;
  rateCard: (id: string, rating: Rating) => void;
  saveItem: (item: { en: string; zh: string; ex?: string; exZh?: string }, source?: string) => boolean;
  isSaved: (en: string) => boolean;
  removeSaved: (id: string) => void;
  markActive: () => void;
  addPassage: (p: Passage) => void;
  removePassage: (id: string) => void;
  recordListen: (id: string, correct: number, total: number) => void;
  recordTalk: (scenarioId: string) => void;
  streak: number;
  resetProgress: () => void;
};

const Ctx = createContext<Store | null>(null);

export function savedId(en: string) {
  return `saved:${en.trim().toLowerCase()}`;
}

export function computeStreak(days: number[], today: number): number {
  const set = new Set(days);
  let d = set.has(today) ? today : today - 1;
  let n = 0;
  while (set.has(d)) {
    n += 1;
    d -= 1;
  }
  return n;
}

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [progress, setProgress] = useState<Progress>(EMPTY_PROGRESS);
  const [apiKey, setKeyState] = useState('');
  const [today, setToday] = useState(dayNumber());
  const loaded = useRef(false);

  useEffect(() => {
    (async () => {
      try {
        const [s, p, k] = await Promise.all([
          AsyncStorage.getItem(K_SETTINGS),
          AsyncStorage.getItem(K_PROGRESS),
          readKey(),
        ]);
        if (s) setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(s) });
        if (p) setProgress({ ...EMPTY_PROGRESS, ...JSON.parse(p) });
        setKeyState(k);
      } catch {
        // corrupted storage: start fresh rather than crash
      }
      loaded.current = true;
      setReady(true);
    })();
    const t = setInterval(() => setToday(dayNumber()), 60_000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (loaded.current) AsyncStorage.setItem(K_SETTINGS, JSON.stringify(settings)).catch(() => {});
  }, [settings]);

  useEffect(() => {
    if (!loaded.current) return;
    const t = setTimeout(() => {
      AsyncStorage.setItem(K_PROGRESS, JSON.stringify(progress)).catch(() => {});
    }, 300);
    return () => clearTimeout(t);
  }, [progress]);

  const updateSettings = useCallback((patch: Partial<Settings>) => setSettings((s) => ({ ...s, ...patch })), []);

  const setApiKey = useCallback(async (v: string) => {
    const clean = v.trim();
    await writeKey(clean);
    setKeyState(clean);
  }, []);

  const markActiveIn = (p: Progress, day: number): Progress =>
    p.activeDays.includes(day) ? p : { ...p, activeDays: [...p.activeDays.slice(-400), day] };

  const rateCard = useCallback(
    (id: string, rating: Rating) => {
      setProgress((p) => {
        const isNew = !p.srs[id];
        const newLog = isNew
          ? { day: today, count: (p.newLog.day === today ? p.newLog.count : 0) + 1 }
          : p.newLog;
        const next = { ...p, srs: { ...p.srs, [id]: schedule(p.srs[id], rating, today) }, newLog };
        return markActiveIn(next, today);
      });
    },
    [today],
  );

  const saveItem = useCallback(
    (item: { en: string; zh: string; ex?: string; exZh?: string }, source?: string) => {
      const id = savedId(item.en);
      if (progress.saved.some((s) => s.id === id)) return false;
      setProgress((p) => {
        if (p.saved.some((s) => s.id === id)) return p;
        const entry: SavedItem = { id, en: item.en.trim(), zh: item.zh.trim(), ex: item.ex, exZh: item.exZh, createdAt: Date.now(), source };
        return { ...p, saved: [entry, ...p.saved] };
      });
      return true;
    },
    [progress.saved],
  );

  const isSaved = useCallback((en: string) => progress.saved.some((s) => s.id === savedId(en)), [progress.saved]);

  const removeSaved = useCallback((id: string) => {
    setProgress((p) => {
      const srs = { ...p.srs };
      delete srs[id];
      return { ...p, saved: p.saved.filter((s) => s.id !== id), srs };
    });
  }, []);

  const markActive = useCallback(() => setProgress((p) => markActiveIn(p, today)), [today]);

  const addPassage = useCallback((ps: Passage) => setProgress((p) => ({ ...p, passages: [ps, ...p.passages] })), []);

  const removePassage = useCallback(
    (id: string) => setProgress((p) => ({ ...p, passages: p.passages.filter((x) => x.id !== id) })),
    [],
  );

  const recordListen = useCallback(
    (id: string, correct: number, total: number) =>
      setProgress((p) => markActiveIn({ ...p, listenDone: { ...p.listenDone, [id]: { correct, total, day: today } } }, today)),
    [today],
  );

  const recordTalk = useCallback(
    (scenarioId: string) =>
      setProgress((p) => markActiveIn({ ...p, talkDone: { ...p.talkDone, [scenarioId]: (p.talkDone[scenarioId] ?? 0) + 1 } }, today)),
    [today],
  );

  const resetProgress = useCallback(() => setProgress(EMPTY_PROGRESS), []);

  const newLeftToday = Math.max(0, settings.newPerDay - (progress.newLog.day === today ? progress.newLog.count : 0));
  const streak = computeStreak(progress.activeDays, today);

  const value = useMemo<Store>(
    () => ({
      ready,
      today,
      settings,
      updateSettings,
      apiKey,
      setApiKey,
      progress,
      newLeftToday,
      rateCard,
      saveItem,
      isSaved,
      removeSaved,
      markActive,
      addPassage,
      removePassage,
      recordListen,
      recordTalk,
      streak,
      resetProgress,
    }),
    [ready, today, settings, updateSettings, apiKey, setApiKey, progress, newLeftToday, rateCard, saveItem, isSaved, removeSaved, markActive, addPassage, removePassage, recordListen, recordTalk, streak, resetProgress],
  );

  // Wait for saved progress before showing screens, so nothing is built from empty state.
  return <Ctx.Provider value={value}>{ready ? children : null}</Ctx.Provider>;
}

export function useStore(): Store {
  const v = useContext(Ctx);
  if (!v) throw new Error('useStore must be used inside StoreProvider');
  return v;
}
