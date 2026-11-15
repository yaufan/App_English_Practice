// Plays scripted weak-learner conversations through the app's real prompts and JSON schemas
// against the same on-device model, served by llama.cpp (llama-server) on the CI machine.
// Run: LLM_URL=http://127.0.0.1:8080 MODEL_NAME=qwen3.5-2b node --experimental-strip-types ci/prompt-eval.ts
import { TURN_SCHEMA, SUMMARY_SCHEMA, PASSAGE_SCHEMA } from '../src/lib/schemas.ts';
import { toTaiwan } from '../src/lib/zh.ts';
import {
  START_MESSAGE,
  conversationSystem,
  parseTurn,
  buildChatPrompt,
  CHAT_STOP,
  summarySystem,
  parseSummary,
  passageSystem,
  parsePassage,
  transcriptText,
  type Level,
} from '../src/lib/prompts.ts';
import { getScenario, freeTalkScenario, type Scenario } from '../src/data/scenarios.ts';

type ChatMessage = { role: 'user' | 'assistant'; content: string };
const URL_BASE = process.env.LLM_URL ?? 'http://127.0.0.1:8080';
const MODEL = process.env.MODEL_NAME ?? 'local';
let totalTokens = 0;
let totalMs = 0;
let rawSimplified = 0;

/** Same request the app makes (see src/lib/llm.ts): hand-built prompt, schema grammar, then OpenCC to Taiwan Chinese. */
async function callModel(o: { system: string; messages: ChatMessage[]; schema: object; maxTokens: number; temperature: number }) {
  const t0 = Date.now();
  const res = await fetch(`${URL_BASE}/completion`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      prompt: buildChatPrompt(o.system, o.messages),
      json_schema: o.schema,
      stop: CHAT_STOP,
      n_predict: o.maxTokens,
      temperature: o.temperature,
      top_p: 0.9,
      top_k: 40,
      repeat_penalty: 1.05,
    }),
  });
  if (!res.ok) throw new Error(`llama-server ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const data = (await res.json()) as { content: string; tokens_predicted?: number };
  const raw = data.content ?? '';
  if (SIMPLIFIED.test(raw)) rawSimplified += 1;
  totalTokens += data.tokens_predicted ?? 0;
  totalMs += Date.now() - t0;
  return { text: toTaiwan(raw), ms: Date.now() - t0 };
}
const LEVEL: Level = 'A2';

// Characters that only appear in Simplified Chinese (a quick Traditional-Chinese check).
const SIMPLIFIED = /[这们说个来时对吗么习语发现会为点还请让谢问题觉样关应该学经过电话开门东车马鸟鱼]/;
const CJK = /[一-鿿]/;

const out: string[] = [];
const issues: string[] = [];
const log = (s = '') => out.push(s);

function sentenceStats(text: string) {
  const sentences = text.split(/(?<=[.!?])\s+/).filter(Boolean);
  const lengths = sentences.map((s) => s.split(/\s+/).filter(Boolean).length);
  return { count: sentences.length, max: Math.max(0, ...lengths) };
}

function checkZh(label: string, zh: string, where: string) {
  if (!zh) return;
  if (!CJK.test(zh)) issues.push(`${where}: ${label} 沒有中文`);
  const m = zh.match(SIMPLIFIED);
  if (m) issues.push(`${where}: ${label} 有簡體字「${m[0]}」：${zh}`);
}

const SCRIPTS: { scenario: Scenario; lines: string[] }[] = [
  { scenario: getScenario('cafe')!, lines: ['i want latte big', 'ice. and less sugar', '我想要外帶', 'how much', 'card ok?'] },
  {
    scenario: getScenario('explain-project')!,
    lines: ['it find problem in ultrasound picture', 'we use ten thousand image for train', 'accuracy is ninety percent', 'doctor decide final', 'yes we use in hospital now'],
  },
  { scenario: getScenario('toeic-qa')!, lines: ['i exercise two time one week in park', 'because it near my home and free', 'i like run', 'in morning before work'] },
  { scenario: freeTalkScenario('週末去哪裡玩'), lines: ['i go to mountain last weekend', 'it is very beautiful but tired', 'with my family'] },
];

async function conversation(sc: Scenario, lines: string[]) {
  const where = sc.id;
  log(`## 對話：${sc.title}`);
  const system = conversationSystem(sc, LEVEL);
  const history: ChatMessage[] = [];
  const turns: { role: 'ai' | 'me'; text: string }[] = [];
  if (sc.opener.en) {
    history.push({ role: 'user', content: START_MESSAGE });
    history.push({
      role: 'assistant',
      content: JSON.stringify({ reply: sc.opener.en, reply_zh: sc.opener.zh, correction: null, hint: sc.openerHint, done: false }),
    });
    turns.push({ role: 'ai', text: sc.opener.en });
    log(`- **AI**：${sc.opener.en}`);
  } else {
    history.push({ role: 'user', content: START_MESSAGE });
    const { text: raw, ms } = await callModel({ system, messages: history, schema: TURN_SCHEMA, maxTokens: 350, temperature: 0.7 });
    const r = parseTurn(raw);
    history.push({ role: 'assistant', content: JSON.stringify(r) });
    turns.push({ role: 'ai', text: r.reply });
    log(`- **AI**：${r.reply}　（${r.reply_zh}）〔${ms} ms〕`);
  }
  for (const line of lines) {
    history.push({ role: 'user', content: line });
    turns.push({ role: 'me', text: line });
    log(`- **我**：${line}`);
    const { text: raw, ms } = await callModel({ system, messages: history, schema: TURN_SCHEMA, maxTokens: 350, temperature: 0.7 });
    const r = parseTurn(raw);
    const isJson = raw.trim().startsWith('{') || raw.includes('"reply"');
    if (!isJson) issues.push(`${where}: 回覆不是 JSON，App 會退回純文字顯示：${raw.slice(0, 80)}`);
    history.push({ role: 'assistant', content: JSON.stringify(r) });
    turns.push({ role: 'ai', text: r.reply });
    const st = sentenceStats(r.reply);
    if (st.max > 16) issues.push(`${where}: 句子太長（${st.max} 字）：${r.reply}`);
    if (st.count > 3) issues.push(`${where}: 一次講太多句（${st.count} 句）：${r.reply}`);
    if (!r.done && !r.reply.includes('?')) issues.push(`${where}: 沒有用問句接話：${r.reply}`);
    if (!r.hint.en && !r.done) issues.push(`${where}: 沒有提示句`);
    checkZh('reply_zh', r.reply_zh, where);
    checkZh('hint.zh', r.hint.zh, where);
    if (r.correction) {
      checkZh('better_zh', r.correction.better_zh, where);
      checkZh('why_zh', r.correction.why_zh, where);
    }
    if (CJK.test(line) && !r.correction) issues.push(`${where}: 學習者講中文，但沒有給英文說法`);
    if (CJK.test(r.reply)) issues.push(`${where}: 英文回覆裡混了中文：${r.reply}`);
    log(`  - **AI**：${r.reply}　（${r.reply_zh}）〔${ms} ms${r.done ? '，done' : ''}〕`);
    if (r.correction) log(`  - 修正：${r.correction.you_said} → **${r.correction.better}**（${r.correction.better_zh}）— ${r.correction.why_zh}`);
    if (r.hint.en) log(`  - 提示：${r.hint.en}（${r.hint.zh}）`);
    if (r.done) break;
  }
  const { text: raw, ms: sumMs } = await callModel({
    system: summarySystem(LEVEL),
    messages: [{ role: 'user', content: `Scenario: ${sc.titleEn}. Goal: ${sc.goal}\n\nTranscript:\n${transcriptText(turns)}` }],
    schema: SUMMARY_SCHEMA,
    maxTokens: 900,
    temperature: 0.5,
  });
  const s = parseSummary(raw);
  if (!s.overall_zh) issues.push(`${where}: 檢討沒有整體評語`);
  if (s.phrases.length < 3) issues.push(`${where}: 檢討的好用句子少於 3 句`);
  checkZh('overall_zh', s.overall_zh, where);
  s.corrections.forEach((c) => checkZh('檢討 why_zh', c.why_zh, where));
  log(`- **檢討**〔${sumMs} ms〕：${s.overall_zh}`);
  s.good_zh.forEach((g) => log(`  - 好：${g}`));
  s.corrections.forEach((c) => log(`  - 改：${c.you_said} → **${c.better}**（${c.better_zh}）— ${c.why_zh}`));
  s.phrases.forEach((p) => log(`  - 句：${p.en}（${p.zh}）`));
  log(`  - 下次：${s.next_zh}`);
  log();
}

