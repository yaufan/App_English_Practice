import { DECKS, SAVED_DECK_ID, type VocabItem } from '../data/decks';
import type { SavedItem } from './store';

export const ALL_DECK_ID = 'all';

export function deckItems(deckId: string, saved: SavedItem[]): VocabItem[] {
  if (deckId === SAVED_DECK_ID) return saved;
  if (deckId === ALL_DECK_ID) return [...saved, ...DECKS.flatMap((d) => d.items)];
  return DECKS.find((d) => d.id === deckId)?.items ?? [];
}

export function deckTitle(deckId: string): string {
  if (deckId === SAVED_DECK_ID) return '我的收藏';
  if (deckId === ALL_DECK_ID) return '全部單字';
  return DECKS.find((d) => d.id === deckId)?.title ?? '單字';
}

export function itemMap(saved: SavedItem[]): Map<string, VocabItem> {
  const m = new Map<string, VocabItem>();
  for (const d of DECKS) for (const it of d.items) m.set(it.id, it);
  for (const it of saved) m.set(it.id, it);
  return m;
}
