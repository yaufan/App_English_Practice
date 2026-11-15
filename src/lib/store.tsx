import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DEFAULT_MODEL, MODELS, LlmError, deleteModel, downloadModel, isDownloaded, unloadModel, type ModelId } from './llm';
import type { Level } from './prompts';
import { type CardState, type Rating, dayNumber, schedule } from './srs';
import type { VocabItem } from '../data/decks';
import type { Passage } from '../data/listening';

export type Settings = {
  modelId: ModelId;
  level: Level;
  rate: number;
  voice: string;
  showZh: boolean;
  autoPlay: boolean;
  newPerDay: number;
};

export const DEFAULT_SETTINGS: Settings = {
  modelId: DEFAULT_MODEL,
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
type Store = {
  ready: boolean;
  today: number;
  settings: Settings;
  updateSettings: (patch: Partial<Settings>) => void;
  /** Which models are fully downloaded on this phone. */
  downloaded: Record<ModelId, boolean>;
  modelReady: boolean;
  download: { id: ModelId; fraction: number; mbDone: number; mbTotal: number } | null;
  downloadError: string | null;
  startDownload: (id: ModelId) => void;
  cancelDownload: () => void;
  removeModel: (id: ModelId) => Promise<void>;
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
  const [downloaded, setDownloaded] = useState<Record<ModelId, boolean>>(
    () => Object.fromEntries(MODELS.map((m) => [m.id, false])) as Record<ModelId, boolean>,
  );
  const [download, setDownload] = useState<Store['download']>(null);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const [today, setToday] = useState(dayNumber());
  const loaded = useRef(false);

  useEffect(() => {
    (async () => {
      try {
        const [s, p] = await Promise.all([AsyncStorage.getItem(K_SETTINGS), AsyncStorage.getItem(K_PROGRESS)]);
        if (s) {
          const saved = JSON.parse(s);
          const modelId = MODELS.some((m) => m.id === saved.modelId) ? saved.modelId : DEFAULT_MODEL;
          setSettings({ ...DEFAULT_SETTINGS, ...saved, modelId });
        }
        if (p) setProgress({ ...EMPTY_PROGRESS, ...JSON.parse(p) });
      } catch {
        // corrupted storage: start fresh rather than crash
      }
      refreshDownloaded();
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

  function refreshDownloaded() {
    setDownloaded(Object.fromEntries(MODELS.map((m) => [m.id, isDownloaded(m.id)])) as Record<ModelId, boolean>);
  }

  const startDownload = useCallback((id: ModelId) => {
    if (abortRef.current) return;
    const ac = new AbortController();
    abortRef.current = ac;
    setDownloadError(null);
    setDownload({ id, fraction: 0, mbDone: 0, mbTotal: 0 });
    let last = 0;
    downloadModel(
      id,
      (fraction, mbDone, mbTotal) => {
        // keep re-renders to a few per second
        const now = Date.now();
        if (now - last < 400 && fraction < 1) return;
        last = now;
        setDownload({ id, fraction, mbDone, mbTotal });
      },
      ac.signal,
    )
      .then(() => setSettings((st) => ({ ...st, modelId: id })))
      .catch((e) => setDownloadError(e instanceof LlmError ? e.message : `下載失敗：${(e as Error).message}`))
      .finally(() => {
        abortRef.current = null;
        setDownload(null);
        refreshDownloaded();
      });
  }, []);

  const cancelDownload = useCallback(() => abortRef.current?.abort(), []);

  const removeModel = useCallback(async (id: ModelId) => {
    await deleteModel(id);
    refreshDownloaded();
  }, []);

  // switching models frees the memory held by the previous one
  useEffect(() => {
    unloadModel();
  }, [settings.modelId]);

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
      downloaded,
      modelReady: downloaded[settings.modelId],
      download,
      downloadError,
      startDownload,
      cancelDownload,
      removeModel,
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
    [ready, today, settings, updateSettings, downloaded, download, downloadError, startDownload, cancelDownload, removeModel, progress, newLeftToday, rateCard, saveItem, isSaved, removeSaved, markActive, addPassage, removePassage, recordListen, recordTalk, streak, resetProgress],
  );

  // Wait for saved progress before showing screens, so nothing is built from empty state.
  return <Ctx.Provider value={value}>{ready ? children : null}</Ctx.Provider>;
}

export function useStore(): Store {
  const v = useContext(Ctx);
  if (!v) throw new Error('useStore must be used inside StoreProvider');
  return v;
}
