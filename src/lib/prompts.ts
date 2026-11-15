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
Stay in character and move toward the goal. Remember what the learner already told you.`;

  return `You are an English speaking partner for a Taiwanese adult with weak English.
${role}

Level: ${LEVEL_RULE[level]}
Fields:
- "reply": YOUR next line. 1 or 2 short spoken sentences, ending with one simple question. No emojis.
- "reply_zh": Traditional Chinese (Taiwan) translation of your reply.
- "correction": look ONLY at the learner's last message. If it has a grammar mistake, a missing word, or is written in Chinese, put the learner's own message fixed into "better" (same meaning, natural English), its Chinese meaning in "better_zh", and a very short reason in "why_zh". If it is already fine, use null. Never correct your own lines.
- "hint": a sentence the LEARNER (${s.userRole}) could say next to answer your question. Not your line.
- "done": true only when the goal is finished; then say goodbye in reply.
The learner's text comes from speech recognition: ignore punctuation and capital letters.

Example (a different situation, only to show the format). You asked "Where are you from?" and the learner said "i from taipei city":
{"reply":"Nice! Do you like living there?","reply_zh":"不錯！你喜歡住在那裡嗎？","correction":{"you_said":"i from taipei city","better":"I'm from Taipei.","better_zh":"我來自台北。","why_zh":"少了 am；說城市名就好。"},"hint":{"en":"Yes, I like it. The food is great.","zh":"喜歡，那裡的食物很棒。"},"done":false}`;
}

export function summarySystem(level: Level): string {
  return `You are a kind English coach for a Taiwanese adult with weak English (${LEVEL_RULE[level]}).
You get a practice conversation. Only lines starting with "Learner:" are the learner. Never correct "Partner:" lines.
The learner's lines come from speech recognition, so ignore punctuation and capital letters.
Write short, encouraging feedback. Every field with a Chinese name must be written in Traditional Chinese (Taiwan).
- 整體評語: 2 sentences about how it went.
- 做得好的地方: 1 to 3 things the learner did well.
- corrections: up to 4 learner lines that had real mistakes. "better" is that same line fixed in English, keeping the learner's meaning; 中文意思 is its meaning; 原因 is a short reason. Skip lines that were already fine.
- phrases: 3 to 5 useful English sentences for this situation ("english") with Chinese ("chinese").
- 下次試試: one thing to try next time.`;
}

export function passageSystem(level: Level): string {
  return `You write short English listening passages for a Taiwanese adult with weak English.
