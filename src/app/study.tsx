import { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Btn, Card, Icon, MicBtn, Notice, SpeakBtn, Tag } from '../components/ui';
import { useStore } from '../lib/store';
import { RATING_LABEL, buildQueue, previewInterval, type Rating } from '../lib/srs';
import { deckItems, deckTitle } from '../lib/vocab';
import { diffWords, isCloseEnough } from '../lib/match';
import { speak, stopSpeaking } from '../lib/tts';
import { useRecognizer } from '../lib/useRecognizer';
import type { VocabItem } from '../data/decks';
import { C, R } from '../theme';

type Mode = 'flip' | 'speak';

export default function Study() {
  const { deck = 'all', mode: modeParam = 'flip' } = useLocalSearchParams<{ deck: string; mode: Mode }>();
  const mode: Mode = modeParam === 'speak' ? 'speak' : 'flip';
  const router = useRouter();
  const { progress, today, newLeftToday, rateCard, settings } = useStore();

  // Build the session once, from the state at the moment the screen opened.
  const initial = useRef<{ queue: VocabItem[] } | null>(null);
  if (!initial.current) {
    const items = deckItems(deck, progress.saved);
    const byId = new Map(items.map((i) => [i.id, i]));
    const ids = buildQueue({ itemIds: items.map((i) => i.id), states: progress.srs, today, newLimit: newLeftToday });
    initial.current = { queue: ids.map((id) => byId.get(id)!).filter(Boolean) };
  }

  const [queue, setQueue] = useState<VocabItem[]>(initial.current.queue);
  const [pos, setPos] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [heard, setHeard] = useState<string | null>(null);
  const [stats, setStats] = useState({ done: 0, again: 0 });
  const requeued = useRef(new Set<string>());

  const card = queue[pos];
  const total = queue.length;
  const tts = { rate: settings.rate, voice: settings.voice };

  const rec = useRecognizer((t) => {
    setHeard(t);
    setRevealed(true);
  });

  // auto-play English on the front (flip mode) or after reveal (speak mode)
  useEffect(() => {
    if (!card || !settings.autoPlay) return;
    if (mode === 'flip' && !revealed) speak(card.en, tts);
    if (mode === 'speak' && revealed) speak(card.en, tts);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pos, card?.id, revealed, mode]);

  useEffect(() => () => stopSpeaking(), []);

  const correct = useMemo(() => (card && heard ? isCloseEnough(card.en, heard) : null), [card, heard]);

  function rate(r: Rating) {
    if (!card) return;
    rec.stop();
    stopSpeaking();
    rateCard(card.id, r);
    setStats((s) => ({ done: s.done + 1, again: s.again + (r === 'again' ? 1 : 0) }));
    if (r === 'again' && !requeued.current.has(card.id)) {
      requeued.current.add(card.id);
      setQueue((q) => [...q, card]);
    }
    setRevealed(false);
    setHeard(null);
    rec.setError(null);
    setPos((p) => p + 1);
  }

  const header = <Stack.Screen options={{ title: `${deckTitle(deck)}・${mode === 'speak' ? '開口說' : '翻卡'}` }} />;

  if (total === 0 || pos >= total) {
    return (
      <View style={s.doneWrap}>
        {header}
        <View style={s.doneIcon}>
          <Icon name={total === 0 ? 'coffee' : 'trophy'} size={40} color={total === 0 ? C.sub : '#F2B705'} />
        </View>
        <Text style={s.doneTitle}>{total === 0 ? '目前沒有要練的卡片' : '這一輪完成了！'}</Text>
        <Text style={s.doneSub}>
          {total === 0
            ? '今天的複習和新字都練完了，明天再來，或到設定把每日新字調多一點。'
            : `練了 ${stats.done} 次，其中 ${stats.again} 次選「忘了」，那些卡會更快再出現。`}
        </Text>
        <Btn title="回去" style={{ marginTop: 24, alignSelf: 'stretch' }} onPress={() => router.back()} />
      </View>
    );
  }

  const isNew = !progress.srs[card.id];
  const state = progress.srs[card.id];

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      {header}
      <View style={s.progressRow}>
        <View style={s.barBg}>
          <View style={[s.barFg, { width: `${Math.round((pos / total) * 100)}%` }]} />
        </View>
        <Text style={s.progressText}>
          {pos + 1} / {total}
        </Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 18, paddingBottom: 30 }}>
        <Card style={s.card}>
          <View style={{ flexDirection: 'row', gap: 6 }}>
            {isNew && <Tag label="新字" fg={C.primary} bg={C.primarySoft} />}
            {card.pos ? <Tag label={card.pos} fg={C.sub} bg={C.bg} /> : null}
          </View>

          {mode === 'flip' ? (
            <>
              <Text style={s.front}>{card.en}</Text>
              <View style={s.speakRow}>
                <SpeakBtn text={card.en} size={44} />
                <SpeakBtn text={card.en} size={44} slow />
              </View>
              {revealed && (
                <View style={s.back}>
                  <Text style={s.zh}>{card.zh}</Text>
                  {card.ex ? <Example item={card} /> : null}
                </View>
              )}
            </>
          ) : (
            <>
              <Text style={s.prompt}>用英文說：</Text>
              <Text style={s.frontZh}>{card.zh}</Text>
              {!revealed && (
                <Text style={s.hintText}>
                  提示：{wordHint(card.en)}
                </Text>
              )}
              {revealed && (
                <View style={s.back}>
                  {heard !== null && (
                    <View style={[s.result, { backgroundColor: correct ? C.goodSoft : C.badSoft }]}>
                      <Icon name={correct ? 'check-circle' : 'times-circle'} size={18} color={correct ? C.good : C.bad} />
                      <View style={{ flex: 1 }}>
                        <Text style={[s.resultTitle, { color: correct ? C.good : C.bad }]}>
                          {correct ? '說對了！' : '差一點'}
                        </Text>
                        <Text style={s.resultHeard}>聽到：{heard}</Text>
                      </View>
                    </View>
                  )}
                  <View style={s.answerRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={s.answer}>
                        {diffWords(card.en, heard ?? card.en).map((w, i) => (
                          <Text key={i} style={heard !== null && !w.ok ? s.missing : undefined}>
                            {w.word}{' '}
                          </Text>
                        ))}
                      </Text>
                    </View>
                    <SpeakBtn text={card.en} size={40} />
                    <SpeakBtn text={card.en} size={40} slow />
                  </View>
                  {card.ex ? <Example item={card} /> : null}
                </View>
              )}
            </>
          )}
        </Card>

        {mode === 'speak' && !revealed && (
          <View style={s.micArea}>
            {rec.listening ? (
              <Text style={s.listening}>{rec.interim || '正在聽…'}</Text>
            ) : rec.error ? (
              <Text style={s.recErr}>{rec.error}</Text>
            ) : (
              <Text style={s.micHint}>按下麥克風，說出英文</Text>
            )}
            <MicBtn listening={rec.listening} onPress={rec.toggle} />
            <Pressable onPress={() => setRevealed(true)} hitSlop={10}>
              <Text style={s.peek}>想不起來，看答案</Text>
            </Pressable>
          </View>
        )}

        {mode === 'flip' && !revealed && (
          <Btn title="看答案" style={{ marginTop: 18 }} onPress={() => setRevealed(true)} />
        )}

        {revealed && (
          <View style={{ marginTop: 18 }}>
            {mode === 'speak' && (
              <Btn
                small
                variant="ghost"
                icon="microphone"
                title="再說一次"
                style={{ marginBottom: 12 }}
                onPress={() => {
                  setHeard(null);
                  setRevealed(false);
                  rec.start();
                }}
              />
            )}
            <Text style={s.rateLabel}>你記得多少？</Text>
            <View style={s.rateRow}>
              {(['again', 'hard', 'good'] as Rating[]).map((r) => {
                const color = r === 'again' ? C.bad : r === 'hard' ? C.warn : C.good;
                const bg = r === 'again' ? C.badSoft : r === 'hard' ? C.warnSoft : C.goodSoft;
                const suggested = mode === 'speak' && heard !== null && ((correct && r === 'good') || (!correct && r === 'again'));
                return (
                  <Pressable
                    key={r}
                    onPress={() => rate(r)}
                    style={({ pressed }) => [s.rateBtn, { backgroundColor: bg, borderColor: suggested ? color : bg }, pressed && { opacity: 0.8 }]}
                  >
                    <Text style={[s.rateText, { color }]}>{RATING_LABEL[r]}</Text>
                    <Text style={s.rateSub}>{previewInterval(state, r, today)}</Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        )}

        {mode === 'speak' && !revealed && heard === null && rec.error ? (
          <Notice tone="info" text="語音辨識無法使用時，可以先按「想不起來，看答案」，自己唸一遍再評分。" />
        ) : null}
      </ScrollView>
    </View>
  );
}

function wordHint(en: string): string {
  const first = en.split(' / ')[0].replace(/…|\.\.\./g, ' ').trim();
  const words = first.split(/\s+/).filter((w) => /[A-Za-z]/.test(w));
  const letter = first.replace(/^[^A-Za-z]*/, '').slice(0, 1);
  return `${words.length} 個字，開頭是「${letter}」`;
}

function Example({ item }: { item: VocabItem }) {
  return (
    <View style={s.exBox}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <Text style={[s.exEn, { flex: 1 }]}>{item.ex}</Text>
        <SpeakBtn text={item.ex ?? ''} size={30} />
      </View>
      {item.exZh ? <Text style={s.exZh}>{item.exZh}</Text> : null}
    </View>
  );
}

const s = StyleSheet.create({
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 18, paddingTop: 6 },
  barBg: { flex: 1, height: 6, backgroundColor: C.line, borderRadius: 3, overflow: 'hidden' },
  barFg: { height: 6, backgroundColor: C.primary },
  progressText: { fontSize: 13, color: C.sub, fontWeight: '700', minWidth: 52, textAlign: 'right' },
  card: { paddingVertical: 22, minHeight: 260 },
  front: { fontSize: 30, fontWeight: '900', color: C.text, textAlign: 'center', marginTop: 26 },
  speakRow: { flexDirection: 'row', justifyContent: 'center', gap: 14, marginTop: 18 },
  back: { marginTop: 20, borderTopWidth: 1, borderColor: C.line, paddingTop: 16 },
  zh: { fontSize: 22, fontWeight: '800', color: C.text, textAlign: 'center' },
  prompt: { fontSize: 13, color: C.sub, marginTop: 18, textAlign: 'center' },
  frontZh: { fontSize: 26, fontWeight: '900', color: C.text, textAlign: 'center', marginTop: 6 },
  hintText: { fontSize: 13, color: C.faint, textAlign: 'center', marginTop: 12 },
  result: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderRadius: R.sm, marginBottom: 14 },
  resultTitle: { fontSize: 15, fontWeight: '800' },
  resultHeard: { fontSize: 14, color: C.text, marginTop: 2 },
  answerRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  answer: { fontSize: 22, fontWeight: '900', color: C.text },
  missing: { color: C.bad, textDecorationLine: 'underline' },
  exBox: { marginTop: 16, backgroundColor: C.bg, borderRadius: R.sm, padding: 12 },
  exEn: { fontSize: 15, color: C.text, lineHeight: 22 },
  exZh: { fontSize: 13, color: C.sub, marginTop: 4 },
  micArea: { alignItems: 'center', marginTop: 20, gap: 4 },
  micHint: { fontSize: 14, color: C.sub },
  listening: { fontSize: 18, color: C.mic, fontWeight: '700', textAlign: 'center', paddingHorizontal: 10 },
  recErr: { fontSize: 14, color: C.bad, textAlign: 'center', paddingHorizontal: 10 },
  peek: { fontSize: 14, color: C.primary, fontWeight: '700', marginTop: 6 },
  rateLabel: { fontSize: 13, color: C.sub, textAlign: 'center', marginBottom: 8 },
  rateRow: { flexDirection: 'row', gap: 10 },
  rateBtn: { flex: 1, alignItems: 'center', paddingVertical: 14, borderRadius: R.md, borderWidth: 2 },
  rateText: { fontSize: 17, fontWeight: '900' },
  rateSub: { fontSize: 12, color: C.sub, marginTop: 3 },
  doneWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 30, backgroundColor: C.bg },
  doneIcon: { width: 84, height: 84, borderRadius: 42, backgroundColor: C.card, alignItems: 'center', justifyContent: 'center' },
  doneTitle: { fontSize: 22, fontWeight: '900', color: C.text, marginTop: 18 },
  doneSub: { fontSize: 15, color: C.sub, textAlign: 'center', marginTop: 8, lineHeight: 22 },
});
