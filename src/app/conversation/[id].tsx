import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type ScrollViewInstance,
} from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StackPage } from '../../components/Page';
import { Btn, Card, Icon, MicBtn, NeedModelNotice, Notice, SectionTitle, SpeakBtn, Tag } from '../../components/ui';
import { useStore } from '../../lib/store';
import { generate, partialReply, stopGenerating, type ChatMessage } from '../../lib/llm';
import { SUMMARY_SCHEMA, TURN_SCHEMA } from '../../lib/schemas';
import {
  MIN_TURNS_BEFORE_DONE,
  START_MESSAGE,
  conversationSystem,
  parseSummary,
  parseTurn,
  summarySystem,
  transcriptText,
  type Correction,
  type Summary,
  type TurnReply,
} from '../../lib/prompts';
import { speak, stopSpeaking } from '../../lib/tts';
import { useRecognizer } from '../../lib/useRecognizer';
import { CATEGORY_LABEL, freeTalkScenario, getScenario, type Pair } from '../../data/scenarios';
import { C, CAT_COLOR, R, shadow } from '../../theme';

type Turn = {
  key: number;
  role: 'ai' | 'me';
  text: string;
  zh?: string;
  hint?: Pair;
  correction?: Correction | null;
};

export default function Conversation() {
  const { id, topic } = useLocalSearchParams<{ id: string; topic?: string }>();
  const scenario = useMemo(() => (id === 'free' ? freeTalkScenario(topic ?? '') : getScenario(id)), [id, topic]);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { modelReady, settings, saveItem, isSaved, recordTalk } = useStore();

  const [phase, setPhase] = useState<'intro' | 'chat' | 'summary'>('intro');
  const [turns, setTurns] = useState<Turn[]>([]);
  const [zhOpen, setZhOpen] = useState<Record<number, boolean>>({});
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [hintOpen, setHintOpen] = useState(false);
  const [finished, setFinished] = useState(false);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [summaryBusy, setSummaryBusy] = useState(false);
  const [streaming, setStreaming] = useState<string | null>(null);
  const [modelLoad, setModelLoad] = useState<number | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const history = useRef<ChatMessage[]>([]);
  const keySeq = useRef(0);
  const scrollRef = useRef<ScrollViewInstance>(null);

  const rec = useRecognizer((t) => setDraft((d) => (d.trim() ? `${d.trim()} ${t}` : t)));

  useEffect(
    () => () => {
      stopSpeaking();
      stopGenerating();
    },
    [],
  );

  // seconds counter while the model writes the review
  useEffect(() => {
    if (!summaryBusy) return;
    setElapsed(0);
    const t = setInterval(() => setElapsed((x) => x + 1), 1000);
    return () => clearInterval(t);
  }, [summaryBusy]);

  if (!scenario) {
    return (
      <StackPage>
        <Notice tone="bad" text="找不到這個情境。" />
      </StackPage>
    );
  }

  const tts = { rate: settings.rate, voice: settings.voice };
  const lastAi = [...turns].reverse().find((t) => t.role === 'ai');
  const aiIndex = new Map<number, number>();
  turns.filter((t) => t.role === 'ai').forEach((t, i) => aiIndex.set(t.key, i));

  function pushAi(r: TurnReply, alreadySpoken = false) {
    setTurns((prev) => {
      const next = [...prev];
      // the correction is about the learner's latest message
      for (let i = next.length - 1; i >= 0; i--) {
        if (next[i].role === 'me') {
          next[i] = { ...next[i], correction: r.correction };
          break;
        }
      }
      const key = ++keySeq.current;
      next.push({ key, role: 'ai', text: r.reply, zh: r.reply_zh, hint: r.hint });
      return next;
    });
    const learnerTurns = history.current.filter((m) => m.role === 'user' && m.content !== START_MESSAGE).length;
    if (r.done && learnerTurns >= MIN_TURNS_BEFORE_DONE) setFinished(true);
    if (settings.autoPlay && !alreadySpoken) speak(r.reply, tts);
  }

  async function askAi() {
    if (!scenario) return;
    setBusy(true);
    setErr(null);
    setStreaming(null);
    let spoke = false;
    try {
      const out = await generate({
        modelId: settings.modelId,
        system: conversationSystem(scenario, settings.level),
        messages: history.current,
        schema: TURN_SCHEMA,
        maxTokens: 350,
        temperature: 0.7,
        onLoadProgress: (p) => setModelLoad(p < 1 ? p : null),
        onText: (raw) => {
          const part = partialReply(raw);
          if (!part) return;
          setModelLoad(null);
          setStreaming(part.text);
          // start speaking as soon as the English line is complete
          if (part.complete && !spoke && settings.autoPlay && part.text) {
            spoke = true;
            speak(part.text, tts);
          }
        },
      });
      const r = parseTurn(out.text);
      history.current = [...history.current, { role: 'assistant', content: JSON.stringify(r) }];
      pushAi(r, spoke);
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setStreaming(null);
      setModelLoad(null);
      setBusy(false);
    }
  }

  async function start() {
    if (!scenario) return;
    setPhase('chat');
    if (scenario.opener.en) {
      const first: TurnReply = {
        reply: scenario.opener.en,
        reply_zh: scenario.opener.zh,
        correction: null,
        hint: scenario.openerHint,
        done: false,
      };
      history.current = [
        { role: 'user', content: START_MESSAGE },
        { role: 'assistant', content: JSON.stringify(first) },
      ];
      pushAi(first);
    } else {
      history.current = [{ role: 'user', content: START_MESSAGE }];
      await askAi();
    }
  }

  async function send() {
    const text = draft.trim();
    if (!text || busy) return;
    rec.stop();
    stopSpeaking();
    setDraft('');
    setHintOpen(false);
    setTurns((t) => [...t, { key: ++keySeq.current, role: 'me', text }]);
    const h = history.current;
    const last = h[h.length - 1];
    // after a failed request the last message is already the learner's: merge instead of doubling
    history.current =
      last && last.role === 'user' && last.content !== START_MESSAGE
        ? [...h.slice(0, -1), { role: 'user', content: `${last.content}\n${text}` }]
        : [...h, { role: 'user', content: text }];
    await askAi();
  }

  async function finish() {
    rec.stop();
    stopSpeaking();
    if (!turns.some((t) => t.role === 'me')) {
      router.back();
      return;
    }
    if (!scenario) return;
    setPhase('summary');
    setSummaryBusy(true);
    setErr(null);
    try {
      const out = await generate({
        modelId: settings.modelId,
        system: summarySystem(settings.level),
        messages: [
          {
            role: 'user',
            content: `Scenario: ${scenario.titleEn}. Goal: ${scenario.goal}\n\nTranscript:\n${transcriptText(turns)}`,
          },
        ],
        schema: SUMMARY_SCHEMA,
        maxTokens: 900,
        temperature: 0.5,
      });
      setSummary(parseSummary(out.text));
      recordTalk(scenario.id);
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setSummaryBusy(false);
    }
  }

  function restart() {
    stopSpeaking();
    history.current = [];
    setTurns([]);
    setZhOpen({});
    setSummary(null);
    setFinished(false);
    setErr(null);
    setDraft('');
    setPhase('intro');
  }

  const header = (
    <Stack.Screen
      options={{
        title: scenario.title,
        headerRight:
          phase === 'chat'
            ? () => (
                <Pressable testID="finish-btn" onPress={finish} hitSlop={10} style={s.headerBtn}>
                  <Text style={s.headerBtnText}>結束並檢討</Text>
                </Pressable>
              )
            : undefined,
      }}
    />
  );

  // ───────────── 開始前 ─────────────
  if (phase === 'intro') {
    const cat = CAT_COLOR[scenario.category];
    return (
      <StackPage>
        {header}
        <Card>
          <Tag label={CATEGORY_LABEL[scenario.category]} {...cat} />
          <Text style={s.introTitle}>{scenario.title}</Text>
          {scenario.titleEn !== 'Free talk' && <Text style={s.introEn}>{scenario.titleEn}</Text>}
          <View style={s.goalBox}>
            <Icon name="flag" size={14} color={C.primary} />
            <Text style={s.goalText}>目標：{scenario.goalZh}</Text>
          </View>
        </Card>

        <SectionTitle>先熟悉這幾句</SectionTitle>
        <View style={{ gap: 10 }}>
          {scenario.phrases.map((p) => (
            <Card key={p.en} style={s.phraseRow}>
              <View style={{ flex: 1 }}>
                <Text style={s.phraseEn}>{p.en}</Text>
                <Text style={s.phraseZh}>{p.zh}</Text>
              </View>
              <SpeakBtn text={p.en} />
            </Card>
          ))}
        </View>

        <View style={s.tips}>
          <Text style={s.tipLine}>・按麥克風說英文，說完可以修改再送出</Text>
          <Text style={s.tipLine}>・說不出來就按「提示」，照著唸也可以</Text>
          <Text style={s.tipLine}>・說中文也沒關係，AI 會教你英文怎麼說</Text>
        </View>

        <View style={{ marginTop: 18, gap: 12 }}>
          <NeedModelNotice />
          <Btn title="開始對話" icon="play" onPress={start} disabled={!modelReady} />
        </View>
      </StackPage>
    );
  }

  // ───────────── 檢討 ─────────────
  if (phase === 'summary') {
    return (
      <StackPage>
        {header}
        {summaryBusy ? (
          <View style={s.center}>
            <ActivityIndicator size="large" color={C.primary} />
            <Text style={s.loadingText}>手機上的 AI 正在整理回饋…（{elapsed} 秒）</Text>
            <Text style={s.loadingSub}>通常要 20～60 秒，看手機速度。</Text>
            <Btn
              small
              variant="ghost"
              title="先不要了，回到對話"
              onPress={() => {
                stopGenerating();
                setPhase('chat');
              }}
            />
          </View>
        ) : err ? (
          <View style={{ gap: 12 }}>
            <Notice tone="bad" text={err} />
            <Btn title="再試一次" icon="refresh" onPress={finish} />
            <Btn title="回到對話" variant="ghost" onPress={() => setPhase('chat')} />
          </View>
        ) : summary ? (
          <>
            <Card>
              <Text style={s.sumHead}>整體回饋</Text>
              <Text style={s.sumBody}>{summary.overall_zh}</Text>
              {summary.good_zh.length > 0 && (
                <View style={{ marginTop: 12, gap: 6 }}>
                  {summary.good_zh.map((g) => (
                    <View key={g} style={s.goodRow}>
                      <Icon name="check-circle" size={15} color={C.good} />
                      <Text style={s.goodText}>{g}</Text>
                    </View>
                  ))}
                </View>
              )}
            </Card>

            {summary.corrections.length > 0 && (
              <>
                <SectionTitle>可以說得更好</SectionTitle>
                <View style={{ gap: 10 }}>
                  {summary.corrections.map((c, i) => (
                    <CorrectionCard key={`${c.better}-${i}`} c={c} saved={isSaved(c.better)} onSave={() => saveItem({ en: c.better, zh: c.better_zh || c.why_zh }, scenario.title)} />
                  ))}
                </View>
              </>
            )}

            {summary.phrases.length > 0 && (
              <>
                <SectionTitle
                  right={
                    <Btn
                      small
                      variant="secondary"
                      icon="bookmark"
                      title="全部收藏"
                      onPress={() => summary.phrases.forEach((p) => saveItem(p, scenario.title))}
                    />
                  }
                >
                  好用的句子
                </SectionTitle>
                <View style={{ gap: 10 }}>
                  {summary.phrases.map((p) => (
                    <Card key={p.en} style={s.phraseRow}>
                      <View style={{ flex: 1 }}>
                        <Text style={s.phraseEn}>{p.en}</Text>
                        <Text style={s.phraseZh}>{p.zh}</Text>
                      </View>
                      <SpeakBtn text={p.en} />
                      <SaveBtn saved={isSaved(p.en)} onPress={() => saveItem(p, scenario.title)} />
                    </Card>
                  ))}
                </View>
              </>
            )}

            {summary.next_zh ? (
              <>
                <SectionTitle>下次試試看</SectionTitle>
                <Notice tone="info" text={summary.next_zh} />
              </>
            ) : null}

            <View style={{ marginTop: 22, gap: 10 }}>
              <Btn title="再練一次" icon="refresh" onPress={restart} />
              <Btn title="回到列表" variant="ghost" onPress={() => router.back()} />
            </View>
          </>
        ) : null}
      </StackPage>
    );
  }

  // ───────────── 對話中 ─────────────
  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: C.bg }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      {header}
      <ScrollView
        ref={scrollRef}
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 24 }}
        onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
        keyboardShouldPersistTaps="handled"
      >
        {turns.map((t) =>
          t.role === 'ai' ? (
            <View key={t.key} style={s.aiWrap}>
              <Pressable testID={`ai-${aiIndex.get(t.key)}`} onPress={() => speak(t.text, tts)} style={s.aiBubble}>
                <Text style={s.aiText}>{t.text}</Text>
                {(zhOpen[t.key] ?? settings.showZh) && t.zh ? <Text style={s.aiZh}>{t.zh}</Text> : null}
              </Pressable>
              <View style={s.aiActions}>
                <SpeakBtn text={t.text} size={30} />
                <SpeakBtn text={t.text} size={30} slow />
                {t.zh ? (
                  <Pressable
                    onPress={() => setZhOpen((z) => ({ ...z, [t.key]: !(z[t.key] ?? settings.showZh) }))}
                    style={s.zhToggle}
                  >
                    <Text style={s.zhToggleText}>{(zhOpen[t.key] ?? settings.showZh) ? '隱藏中文' : '看中文'}</Text>
                  </Pressable>
                ) : null}
              </View>
            </View>
          ) : (
            <View key={t.key} style={s.meWrap}>
              <View style={s.meBubble}>
                <Text style={s.meText}>{t.text}</Text>
              </View>
              {t.correction ? (
                <CorrectionCard
                  compact
                  c={t.correction}
                  saved={isSaved(t.correction.better)}
                  onSave={() => t.correction && saveItem({ en: t.correction.better, zh: t.correction.better_zh || t.correction.why_zh }, scenario.title)}
                />
              ) : null}
            </View>
          ),
        )}
        {busy && streaming ? (
          <View style={s.aiWrap}>
            <View style={s.aiBubble}>
              <Text style={s.aiText}>{streaming}</Text>
            </View>
          </View>
        ) : busy ? (
          <View style={s.typing}>
            <ActivityIndicator size="small" color={C.primary} />
            <Text style={s.typingText}>
              {modelLoad !== null ? `載入模型中 ${Math.round(modelLoad * 100)}%…` : '對方正在想…'}
            </Text>
          </View>
        ) : null}
        {err && (
          <View style={{ gap: 8 }}>
            <Notice tone="bad" text={err} />
            <Btn small variant="secondary" icon="refresh" title="重試" onPress={askAi} />
          </View>
        )}
        {finished && (
          <View style={{ gap: 8 }}>
            <Notice tone="good" text="這段對話完成了！按下面的按鈕看這次的回饋。" />
            <Btn icon="check" variant="good" title="結束並檢討" onPress={finish} />
          </View>
        )}
      </ScrollView>

      {/* 提示 */}
      {hintOpen && (
        <View style={s.hintPanel}>
          {lastAi?.hint?.en ? (
            <>
              <Text style={s.hintLabel}>你可以這樣說</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <View style={{ flex: 1 }}>
                  <Text style={s.hintEn}>{lastAi.hint.en}</Text>
                  <Text style={s.hintZh}>{lastAi.hint.zh}</Text>
                </View>
                <SpeakBtn text={lastAi.hint.en} />
              </View>
              <Btn
                small
                variant="secondary"
                title="用這句（可再修改）"
                style={{ marginTop: 10 }}
                onPress={() => {
                  setDraft(lastAi.hint?.en ?? '');
                  setHintOpen(false);
                }}
              />
            </>
          ) : (
            <Text style={s.hintZh}>這一句沒有提示，試著用簡單的字回答就好。</Text>
          )}
        </View>
      )}

      {/* 輸入列 */}
      <View style={[s.composer, { paddingBottom: Math.max(insets.bottom, 10) }]}>
        {rec.error ? <Text style={s.recErr}>{rec.error}</Text> : null}
        <TextInput
          testID="chat-input"
          value={rec.listening ? (draft ? `${draft} ${rec.interim}` : rec.interim) : draft}
          onChangeText={setDraft}
          editable={!rec.listening}
          placeholder={rec.listening ? '正在聽你說…' : '按麥克風說英文，或直接打字'}
          placeholderTextColor={rec.listening ? C.mic : C.faint}
          multiline
          style={[s.input, rec.listening && { borderColor: C.mic }]}
        />
        <View style={s.controls}>
          <Pressable testID="hint-btn" onPress={() => setHintOpen((h) => !h)} style={[s.sideBtn, hintOpen && { backgroundColor: C.warnSoft }]}>
            <Icon name="lightbulb-o" size={20} color={C.warn} />
            <Text style={s.sideText}>提示</Text>
          </Pressable>
          <MicBtn listening={rec.listening} onPress={rec.toggle} size={64} />
          <Pressable
            testID="send-btn"
            onPress={send}
            disabled={!draft.trim() || busy || rec.listening}
            style={[s.sideBtn, (!draft.trim() || busy || rec.listening) && { opacity: 0.4 }]}
          >
            <Icon name="send" size={19} color={C.primary} />
            <Text style={s.sideText}>送出</Text>
          </Pressable>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

