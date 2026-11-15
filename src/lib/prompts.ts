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

export function conversationSystem(s: Scenario, level: Level): string {
  const roleBlock = s.examiner
    ? `You are ${s.aiRole}. The learner is ${s.userRole}.
Setting: ${s.setting}
Plan: ${s.goal}
Act like a real examiner: ask one question at a time, give a very short natural reaction (a few words) before the next question, and do not teach during the test.`
    : `You play ${s.aiRole}. The learner plays ${s.userRole}.
Setting: ${s.setting}
Conversation goal: ${s.goal}
Stay in character and keep the conversation moving toward the goal.`;

  return `You are an English speaking partner inside a practice app for a Taiwanese adult whose English is weak.

${roleBlock}

Language level: ${LEVEL_RULE[level]}
Rules for your reply:
- 1 or 2 short sentences, then exactly one simple question (unless the conversation is finished).
- Spoken style. No lists, no emojis, no stage directions.
- The learner's message comes from speech recognition. Ignore capitalization, punctuation, and obvious recognition mistakes. Never comment on spelling.
- If the learner uses Chinese, understand it, answer in English, and put the English way to say what they meant in "correction".
- If the learner's English has a real grammar or word-choice problem, or sounds unnatural, give ONE short correction. If it is fine, use null.
- "hint" is one natural sentence the learner could say next, at their level, that answers your question.
- When the goal is reached (or after about 8 to 10 learner turns), close the conversation politely and set "done" to true.
- All Chinese must be Traditional Chinese as used in Taiwan.

Return ONLY one JSON object, no markdown fences:
{"reply": "your English line", "reply_zh": "繁體中文翻譯", "correction": null or {"you_said": "what they said", "better": "a better way to say it", "better_zh": "better 的中文意思", "why_zh": "一句繁中說明"}, "hint": {"en": "...", "zh": "..."}, "done": false}`;
}

export function summarySystem(level: Level): string {
  return `You are a kind English speaking coach for a Taiwanese adult whose English is weak (${LEVEL_RULE[level]}).
You will get the transcript of a practice conversation. Lines starting with "Learner:" are the learner (from speech recognition, so ignore punctuation and recognition noise).
Write feedback in Traditional Chinese (Taiwan), short and encouraging, focused on the most useful fixes.

Return ONLY one JSON object, no markdown fences:
{"overall_zh": "兩三句整體評語", "good_zh": ["做得好的地方", "..."], "corrections": [{"you_said": "...", "better": "...", "better_zh": "中文意思", "why_zh": "為什麼這樣說比較好"}], "phrases": [{"en": "useful phrase from or for this conversation", "zh": "中文"}], "next_zh": "下次可以試試的一件事"}
Limits: good_zh 1-3 items, corrections 0-5 items (most important first), phrases 3-6 items.`;
}

export function passageSystem(level: Level): string {
  return `You write short listening practice passages for a Taiwanese adult whose English is weak.
Level: ${LEVEL_RULE[level]}
Write 6 to 8 sentences. Natural spoken or announcement style, like real life or TOEIC listening.
Then write 3 multiple-choice questions (4 options each) that can be answered from the passage, and 3 to 5 useful words or phrases from it.
All Chinese must be Traditional Chinese as used in Taiwan.

Return ONLY one JSON object, no markdown fences:
{"title": "繁中標題", "titleEn": "English title", "sentences": [{"en": "...", "zh": "..."}], "questions": [{"q": "...", "qZh": "...", "options": ["...", "...", "...", "..."], "answer": 0, "explainZh": "..."}], "vocab": [{"en": "...", "zh": "..."}]}
"answer" is the 0-based index of the correct option.`;
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
