import type { Pair, Scenario, Category } from '../data/scenarios';
import type { Passage, Question } from '../data/listening';

export type Level = 'A1' | 'A2' | 'B1';

export const LEVEL_LABEL: Record<Level, string> = {
  A1: '入門（很簡單的字和短句）',
  A2: '初級（日常短句）',
  B1: '中級（可以稍微長一點）',
};

const LEVEL_RULE: Record<Level, string> = {
  A1: 'CEFR A1. Use only very common words. Each sentence at most 8 words. Present tense mostly.',
  A2: 'CEFR A2. Use common everyday words. Each sentence at most 12 words.',
  B1: 'CEFR B1. Use clear, natural English. Each sentence at most 18 words.',
};

export type Correction = { you_said: string; better: string; better_zh: string; why_zh: string };

export type TurnReply = {
  reply: string;
  reply_zh: string;
  correction: Correction | null;
  hint: Pair;
  done: boolean;
};

export type Summary = {
  overall_zh: string;
  good_zh: string[];
  corrections: Correction[];
  phrases: Pair[];
  next_zh: string;
};

export const START_MESSAGE = '(The conversation starts now. Please say your first line.)';

// Prompts are written for a small on-device model: short rules, one worked example,
// and the JSON shape is enforced separately by a schema (see schemas.ts).

export function conversationSystem(s: Scenario, level: Level): string {
  const role = s.examiner
    ? `You are ${s.aiRole}. The learner is ${s.userRole}.
Setting: ${s.setting}
Plan: ${s.goal}
Ask one question at a time. Give a few words of reaction, then the next question. Do not teach.`
    : `You are ${s.aiRole}. The learner is ${s.userRole}.
Setting: ${s.setting}
Goal: ${s.goal}
Stay in character and move toward the goal.`;

  return `You are an English speaking partner for a Taiwanese adult with weak English.
${role}

Level: ${LEVEL_RULE[level]}
Rules:
- "reply": 1 or 2 short spoken sentences, ending with one simple question. No emojis.
- "reply_zh": Traditional Chinese (Taiwan) translation of reply.
- The learner's text comes from speech recognition: ignore punctuation, capital letters and small recognition errors.
- "correction": if the learner's English is wrong or unnatural, or they used Chinese, give the correct English in "better". Otherwise null.
- "hint": one easy sentence the learner could say next to answer your question, with Chinese.
- "done": true only when the goal is finished (or after about 8 learner turns); then say goodbye in reply.

Example. Learner: "i want coffee hot"
{"reply":"Sure! What size would you like?","reply_zh":"好的！你要什麼大小？","correction":{"you_said":"i want coffee hot","better":"I'd like a hot coffee, please.","better_zh":"我想要一杯熱咖啡。","why_zh":"點餐說 I'd like 比較禮貌；hot 要放在 coffee 前面。"},"hint":{"en":"A large one, please.","zh":"大杯的，謝謝。"},"done":false}`;
}

export function summarySystem(level: Level): string {
  return `You are a kind English coach for a Taiwanese adult with weak English (${LEVEL_RULE[level]}).
You get a practice conversation. "Learner:" lines are the learner (speech recognition, so ignore punctuation).
Write short, encouraging feedback in Traditional Chinese (Taiwan):
- overall_zh: 2 sentences about how it went.
- good_zh: 1 to 3 things done well.
- corrections: up to 4 of the learner's most important mistakes, each with the better English, its Chinese meaning, and why.
- phrases: 3 to 5 useful English sentences for this situation, with Chinese.
- next_zh: one thing to try next time.`;
}

export function passageSystem(level: Level): string {
  return `You write short English listening passages for a Taiwanese adult with weak English.
Level: ${LEVEL_RULE[level]}
- sentences: 6 to 8 short sentences in natural spoken or announcement style, each with a Traditional Chinese (Taiwan) translation.
- questions: 3 multiple-choice questions answered by the passage. 4 options each, only one correct. "answer" is the index (0-3) of the correct option. Explain the answer in Chinese.
- vocab: 3 to 5 useful words or phrases from the passage with Chinese.
- title: a short Chinese title; titleEn: an English title.`;
}

