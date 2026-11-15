import { test } from 'node:test';
import assert from 'node:assert/strict';
import { schedule, buildQueue, previewInterval, newCard, countDue } from '../src/lib/srs.ts';
import { similarity, isCloseEnough, diffWords, normalize } from '../src/lib/match.ts';
import { parseTurn, parseSummary, parsePassage, extractJson, partialReply, conversationSystem } from '../src/lib/prompts.ts';
import { toTaiwan } from '../src/lib/zh.ts';
import { TURN_SCHEMA, SUMMARY_SCHEMA, PASSAGE_SCHEMA } from '../src/lib/schemas.ts';
import { DECKS } from '../src/data/decks.ts';
import { PASSAGES } from '../src/data/listening.ts';
import { SCENARIOS } from '../src/data/scenarios.ts';

const T = 20000;

test('srs: good ladder 2 → 5 → ~13 days; hard on a new card is tomorrow', () => {
  let s = schedule(undefined, 'good', T);
  assert.equal(s.due - T, 2);
  s = schedule(s, 'good', T + 2);
  assert.equal(s.due - (T + 2), 5);
  s = schedule(s, 'good', T + 7);
  assert.ok(s.interval >= 12 && s.interval <= 14, `interval ${s.interval}`);
  assert.equal(schedule(undefined, 'hard', T).due - T, 1);
});

test('srs: again resets and lowers ease, stays due today', () => {
  const s0 = schedule(schedule(undefined, 'good', T), 'good', T + 2);
  const s = schedule(s0, 'again', T + 7);
  assert.equal(s.reps, 0);
  assert.equal(s.due, T + 7);
  assert.equal(s.lapses, 1);
  assert.ok(s.ease < s0.ease);
  assert.ok(s.ease >= 1.3);
});

test('srs: preview labels', () => {
  assert.equal(previewInterval(undefined, 'again', T), '再一次');
  assert.equal(previewInterval(undefined, 'hard', T), '明天');
  assert.equal(previewInterval(undefined, 'good', T), '2 天後');
  assert.equal(previewInterval({ ...newCard(T), reps: 1, interval: 2 }, 'good', T), '5 天後');
});

test('srs: queue puts due first then limited new cards', () => {
  const states = {
    a: { ...newCard(T - 5), due: T - 1, reps: 2, interval: 3 },
    b: { ...newCard(T - 5), due: T + 3, reps: 2, interval: 3 },
    c: { ...newCard(T - 5), due: T - 3, reps: 1, interval: 1 },
  };
  const q = buildQueue({ itemIds: ['a', 'b', 'c', 'd', 'e', 'f'], states, today: T, newLimit: 2 });
  assert.deepEqual(q, ['c', 'a', 'd', 'e']);
  assert.equal(countDue(['a', 'b', 'c'], states, T), 2);
});

test('match: contractions, punctuation and case', () => {
  assert.deepEqual(normalize("I'm fine, thanks!"), ['i', 'am', 'fine', 'thanks']);
  assert.ok(isCloseEnough("I'm just looking.", 'i am just looking'));
  assert.ok(isCloseEnough('Can I pay by card?', 'can I pay by card'));
  assert.ok(!isCloseEnough('Can I pay by card?', 'can I pay'));
});

test('match: placeholders are optional', () => {
  assert.ok(isCloseEnough('How do I get to …?', 'how do I get to the station'));
  assert.ok(isCloseEnough("I'll have …", 'I will have the chicken'));
  assert.equal(similarity('in charge of', 'I am in charge of the team'), 1);
});

test('match: either side of "A / B" counts', () => {
  assert.ok(isCloseEnough('Turn left / Turn right', 'turn right'));
  assert.ok(isCloseEnough('For here, please. / To go, please.', 'to go please'));
  assert.ok(!isCloseEnough('Turn left / Turn right', 'go straight'));
});

test('match: dictation diff marks missing words', () => {
  const d = diffWords('She orders an iced tea.', 'she order an iced tea');
  assert.deepEqual(
    d.map((w) => w.ok),
    [true, false, true, true, true],
  );
  const all = diffWords("It's on the corner.", "it's on the corner");
  assert.ok(all.every((w) => w.ok));
});

test('prompts: parse turn JSON with fences and stray text', () => {
  const r = parseTurn('Sure!\n```json\n{"reply":"Great. Hot or iced?","reply_zh":"好的，熱的還是冰的？","correction":{"you_said":"I want latte","better":"I\'d like a latte, please.","better_zh":"我想要一杯拿鐵。","why_zh":"加 a 和 please 比較自然"},"hint":{"en":"Iced, please.","zh":"冰的，謝謝。"},"done":false}\n```');
  assert.equal(r.reply, 'Great. Hot or iced?');
  assert.equal(r.correction?.better, "I'd like a latte, please.");
  assert.equal(r.hint.en, 'Iced, please.');
  assert.equal(r.done, false);
});

