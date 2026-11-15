// Plays scripted weak-learner conversations through the app's real prompts and checks the AI replies.
// Run: API_KEY=... node --experimental-strip-types ci/prompt-eval.ts > ci-results/prompt-eval.md
import { callClaude, type ChatMessage, type ModelId } from '../src/lib/claude.ts';
import {
  START_MESSAGE,
  conversationSystem,
  parseTurn,
  summarySystem,
  parseSummary,
  passageSystem,
  parsePassage,
  transcriptText,
  type Level,
} from '../src/lib/prompts.ts';
import { getScenario, freeTalkScenario, type Scenario } from '../src/data/scenarios.ts';

const KEY = process.env.API_KEY ?? '';
const MODEL = (process.env.MODEL as ModelId) || 'claude-haiku-5-5';
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
    const t0 = Date.now();
    const raw = await callClaude({ apiKey: KEY, model: MODEL, system, messages: history, maxTokens: 500 });
    const r = parseTurn(raw);
    history.push({ role: 'assistant', content: raw });
    turns.push({ role: 'ai', text: r.reply });
    log(`- **AI**：${r.reply}　（${r.reply_zh}）〔${Date.now() - t0} ms〕`);
  }
  for (const line of lines) {
    history.push({ role: 'user', content: line });
    turns.push({ role: 'me', text: line });
    log(`- **我**：${line}`);
    const t0 = Date.now();
    const raw = await callClaude({ apiKey: KEY, model: MODEL, system, messages: history, maxTokens: 500 });
    const ms = Date.now() - t0;
    const r = parseTurn(raw);
    const isJson = raw.trim().startsWith('{') || raw.includes('"reply"');
    if (!isJson) issues.push(`${where}: 回覆不是 JSON，App 會退回純文字顯示：${raw.slice(0, 80)}`);
    history.push({ role: 'assistant', content: raw });
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
  const t0 = Date.now();
  const raw = await callClaude({
    apiKey: KEY,
    model: MODEL,
    system: summarySystem(LEVEL),
    messages: [{ role: 'user', content: `Scenario: ${sc.titleEn}. Goal: ${sc.goal}\n\nTranscript:\n${transcriptText(turns)}` }],
    maxTokens: 1200,
    timeoutMs: 60_000,
  });
  const s = parseSummary(raw);
  if (!s.overall_zh) issues.push(`${where}: 檢討沒有整體評語`);
  if (s.phrases.length < 3) issues.push(`${where}: 檢討的好用句子少於 3 句`);
  checkZh('overall_zh', s.overall_zh, where);
  s.corrections.forEach((c) => checkZh('檢討 why_zh', c.why_zh, where));
  log(`- **檢討**〔${Date.now() - t0} ms〕：${s.overall_zh}`);
  s.good_zh.forEach((g) => log(`  - 好：${g}`));
  s.corrections.forEach((c) => log(`  - 改：${c.you_said} → **${c.better}**（${c.better_zh}）— ${c.why_zh}`));
  s.phrases.forEach((p) => log(`  - 句：${p.en}（${p.zh}）`));
  log(`  - 下次：${s.next_zh}`);
  log();
}

async function passage() {
  log('## AI 產生聽力短文（AI 工作／介紹語音辨識系統）');
  const t0 = Date.now();
  const raw = await callClaude({
    apiKey: KEY,
    model: MODEL,
    system: passageSystem(LEVEL),
    messages: [
      {
        role: 'user',
        content:
          'Type: a workplace situation in a hospital medical AI team (meetings, projects, vendors, doctors), using simple words.\nTopic (may be written in Chinese): 介紹語音辨識系統',
      },
    ],
    maxTokens: 1800,
    timeoutMs: 60_000,
  });
  const p = parsePassage(raw, 'work');
  log(`〔${Date.now() - t0} ms〕**${p.title}**（${p.titleEn}）`);
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
  log('# 真實 AI 回覆檢查');
  if (!KEY) {
    log('沒有找到 API 金鑰 Secret（ANTHROPIC_API_KEY / CLAUDE_API_KEY），這部分跳過。');
    console.log(out.join('\n'));
    return;
  }
  log(`模型：${MODEL}，難度：${LEVEL}`);
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
  log('## 發現的問題');
  if (issues.length === 0) log('沒有');
  issues.forEach((i) => log(`- ${i}`));
  console.log(out.join('\n'));
}

main();
