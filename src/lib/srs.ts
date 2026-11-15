/**
 * Simple spaced-repetition scheduling (SM-2 style, three buttons).
 * Days are counted as local calendar days since epoch so "due today" is stable.
 */

export type CardState = {
  due: number; // local day number
  interval: number; // days
  ease: number;
  reps: number; // successful reviews in a row
  lapses: number;
  seen: number; // first day it was introduced
};

export type Rating = 'again' | 'hard' | 'good';

export const RATING_LABEL: Record<Rating, string> = {
  again: '忘了',
  hard: '模糊',
  good: '記得',
};

export function dayNumber(date: Date = new Date()): number {
  const local = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  return Math.round(local.getTime() / 86_400_000);
}

export function newCard(today: number): CardState {
  return { due: today, interval: 0, ease: 2.5, reps: 0, lapses: 0, seen: today };
}

export function schedule(prev: CardState | undefined, rating: Rating, today: number): CardState {
  const s: CardState = prev ? { ...prev } : newCard(today);
  if (rating === 'again') {
    s.reps = 0;
    s.lapses += 1;
    s.interval = 0;
    s.ease = Math.max(1.3, s.ease - 0.2);
    s.due = today; // shows again in the same session, then tomorrow at the latest
    return s;
  }
  if (rating === 'hard') {
    s.interval = s.reps === 0 ? 1 : Math.max(1, Math.round(s.interval * 1.2));
    s.ease = Math.max(1.3, s.ease - 0.15);
    s.reps += 1;
    s.due = today + s.interval;
    return s;
  }
  // good
  if (s.reps === 0) s.interval = 2;
  else if (s.reps === 1) s.interval = 5;
  else s.interval = Math.max(s.interval + 1, Math.round(s.interval * s.ease));
  s.ease = Math.min(3.0, s.ease + 0.05);
  s.reps += 1;
  s.due = today + s.interval;
  return s;
}

/** Text shown under each button, e.g. "明天", "3 天後". */
export function previewInterval(prev: CardState | undefined, rating: Rating, today: number): string {
  const next = schedule(prev, rating, today);
  const d = next.due - today;
  if (d <= 0) return '再一次';
  if (d === 1) return '明天';
  if (d < 30) return `${d} 天後`;
  return `${Math.round(d / 30)} 個月後`;
}

export type QueueInput = {
  itemIds: string[];
  states: Record<string, CardState>;
  today: number;
  newLimit: number;
};

/** Due reviews first (oldest due first), then up to newLimit unseen cards in deck order. */
export function buildQueue({ itemIds, states, today, newLimit }: QueueInput): string[] {
  const due = itemIds
    .filter((id) => states[id] && states[id].due <= today)
    .sort((a, b) => states[a].due - states[b].due);
  const fresh = itemIds.filter((id) => !states[id]).slice(0, Math.max(0, newLimit));
  return [...due, ...fresh];
}

export function countDue(itemIds: string[], states: Record<string, CardState>, today: number): number {
  return itemIds.filter((id) => states[id] && states[id].due <= today).length;
}

export function countLearned(itemIds: string[], states: Record<string, CardState>): number {
  return itemIds.filter((id) => states[id] && states[id].reps > 0).length;
}