Level: ${LEVEL_RULE[level]}
- sentences: 6 to 8 short sentences. "english" is the sentence in English. "chinese" is its Traditional Chinese (Taiwan) translation.
- questions: 3 multiple-choice questions in English about the passage, 4 English options each, only one correct. "answer" is the index (0-3) of the correct option. "question_zh" translates the question; "explain_zh" explains the answer in Chinese.
- vocab: 3 to 5 English words or phrases from the passage with Chinese meanings.
- title_zh: a short Chinese title. title_en: an English title.
The "english" fields must contain only English.`;
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
  const en = str(o.en) || str(o.english);
  if (!en) return null;
  return { en, zh: cleanZh(str(o.zh) || str(o.chinese)) };
}

function asCorrection(v: unknown): Correction | null {
  if (!v || typeof v !== 'object') return null;
  const o = v as Record<string, unknown>;
  const better = str(o.better);
  if (!better) return null;
  return { you_said: str(o.you_said), better, better_zh: cleanZh(str(o.better_zh)), why_zh: cleanZh(str(o.why_zh)) };
}

/** Drops stray JSON punctuation a small model sometimes leaves at the end of a Chinese string, e.g. 「…？」},」. */
export function cleanZh(s: string): string {
  return s.replace(/[\s"'}\]\[,，]+$/u, '').replace(/」+$/u, (m) => ((s.match(/「/g) ?? []).length >= m.length ? m : '')).trim();
}

// ── Guards: a small model sometimes writes Chinese where English belongs, or "corrects"
// a sentence into the same sentence. Those outputs are dropped instead of shown to a learner.

const CJK = /[\u3400-\u9fff]/;
export const hasChinese = (s: string) => CJK.test(s);
const loose = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

function usableCorrection(c: Correction | null): Correction | null {
  if (!c) return null;
  if (hasChinese(c.better)) return null;
  if (c.you_said && loose(c.you_said) === loose(c.better)) return null;
  return c;
}

function englishPair(p: Pair | null): Pair | null {
  return p && !hasChinese(p.en) ? p : null;
}

/** Learner turns needed before the app accepts that the conversation is finished. */
export const MIN_TURNS_BEFORE_DONE = 4;

export function parseTurn(text: string): TurnReply {
  let o: Record<string, unknown>;
  try {
    o = extractJson(text) as Record<string, unknown>;
  } catch {
    // A short plain sentence can still be used; anything longer is the model rambling, not a reply.
    const plain = text.trim();
    if (plain && plain.length <= 160 && !plain.includes('{')) {
      return { reply: plain, reply_zh: '', correction: null, hint: { en: '', zh: '' }, done: false };
    }
    throw new Error('AI 這次的回覆格式不對，請按「重試」。');
  }
  const reply = str(o.reply);
  if (!reply) throw new Error('AI 沒有回覆內容');
  return {
    reply,
    reply_zh: cleanZh(str(o.reply_zh)),
    correction: usableCorrection(asCorrection(o.correction)),
    hint: englishPair(asPair(o.hint)) ?? { en: '', zh: '' },
    done: o.done === true,
  };
}

export function parseSummary(text: string): Summary {
  const o = extractJson(text) as Record<string, unknown>;
  const arr = (v: unknown) => (Array.isArray(v) ? v : []);
  return {
    overall_zh: cleanZh(str(o.整體評語) || str(o.overall_zh)),
    good_zh: arr(o.做得好的地方 ?? o.good_zh).map((x) => cleanZh(str(x))).filter(Boolean),
    corrections: arr(o.corrections)
      .map((c) => {
        const r = (c ?? {}) as Record<string, unknown>;
        return usableCorrection(asCorrection({ ...r, better_zh: r.中文意思 ?? r.better_zh, why_zh: r.原因 ?? r.why_zh }));
      })
      .filter((x): x is Correction => !!x),
    phrases: arr(o.phrases)
      .map((p) => englishPair(asPair(p)))
      .filter((x): x is Pair => !!x),
    next_zh: cleanZh(str(o.下次試試) || str(o.next_zh)),
  };
}

export function parsePassage(text: string, category: Category): Passage {
  const o = extractJson(text) as Record<string, unknown>;
  const arr = (v: unknown) => (Array.isArray(v) ? v : []);
  const sentences = arr(o.sentences)
    .map(asPair)
    .filter((x): x is Pair => !!x && !hasChinese(x.en) && /[a-zA-Z]/.test(x.en));
  if (sentences.length < 4) throw new Error('AI 這次寫的短文不能用（英文句子太少或混了中文），請再產生一次。');
  const questions: Question[] = arr(o.questions)
    .map((q) => {
      if (!q || typeof q !== 'object') return null;
      const r = q as Record<string, unknown>;
      const options = arr(r.options).map((x) => str(x)).filter(Boolean);
      const answer = typeof r.answer === 'number' ? Math.round(r.answer) : -1;
      if (!r.q && r.question) r.q = r.question;
      if (!str(r.q) || hasChinese(str(r.q)) || options.length < 2 || answer < 0 || answer >= options.length) return null;
      if (options.some(hasChinese)) return null;
      return { q: str(r.q), qZh: str(r.qZh) || str(r.question_zh), options, answer, explainZh: str(r.explainZh) || str(r.explain_zh) };
    })
    .filter((x): x is Question => !!x);
  const now = Date.now();
  return {
    id: `gen-${now}`,
    category,
    title: str(o.title_zh) || str(o.title, 'AI 產生的短文'),
    titleEn: str(o.title_en) || str(o.titleEn),
    sentences,
    questions,
    vocab: arr(o.vocab)
      .map((p) => englishPair(asPair(p)))
      .filter((x): x is Pair => !!x),
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

/**
 * Builds the Qwen chat prompt by hand. Letting the model's own template decide caused thinking
 * blocks on the phone; this prompt ends with an already-closed empty thinking block (Qwen's
 * "no thinking" form), and the JSON grammar then applies from the very first token.
 */
export const CHAT_STOP = ['<|im_end|>', '<|endoftext|>', '<|im_start|>'];

export function buildChatPrompt(system: string, messages: { role: 'user' | 'assistant'; content: string }[]): string {
  const parts = [`<|im_start|>system\n${system}<|im_end|>`];
  for (const m of messages) parts.push(`<|im_start|>${m.role}\n${m.content}<|im_end|>`);
  parts.push('<|im_start|>assistant\n<think>\n\n</think>\n\n');
  return parts.join('\n');
}