/** Extract the first JSON object from model text (tolerates fences or stray text). */
export function extractJson(text: string): unknown {
  const cleaned = text.replace(/```(?:json)?/gi, '').trim();
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  if (start === -1 || end <= start) throw new Error('AI 回傳的格式不正確');
  return JSON.parse(cleaned.slice(start, end + 1));
}

const str = (v: unknown, fallback = ''): string => (typeof v === 'string' ? v.trim() : fallback);

function asPair(v: unknown): Pair | null {
  if (!v || typeof v !== 'object') return null;
  const o = v as Record<string, unknown>;
  const en = str(o.en);
  if (!en) return null;
  return { en, zh: str(o.zh) };
}

function asCorrection(v: unknown): Correction | null {
  if (!v || typeof v !== 'object') return null;
  const o = v as Record<string, unknown>;
  const better = str(o.better);
  if (!better) return null;
  return { you_said: str(o.you_said), better, better_zh: str(o.better_zh), why_zh: str(o.why_zh) };
}

export function parseTurn(text: string): TurnReply {
  let o: Record<string, unknown>;
  try {
    o = extractJson(text) as Record<string, unknown>;
  } catch {
    // Fall back to plain text so the conversation can continue.
    return { reply: text.trim(), reply_zh: '', correction: null, hint: { en: '', zh: '' }, done: false };
  }
  const reply = str(o.reply);
  if (!reply) throw new Error('AI 沒有回覆內容');
  return {
    reply,
    reply_zh: str(o.reply_zh),
    correction: asCorrection(o.correction),
    hint: asPair(o.hint) ?? { en: '', zh: '' },
    done: o.done === true,
  };
}

export function parseSummary(text: string): Summary {
  const o = extractJson(text) as Record<string, unknown>;
  const arr = (v: unknown) => (Array.isArray(v) ? v : []);
  return {
    overall_zh: str(o.overall_zh),
    good_zh: arr(o.good_zh).map((x) => str(x)).filter(Boolean),
    corrections: arr(o.corrections).map(asCorrection).filter((x): x is Correction => !!x),
    phrases: arr(o.phrases).map(asPair).filter((x): x is Pair => !!x),
    next_zh: str(o.next_zh),
  };
}

export function parsePassage(text: string, category: Category): Passage {
  const o = extractJson(text) as Record<string, unknown>;
  const arr = (v: unknown) => (Array.isArray(v) ? v : []);
  const sentences = arr(o.sentences).map(asPair).filter((x): x is Pair => !!x);
  if (sentences.length < 2) throw new Error('AI 產生的短文太短，請再試一次');
  const questions: Question[] = arr(o.questions)
    .map((q) => {
      if (!q || typeof q !== 'object') return null;
      const r = q as Record<string, unknown>;
      const options = arr(r.options).map((x) => str(x)).filter(Boolean);
      const answer = typeof r.answer === 'number' ? Math.round(r.answer) : -1;
      if (!str(r.q) || options.length < 2 || answer < 0 || answer >= options.length) return null;
      return { q: str(r.q), qZh: str(r.qZh), options, answer, explainZh: str(r.explainZh) };
    })
    .filter((x): x is Question => !!x);
  const now = Date.now();
  return {
    id: `gen-${now}`,
    category,
    title: str(o.title, 'AI 產生的短文'),
    titleEn: str(o.titleEn),
    sentences,
    questions,
    vocab: arr(o.vocab).map(asPair).filter((x): x is Pair => !!x),
    generated: true,
    createdAt: now,
  };
}

export function transcriptText(turns: { role: 'ai' | 'me'; text: string }[]): string {
  return turns.map((t) => `${t.role === 'ai' ? 'Partner' : 'Learner'}: ${t.text}`).join('\n');
}

/** Pulls the (possibly unfinished) "reply" string out of partial JSON while the model streams. */
export function partialReply(raw: string): { text: string; complete: boolean } | null {
  const m = raw.match(/"reply"\s*:\s*"((?:[^"\\]|\\.)*)("?)/);
  if (!m) return null;
  let text = m[1];
  try {
    text = JSON.parse(`"${text.replace(/\\$/, '')}"`);
  } catch {
    // keep the raw text if an escape sequence is cut in half
  }
  return { text, complete: m[2] === '"' };
}