async function passage() {
  log('## AI 產生聽力短文（AI 工作／介紹語音辨識系統）');
  const { text: raw, ms: pMs } = await callModel({
    system: passageSystem(LEVEL),
    messages: [
      {
        role: 'user',
        content:
          'Type: a workplace situation in a hospital medical AI team (meetings, projects, vendors, doctors), using simple words.\nTopic (may be written in Chinese): 介紹語音辨識系統',
      },
    ],
    schema: PASSAGE_SCHEMA,
    maxTokens: 1400,
    temperature: 0.7,
  });
  const p = parsePassage(raw, 'work');
  log(`〔${pMs} ms〕**${p.title}**（${p.titleEn}）`);
  if (p.sentences.length < 6 || p.sentences.length > 8) issues.push(`短文：句數 ${p.sentences.length}（應 6–8）`);
  if (p.questions.length !== 3) issues.push(`短文：題目 ${p.questions.length} 題（應 3 題）`);
  p.sentences.forEach((x) => {
    const st = sentenceStats(x.en);
    if (st.max > 16) issues.push(`短文句子太長（${st.max} 字）：${x.en}`);
    checkZh('句子中文', x.zh, '短文');
    log(`- ${x.en}　（${x.zh}）`);
  });
  p.questions.forEach((q, i) => {
    log(`- Q${i + 1} ${q.q}（${q.qZh}）答案：${q.options[q.answer]}`);
    checkZh('題目中文', q.qZh, '短文');
  });
  log();
}

async function main() {
  log(`# 離線模型回覆檢查：${MODEL}`);
  log(`難度：${LEVEL}。用 llama.cpp 跑和 App 一樣的模型檔、prompt 和 JSON 格式（CI 電腦的速度不代表手機速度）。`);
  log();
  for (const s of SCRIPTS) {
    try {
      await conversation(s.scenario, s.lines);
    } catch (e) {
      issues.push(`${s.scenario.id}: 失敗 ${(e as Error).message}`);
      log(`（失敗：${(e as Error).message}）`);
    }
  }
  try {
    await passage();
  } catch (e) {
    issues.push(`短文：失敗 ${(e as Error).message}`);
  }
  log('## 統計');
  log(`- 產生 ${totalTokens} 個 token，共 ${(totalMs / 1000).toFixed(0)} 秒`);
  log(`- 模型原始輸出含簡體字的次數：${rawSimplified}（App 會自動轉成繁體）`);
  log('## 發現的問題');
  if (issues.length === 0) log('沒有');
  issues.forEach((i) => log(`- ${i}`));
  console.log(out.join('\n'));
}

main();
