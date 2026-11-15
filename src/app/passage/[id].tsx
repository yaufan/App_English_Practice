import { useEffect, useRef, useState } from 'react';
import { Alert, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { StackPage } from '../../components/Page';
import { Btn, Card, Chip, Icon, Notice, SectionTitle, SpeakBtn } from '../../components/ui';
import { useStore } from '../../lib/store';
import { speak, speakSequence, stopSpeaking } from '../../lib/tts';
import { diffWords, type DiffWord } from '../../lib/match';
import { PASSAGES } from '../../data/listening';
import { C, R } from '../../theme';

type Mode = 'listen' | 'dictation' | 'quiz';
const SPEEDS = [0.6, 0.8, 1.0];

export default function PassageScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { progress, settings, recordListen, saveItem, isSaved, removePassage } = useStore();
  const passage = PASSAGES.find((p) => p.id === id) ?? progress.passages.find((p) => p.id === id);

  const [mode, setMode] = useState<Mode>('listen');
  const [rate, setRate] = useState(settings.rate <= 0.7 ? 0.6 : settings.rate <= 0.9 ? 0.8 : 1.0);
  const [showEn, setShowEn] = useState(false);
  const [showZh, setShowZh] = useState(false);
  const [playing, setPlaying] = useState<number | null>(null);
  const cancelRef = useRef<(() => void) | null>(null);

  useEffect(
    () => () => {
      cancelRef.current?.();
      stopSpeaking();
    },
    [],
  );

  if (!passage) {
    return (
      <StackPage>
        <Notice tone="bad" text="找不到這篇短文。" />
      </StackPage>
    );
  }

  const tts = { rate, voice: settings.voice };

  const stopAll = () => {
    cancelRef.current?.();
    cancelRef.current = null;
    stopSpeaking();
    setPlaying(null);
  };

  const playAll = () => {
    if (playing !== null) {
      stopAll();
      return;
    }
    cancelRef.current = speakSequence(
      passage.sentences.map((x) => x.en),
      tts,
      (i) => setPlaying(i),
      () => {
        setPlaying(null);
        cancelRef.current = null;
      },
    );
  };

  const playOne = (i: number) => {
    stopAll();
    setPlaying(i);
    speak(passage.sentences[i].en, tts, () => setPlaying((p) => (p === i ? null : p)));
  };

  const switchMode = (m: Mode) => {
    stopAll();
    setMode(m);
  };

  const deletePassage = () => {
    const go = () => {
      removePassage(passage.id);
      router.back();
    };
    if (Platform.OS === 'web') return go();
    Alert.alert('刪除短文', '確定刪除這篇 AI 產生的短文？', [
      { text: '取消', style: 'cancel' },
      { text: '刪除', style: 'destructive', onPress: go },
    ]);
  };

  return (
    <StackPage>
      <Stack.Screen options={{ title: passage.title }} />
      <Text style={s.titleEn}>{passage.titleEn}</Text>

      <View style={s.segment}>
        {(
          [
            ['listen', '聽', 'headphones'],
            ['dictation', '聽寫', 'pencil'],
            ['quiz', '題目', 'check-square-o'],
          ] as [Mode, string, string][]
        ).map(([m, label, icon]) => (
          <Pressable key={m} onPress={() => switchMode(m)} style={[s.segBtn, mode === m && s.segOn]}>
            <Icon name={icon} size={14} color={mode === m ? '#fff' : C.sub} />
            <Text style={[s.segText, mode === m && { color: '#fff' }]}>{label}</Text>
          </Pressable>
        ))}
      </View>

      <View style={s.speedRow}>
        <Text style={s.speedLabel}>速度</Text>
        {SPEEDS.map((v) => (
          <Chip key={v} label={v === 1 ? '正常' : v === 0.8 ? '稍慢' : '很慢'} selected={rate === v} onPress={() => setRate(v)} />
        ))}
      </View>

      {mode === 'listen' && (
        <>
          <Btn
            title={playing !== null ? '停止' : '播放全文'}
            icon={playing !== null ? 'stop' : 'play'}
            variant={playing !== null ? 'danger' : 'primary'}
            onPress={playAll}
            style={{ marginTop: 14 }}
          />
          <View style={s.toggleRow}>
            <Chip label={showEn ? '隱藏英文' : '顯示英文'} selected={showEn} onPress={() => setShowEn((v) => !v)} />
            <Chip label={showZh ? '隱藏中文' : '顯示中文'} selected={showZh} onPress={() => setShowZh((v) => !v)} />
          </View>
          <Text style={s.tip}>建議：先不看字聽兩遍，再打開英文對照，最後點句子跟著唸。</Text>
          <View style={{ gap: 8, marginTop: 10 }}>
            {passage.sentences.map((x, i) => (
              <Pressable key={i} onPress={() => playOne(i)} style={[s.sentence, playing === i && s.sentenceOn]}>
                <Text style={s.sentNo}>{i + 1}</Text>
                <View style={{ flex: 1 }}>
                  {showEn ? <Text style={s.sentEn}>{x.en}</Text> : <Text style={s.sentHidden}>點一下播放這一句</Text>}
                  {showZh ? <Text style={s.sentZh}>{x.zh}</Text> : null}
                </View>
                <Icon name={playing === i ? 'volume-up' : 'play-circle-o'} size={20} color={playing === i ? C.primary : C.faint} />
              </Pressable>
            ))}
          </View>

          {passage.vocab.length > 0 && (
            <>
              <SectionTitle>重點單字</SectionTitle>
              <View style={{ gap: 8 }}>
                {passage.vocab.map((v) => {
                  const saved = isSaved(v.en);
                  return (
                    <Card key={v.en} style={s.vocabRow}>
                      <View style={{ flex: 1 }}>
                        <Text style={s.vocabEn}>{v.en}</Text>
                        <Text style={s.vocabZh}>{v.zh}</Text>
                      </View>
                      <SpeakBtn text={v.en} size={32} />
                      <Pressable
                        onPress={() => saveItem(v, passage.title)}
                        disabled={saved}
                        hitSlop={8}
                        style={[s.saveBtn, saved && { backgroundColor: C.goodSoft }]}
                      >
                        <Icon name={saved ? 'check' : 'bookmark-o'} size={15} color={saved ? C.good : C.sub} />
                      </Pressable>
                    </Card>
                  );
                })}
              </View>
            </>
          )}

          {passage.generated && (
            <Btn title="刪除這篇短文" variant="danger" icon="trash-o" small style={{ marginTop: 26 }} onPress={deletePassage} />
          )}
        </>
      )}

      {mode === 'dictation' && <Dictation sentences={passage.sentences} rate={rate} voice={settings.voice} />}

      {mode === 'quiz' && (
        <Quiz
          passageId={passage.id}
          questions={passage.questions}
          onPlayAll={playAll}
          playing={playing !== null}
          onDone={(c, t) => recordListen(passage.id, c, t)}
        />
      )}
    </StackPage>
  );
}