function SaveBtn({ saved, onPress }: { saved: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} disabled={saved} hitSlop={8} style={[s.saveBtn, saved && { backgroundColor: C.goodSoft }]}>
      <Icon name={saved ? 'check' : 'bookmark-o'} size={15} color={saved ? C.good : C.sub} />
    </Pressable>
  );
}

function CorrectionCard({ c, saved, onSave, compact }: { c: Correction; saved: boolean; onSave: () => void; compact?: boolean }) {
  return (
    <View style={[s.corr, compact && { maxWidth: '92%', alignSelf: 'flex-end' }]}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        <Icon name="magic" size={13} color={C.warn} />
        <Text style={s.corrLabel}>更自然的說法</Text>
      </View>
      {!compact && c.you_said ? <Text style={s.corrOld}>{c.you_said}</Text> : null}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 }}>
        <Text style={[s.corrNew, { flex: 1 }]}>{c.better}</Text>
        <SpeakBtn text={c.better} size={30} />
        <SaveBtn saved={saved} onPress={onSave} />
      </View>
      {c.better_zh ? <Text style={s.corrZh}>{c.better_zh}</Text> : null}
      {c.why_zh ? <Text style={s.corrWhy}>{c.why_zh}</Text> : null}
    </View>
  );
}

const s = StyleSheet.create({
  headerBtn: { paddingHorizontal: 10, paddingVertical: 6, backgroundColor: C.primarySoft, borderRadius: 8 },
  headerBtnText: { color: C.primary, fontWeight: '800', fontSize: 14 },
  introTitle: { fontSize: 22, fontWeight: '900', color: C.text, marginTop: 8 },
  introEn: { fontSize: 14, color: C.sub, marginTop: 2 },
  goalBox: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12, backgroundColor: C.primarySoft, padding: 10, borderRadius: R.sm },
  goalText: { flex: 1, color: C.primary, fontWeight: '700', fontSize: 14 },
  phraseRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 12 },
  phraseEn: { fontSize: 16, fontWeight: '700', color: C.text },
  phraseZh: { fontSize: 13, color: C.sub, marginTop: 3 },
  tips: { marginTop: 18, gap: 4 },
  tipLine: { fontSize: 13, color: C.sub, lineHeight: 20 },
  aiWrap: { alignSelf: 'flex-start', maxWidth: '88%' },
  aiBubble: { backgroundColor: C.card, borderRadius: 18, borderTopLeftRadius: 6, padding: 14, ...shadow },
  aiText: { fontSize: 18, lineHeight: 26, color: C.text, fontWeight: '600' },
  aiZh: { fontSize: 14, lineHeight: 20, color: C.sub, marginTop: 8 },
  aiActions: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6, marginLeft: 4 },
  zhToggle: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999, backgroundColor: C.card, borderWidth: 1, borderColor: C.line },
  zhToggleText: { fontSize: 12, color: C.sub, fontWeight: '700' },
  meWrap: { alignSelf: 'flex-end', maxWidth: '88%', alignItems: 'flex-end', gap: 8 },
  meBubble: { backgroundColor: C.primary, borderRadius: 18, borderTopRightRadius: 6, padding: 14 },
  meText: { fontSize: 17, lineHeight: 24, color: '#fff' },
  corr: { backgroundColor: C.warnSoft, borderRadius: R.md, padding: 12 },
  corrLabel: { fontSize: 12, fontWeight: '800', color: '#8A5A00' },
  corrOld: { fontSize: 14, color: C.sub, textDecorationLine: 'line-through', marginTop: 6 },
  corrNew: { fontSize: 16, fontWeight: '700', color: C.text },
  corrZh: { fontSize: 14, color: C.sub, marginTop: 2 },
  corrWhy: { fontSize: 13, color: '#6B5A2E', marginTop: 6, lineHeight: 19 },
  saveBtn: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center', backgroundColor: C.card },
  typing: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 8 },
  typingText: { color: C.sub, fontSize: 13 },
  hintPanel: { backgroundColor: '#FFFBF0', borderTopWidth: 1, borderColor: '#F3E3B5', padding: 14 },
  hintLabel: { fontSize: 12, fontWeight: '800', color: '#8A5A00', marginBottom: 6 },
  hintEn: { fontSize: 17, fontWeight: '700', color: C.text },
  hintZh: { fontSize: 14, color: C.sub, marginTop: 3 },
  composer: { backgroundColor: C.card, borderTopWidth: 1, borderColor: C.line, paddingHorizontal: 14, paddingTop: 10 },
  recErr: { color: C.bad, fontSize: 13, marginBottom: 6 },
  input: {
    minHeight: 46,
    maxHeight: 110,
    borderWidth: 1.5,
    borderColor: C.line,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: C.text,
    backgroundColor: C.bg,
  },
  controls: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', marginTop: 2 },
  sideBtn: { alignItems: 'center', justifyContent: 'center', width: 64, paddingVertical: 8, borderRadius: 12, gap: 3 },
  sideText: { fontSize: 12, color: C.sub, fontWeight: '700' },
  center: { alignItems: 'center', justifyContent: 'center', paddingVertical: 80, gap: 14 },
  loadingText: { color: C.sub, fontSize: 15 },
  loadingSub: { color: C.faint, fontSize: 13 },
  sumHead: { fontSize: 15, fontWeight: '800', color: C.text },
  sumBody: { fontSize: 15, lineHeight: 23, color: C.text, marginTop: 8 },
  goodRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  goodText: { flex: 1, fontSize: 14, color: C.text, lineHeight: 20 },
});
