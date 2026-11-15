/**
 * JSON schemas the on-device model must follow. llama.cpp turns them into a grammar,
 * so the output is always valid JSON with these fields. maxLength keeps a small model
 * from rambling.
 */

const str = (maxLength: number) => ({ type: 'string', maxLength });

const pair = (enMax: number, zhMax: number) => ({
  type: 'object',
  properties: { en: str(enMax), zh: str(zhMax) },
  required: ['en', 'zh'],
  additionalProperties: false,
});

const correction = {
  type: 'object',
  properties: {
    you_said: str(160),
    better: str(160),
    better_zh: str(80),
    why_zh: str(80),
  },
  required: ['you_said', 'better', 'better_zh', 'why_zh'],
  additionalProperties: false,
};

// reply comes first so the app can show and speak it while the rest is still being written
export const TURN_SCHEMA = {
  type: 'object',
  properties: {
    reply: str(200),
    reply_zh: str(100),
    correction: { anyOf: [{ type: 'null' }, correction] },
    hint: pair(120, 60),
    done: { type: 'boolean' },
  },
  required: ['reply', 'reply_zh', 'correction', 'hint', 'done'],
  additionalProperties: false,
};

// Chinese key names make a small model answer these fields in Chinese (English keys like
// "overall_zh" were sometimes answered in English on the phone). parseSummary maps them back.
const summaryCorrection = {
  type: 'object',
  properties: {
    you_said: str(160),
    better: str(160),
    中文意思: str(80),
    原因: str(80),
  },
  required: ['you_said', 'better', '中文意思', '原因'],
  additionalProperties: false,
};

export const SUMMARY_SCHEMA = {
  type: 'object',
  properties: {
    整體評語: str(160),
    做得好的地方: { type: 'array', items: str(60), minItems: 1, maxItems: 3 },
    corrections: { type: 'array', items: summaryCorrection, maxItems: 4 },
    phrases: {
      type: 'array',
      items: {
        type: 'object',
        properties: { english: str(100), chinese: str(50) },
        required: ['english', 'chinese'],
        additionalProperties: false,
      },
      minItems: 3,
      maxItems: 5,
    },
    下次試試: str(80),
  },
  required: ['整體評語', '做得好的地方', 'corrections', 'phrases', '下次試試'],
  additionalProperties: false,
};

// Field names spell out the language ("english"/"chinese"): small models mix them up less.
const enZh = (enMax: number, zhMax: number) => ({
  type: 'object',
  properties: { english: str(enMax), chinese: str(zhMax) },
  required: ['english', 'chinese'],
  additionalProperties: false,
});

export const PASSAGE_SCHEMA = {
  type: 'object',
  properties: {
    title_zh: str(20),
    title_en: str(60),
    sentences: { type: 'array', items: enZh(140, 70), minItems: 6, maxItems: 8 },
    questions: {
      type: 'array',
      minItems: 3,
      maxItems: 3,
      items: {
        type: 'object',
        properties: {
          question: str(120),
          question_zh: str(60),
          options: { type: 'array', items: str(60), minItems: 4, maxItems: 4 },
          answer: { type: 'integer', enum: [0, 1, 2, 3] },
          explain_zh: str(80),
        },
        required: ['question', 'question_zh', 'options', 'answer', 'explain_zh'],
        additionalProperties: false,
      },
    },
    vocab: { type: 'array', items: enZh(40, 20), minItems: 3, maxItems: 5 },
  },
  required: ['title_zh', 'title_en', 'sentences', 'questions', 'vocab'],
  additionalProperties: false,
};