function Dictation({ sentences, rate, voice }: { sentences: { en: string; zh: string }[]; rate: number; voice: string }) {
  const [i, setI] = useState(0);
  const [typed, setTyped] = useState('');
  const [result, setResult] = useState<DiffWord[] | null>(null);
  const [score, setScore] = useState({ ok: 0, total: 0 });
  const done = i >= sentences.length;
  const cur = sentences[i];

  useEffect(() => {
    if (cur) speak(cur.en, { rate, voice });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [i]);

  if (done) {
    return (
      <Card style={{ marginTop: 16, alignItems: 'center' }}>
        <Icon name="star" size={30} color="#F2B705" />
        <Text style={s.quizDone}>聽寫完成</Text>
        <Text style={s.quizSub}>
          聽對了 {score.ok} / {score.total} 個字
        </Text>
        <Btn
          title="再寫一次"
          variant="secondary"
          icon="refresh"
          style={{ marginTop: 14, alignSelf: 'stretch' }}
          onPress={() => {
            setI(0);
            setTyped('');
            setResult(null);
            setScore({ ok: 0, total: 0 });
          }}
        />
      </Card>
    );
  }

  const check = () => {
    const d = diffWords(cur.en, typed);
    setResult(d);
    setScore((s0) => ({ ok: s0.ok + d.filter((w) => w.ok).length, total: s0.total + d.length }));
  };

  return (
    <View style={{ marginTop: 16 }}>
      <Text style={s.dictProgress}>
        第 {i + 1} / {sentences.length} 句
      </Text>
      <Card>
        <View style={{ flexDirection: 'row', gap: 10, justifyContent: 'center' }}>
          <Btn small variant="secondary" icon="volume-up" title="再聽一次" onPress={() => speak(cur.en, { rate, voice })} />
          <Btn small variant="ghost" icon="hourglass-half" title="很慢" onPress={() => speak(cur.en, { rate: 0.5, voice })} />
        </View>
        <TextInput
          value={typed}
          onChangeText={setTyped}
          editable={!result}
          placeholder="把聽到的英文打出來（聽到幾個字就打幾個）"
          placeholderTextColor={C.faint}
          multiline
          autoCapitalize="none"
          autoCorrect={false}
          style={s.dictInput}
        />
        {result ? (
          <View style={{ marginTop: 12 }}>
            <Text style={s.diffLine}>
              {result.map((w, k) => (
                <Text key={k} style={w.ok ? s.okWord : s.badWord}>
                  {w.word}{' '}
                </Text>
              ))}
            </Text>
            <Text style={s.sentZh}>{cur.zh}</Text>
            <Btn
              title={i + 1 < sentences.length ? '下一句' : '看結果'}
              style={{ marginTop: 14 }}
              onPress={() => {
                setTyped('');
                setResult(null);
                setI((x) => x + 1);
              }}
            />
          </View>
        ) : (
          <Btn title="對答案" style={{ marginTop: 12 }} disabled={!typed.trim()} onPress={check} />
        )}
      </Card>
      <Text style={s.tip}>綠色是聽對的字，紅色是漏掉或寫錯的字。</Text>
    </View>
  );
}

function Quiz({
  passageId,
  questions,
  onPlayAll,
  playing,
  onDone,
}: {
  passageId: string;
  questions: { q: string; qZh: string; options: string[]; answer: number; explainZh: string }[];
  onPlayAll: () => void;
  playing: boolean;
  onDone: (correct: number, total: number) => void;
}) {
  const [picked, setPicked] = useState<Record<number, number>>({});
  const [showZh, setShowZh] = useState(false);
  const answered = Object.keys(picked).length;
  const correct = questions.filter((q, i) => picked[i] === q.answer).length;
  const reported = useRef(false);

  useEffect(() => {
    if (questions.length > 0 && answered === questions.length && !reported.current) {
      reported.current = true;
      onDone(correct, questions.length);
    }
  }, [answered, correct, questions.length, onDone]);

  if (questions.length === 0) return <Notice tone="info" text="這篇沒有題目。" />;

  return (
    <View style={{ marginTop: 14, gap: 12 }} key={passageId}>
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <Btn style={{ flex: 1 }} small title={playing ? '停止' : '先聽全文'} icon={playing ? 'stop' : 'play'} variant={playing ? 'danger' : 'secondary'} onPress={onPlayAll} />
        <Btn style={{ flex: 1 }} small title={showZh ? '隱藏題目中文' : '題目看中文'} variant="ghost" onPress={() => setShowZh((v) => !v)} />
      </View>
      {questions.map((q, qi) => {
        const p = picked[qi];
        return (
          <Card key={qi}>
            <Text style={s.qText}>
              {qi + 1}. {q.q}
            </Text>
            {showZh || p !== undefined ? <Text style={s.qZh}>{q.qZh}</Text> : null}
            <View style={{ gap: 8, marginTop: 10 }}>
              {q.options.map((o, oi) => {
                const isAns = oi === q.answer;
                const isPick = oi === p;
                const bg = p === undefined ? C.bg : isAns ? C.goodSoft : isPick ? C.badSoft : C.bg;
                const border = p === undefined ? C.line : isAns ? C.good : isPick ? C.bad : C.line;
                return (
                  <Pressable
                    key={oi}
                    disabled={p !== undefined}
                    onPress={() => setPicked((x) => ({ ...x, [qi]: oi }))}
                    style={[s.option, { backgroundColor: bg, borderColor: border }]}
                  >
                    <Text style={s.optLetter}>{String.fromCharCode(65 + oi)}</Text>
                    <Text style={s.optText}>{o}</Text>
                    {p !== undefined && isAns ? <Icon name="check" size={14} color={C.good} /> : null}
                    {p !== undefined && isPick && !isAns ? <Icon name="times" size={14} color={C.bad} /> : null}
                  </Pressable>
                );
              })}
            </View>
            {p !== undefined && q.explainZh ? <Text style={s.explain}>{q.explainZh}</Text> : null}
          </Card>
        );
      })}
      {answered === questions.length && (
        <Notice tone={correct === questions.length ? 'good' : 'info'} text={`答對 ${correct} / ${questions.length} 題。答錯的題目，回到「聽」模式找答案在哪一句。`} />
      )}
    </View>
  );
}

const s = StyleSheet.create({
  titleEn: { fontSize: 14, color: C.sub, marginBottom: 12 },
  segment: { flexDirection: 'row', backgroundColor: C.card, borderRadius: R.md, padding: 4, gap: 4 },
  segBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, borderRadius: 10 },
  segOn: { backgroundColor: C.primary },
  segText: { fontSize: 15, fontWeight: '800', color: C.sub },
  speedRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 14 },
  speedLabel: { fontSize: 13, color: C.sub, fontWeight: '700', marginRight: 2 },
  toggleRow: { flexDirection: 'row', gap: 8, marginTop: 14 },
  tip: { fontSize: 12, color: C.faint, marginTop: 10, lineHeight: 18 },
  sentence: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: C.card, borderRadius: 12, padding: 12, borderWidth: 1.5, borderColor: C.card },
  sentenceOn: { borderColor: C.primary, backgroundColor: C.primarySoft },
  sentNo: { width: 22, fontSize: 13, color: C.faint, fontWeight: '800', textAlign: 'center' },
  sentEn: { fontSize: 16, lineHeight: 23, color: C.text, fontWeight: '600' },
  sentHidden: { fontSize: 14, color: C.faint },
  sentZh: { fontSize: 14, color: C.sub, marginTop: 4, lineHeight: 20 },
  vocabRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 12 },
  vocabEn: { fontSize: 15, fontWeight: '800', color: C.text },
  vocabZh: { fontSize: 13, color: C.sub, marginTop: 2 },
  saveBtn: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: C.bg },
  dictProgress: { fontSize: 13, color: C.sub, fontWeight: '700', marginBottom: 8 },
  dictInput: { marginTop: 14, minHeight: 70, borderWidth: 1.5, borderColor: C.line, borderRadius: 12, padding: 12, fontSize: 16, color: C.text, backgroundColor: C.bg, textAlignVertical: 'top' },
  diffLine: { fontSize: 18, lineHeight: 28, fontWeight: '700' },
  okWord: { color: C.good },
  badWord: { color: C.bad, textDecorationLine: 'underline' },
  quizDone: { fontSize: 20, fontWeight: '900', color: C.text, marginTop: 8 },
  quizSub: { fontSize: 15, color: C.sub, marginTop: 4 },
  qText: { fontSize: 16, fontWeight: '800', color: C.text, lineHeight: 23 },
  qZh: { fontSize: 13, color: C.sub, marginTop: 4 },
  option: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderRadius: 10, borderWidth: 1.5 },
  optLetter: { fontSize: 14, fontWeight: '900', color: C.sub, width: 18 },
  optText: { flex: 1, fontSize: 15, color: C.text },
  explain: { marginTop: 10, fontSize: 13, color: C.sub, lineHeight: 19, backgroundColor: C.bg, padding: 10, borderRadius: 8 },
});
