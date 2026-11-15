/** Helpers to compare what the learner said or typed with the target English. */

const CONTRACTIONS: Record<string, string> = {
  "i'm": 'i am',
  "you're": 'you are',
  "we're": 'we are',
  "they're": 'they are',
  "it's": 'it is',
  "that's": 'that is',
  "what's": 'what is',
  "there's": 'there is',
  "let's": 'let us',
  "i'll": 'i will',
  "you'll": 'you will',
  "we'll": 'we will',
  "i'd": 'i would',
  "don't": 'do not',
  "doesn't": 'does not',
  "didn't": 'did not',
  "can't": 'cannot',
  "won't": 'will not',
  "isn't": 'is not',
  "aren't": 'are not',
  "i've": 'i have',
};

export function normalize(text: string): string[] {
  let t = text
    .toLowerCase()
    .replace(/[’‘`]/g, "'")
    .replace(/é/g, 'e')
    .replace(/[“”"]/g, ' ');
  // keep apostrophes inside words, drop other punctuation
  t = t.replace(/[^a-z0-9'\s-]/g, ' ').replace(/-/g, ' ');
  const words: string[] = [];
  for (const raw of t.split(/\s+/)) {
    const w = raw.replace(/^'+|'+$/g, '');
    if (!w) continue;
    const expanded = CONTRACTIONS[w];
    if (expanded) words.push(...expanded.split(' '));
    else words.push(w.replace(/'/g, ''));
  }
  return words;
}

/** Longest common subsequence length of two word arrays. */
function lcs(a: string[], b: string[]): number {
  const dp = Array.from({ length: a.length + 1 }, () => new Array<number>(b.length + 1).fill(0));
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      dp[i][j] = a[i - 1] === b[j - 1] ? dp[i - 1][j - 1] + 1 : Math.max(dp[i - 1][j], dp[i][j - 1]);
    }
  }
  return dp[a.length][b.length];
}

/**
 * Score 0..1 of how much of the target was said.
 * "…" in the target is a placeholder: those words are optional.
 */
export function similarity(target: string, said: string): number {
  if (target.includes(' / ')) {
    return Math.max(...target.split(' / ').map((alt) => similarity(alt, said)));
  }
  const parts = target.split(/…|\.\.\./);
  const required = normalize(parts.join(' '));
  const got = normalize(said);
  if (required.length === 0) return got.length > 0 ? 1 : 0;
  return lcs(required, got) / required.length;
}

export function isCloseEnough(target: string, said: string, threshold = 0.8): boolean {
  return similarity(target, said) >= threshold;
}

export type DiffWord = { word: string; ok: boolean };

/** Mark each word of the target as heard/typed (ok) or missing. Used for dictation. */
export function diffWords(target: string, typed: string): DiffWord[] {
  const display = target.split(/\s+/).filter(Boolean);
  const norm = display.map((w) => normalize(w).join(' '));
  const got = normalize(typed);
  // greedy in-order matching on normalized tokens
  const result: DiffWord[] = [];
  let j = 0;
  for (let i = 0; i < display.length; i++) {
    const tokens = norm[i].split(' ').filter(Boolean);
    if (tokens.length === 0) {
      result.push({ word: display[i], ok: true });
      continue;
    }
    let k = j;
    let matched = 0;
    for (const tok of tokens) {
      const idx = got.indexOf(tok, k);
      if (idx !== -1 && idx - k <= 3) {
        matched += 1;
        k = idx + 1;
      }
    }
    const ok = matched === tokens.length;
    if (ok) j = k;
    result.push({ word: display[i], ok });
  }
  return result;
}