test('prompts: null correction and plain-text fallback', () => {
  const r = parseTurn('{"reply":"Nice!","reply_zh":"很好","correction":null,"hint":{"en":"Thanks.","zh":"謝謝"},"done":true}');
  assert.equal(r.correction, null);
  assert.equal(r.done, true);
  const f = parseTurn('Sorry, can you say that again?');
  assert.equal(f.reply, 'Sorry, can you say that again?');
});

test('prompts: summary and passage parsing validate fields', () => {
  const s = parseSummary('{"overall_zh":"不錯","good_zh":["敢開口"],"corrections":[{"you_said":"x","better":"y","why_zh":"z"},{"bad":1}],"phrases":[{"en":"For here, please.","zh":"內用"}],"next_zh":"多問問題"}');
  assert.equal(s.corrections.length, 1);
  assert.equal(s.phrases.length, 1);
  const p = parsePassage(
    JSON.stringify({
      title: '測試',
      titleEn: 'Test',
      sentences: [{ en: 'A.', zh: '甲' }, { en: 'B.', zh: '乙' }, { en: 'C.', zh: '丙' }, { en: 'D.', zh: '丁' }],
      questions: [
        { q: 'Q1', qZh: '問', options: ['a', 'b', 'c', 'd'], answer: 2, explainZh: '因為' },
        { q: 'Q2', options: ['a', 'b'], answer: 5 },
      ],
      vocab: [{ en: 'word', zh: '字' }],
    }),
    'work',
  );
  assert.equal(p.questions.length, 1);
  assert.equal(p.category, 'work');
  assert.ok(p.generated);
  assert.throws(() => extractJson('no json here'));
});

test('content: decks have unique ids and complete fields', () => {
  const ids = new Set<string>();
  for (const d of DECKS) {
    assert.ok(d.items.length >= 50, `${d.id} has ${d.items.length}`);
    for (const it of d.items) {
      assert.ok(!ids.has(it.id), `duplicate ${it.id}`);
      ids.add(it.id);
      assert.ok(it.en && it.zh && it.ex && it.exZh, `incomplete ${it.id}`);
      assert.ok(!/[一-鿿]/.test(it.en + (it.ex ?? '')), `Chinese inside English: ${it.id}`);
    }
  }
});

test('content: passages and scenarios are well formed', () => {
  const ids = new Set<string>();
  for (const p of PASSAGES) {
    assert.ok(!ids.has(p.id));
    ids.add(p.id);
    assert.ok(p.sentences.length >= 5);
    for (const q of p.questions) {
      assert.ok(q.answer >= 0 && q.answer < q.options.length, `${p.id}: ${q.q}`);
      assert.equal(q.options.length, 4);
    }
  }
  for (const s of SCENARIOS) {
    assert.ok(s.opener.en && s.opener.zh && s.openerHint.en && s.openerHint.zh, s.id);
    assert.equal(s.phrases.length, 4);
  }
});

test('offline model: reply text is shown while it streams', () => {
  assert.deepEqual(partialReply('{"reply":"Sure! What si'), { text: 'Sure! What si', complete: false });
  assert.deepEqual(partialReply('{"reply":"Hot or iced?","reply_zh":"'), { text: 'Hot or iced?', complete: true });
  assert.equal(partialReply('{"rep'), null);

});

test('offline model: Simplified Chinese becomes Taiwan Traditional', () => {
  assert.equal(toTaiwan('这个说法比较自然'), '這個說法比較自然');
  assert.equal(toTaiwan('Hello there'), 'Hello there');
  assert.equal(toTaiwan('已經是繁體'), '已經是繁體');
});

test('offline model: schemas require every field they define', () => {
  for (const sc of [TURN_SCHEMA, SUMMARY_SCHEMA, PASSAGE_SCHEMA] as { properties: object; required: string[] }[]) {
    assert.deepEqual([...sc.required].sort(), Object.keys(sc.properties).sort());
  }
  assert.equal(Object.keys(TURN_SCHEMA.properties)[0], 'reply', 'reply must stream first');
});

test('offline model: the worked example in the prompt parses', () => {
  const sys = conversationSystem(SCENARIOS[0], 'A2');
  const ex = sys.slice(sys.lastIndexOf('{"reply"'));
  const r = parseTurn(ex);
  assert.equal(r.reply, 'Sure! What size would you like?');
  assert.equal(r.correction?.better, "I'd like a hot coffee, please.");
});

test('guards: unusable model output is dropped', () => {
  const t = parseTurn('{"reply":"Nice.","reply_zh":"好","correction":{"you_said":"ice please","better":"Ice, please.","better_zh":"冰","why_zh":"x"},"hint":{"en":"我要冰的","zh":"我要冰的"},"done":false}');
  assert.equal(t.correction, null, 'same sentence is not a correction');
  assert.equal(t.hint.en, '', 'Chinese hint is dropped');
  assert.throws(
    () =>
      parsePassage(
        JSON.stringify({ title: 't', titleEn: 'T', sentences: [1, 2, 3, 4, 5, 6].map(() => ({ en: '我們需要新工具。', zh: '我們需要新工具。' })), questions: [], vocab: [] }),
        'work',
      ),
    /不能用/,
  );
});
