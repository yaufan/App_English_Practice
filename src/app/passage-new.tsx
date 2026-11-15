import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { StackPage } from '../components/Page';
import { Btn, Card, Chip, NeedModelNotice, Notice, SectionTitle } from '../components/ui';
import { useStore } from '../lib/store';
import { generate, stopGenerating } from '../lib/llm';
import { PASSAGE_SCHEMA } from '../lib/schemas';
import { LEVEL_LABEL, parsePassage, passageSystem } from '../lib/prompts';
import { CATEGORY_LABEL, type Category } from '../data/scenarios';
import { C } from '../theme';

const IDEAS: Record<Category, string[]> = {
  daily: ['超市買東西', '搭計程車', '打電話訂餐廳', '朋友的生日派對', '天氣預報'],
  work: ['AI 模型上線前的測試', '跟國外醫院開視訊會議', '介紹語音辨識系統', '資料標註的進度', '伺服器維修通知'],
  exam: ['多益：公司內部公告', '多益：飯店訂房對話', '多益：產品發表廣告', '雅思：介紹你喜歡的地方', '多益：會議延期的語音留言'],
};

const STYLE: Record<Category, string> = {
  daily: 'an everyday situation, as a short conversation or a short monologue',
  work: 'a workplace situation in a hospital medical AI team (meetings, projects, vendors, doctors), using simple words',
  exam: 'TOEIC listening style (Part 3 conversation or Part 4 talk/announcement), or an IELTS-style personal answer',
};

export default function NewPassage() {
  const router = useRouter();
  const { modelReady, settings, addPassage } = useStore();
  const [cat, setCat] = useState<Category>('daily');
  const [topic, setTopic] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [chars, setChars] = useState(0);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => () => void stopGenerating(), []);

  useEffect(() => {
    if (!busy) return;
    setElapsed(0);
    const t = setInterval(() => setElapsed((x) => x + 1), 1000);
    return () => clearInterval(t);
  }, [busy]);

  async function run() {
    setBusy(true);
    setErr(null);
    try {
      const t = topic.trim() || IDEAS[cat][Math.floor(Math.random() * IDEAS[cat].length)];
      const once = async () => {
        setChars(0);
        const out = await generate({
          modelId: settings.modelId,
          system: passageSystem(settings.level),
          messages: [{ role: 'user', content: `Type: ${STYLE[cat]}.\nTopic (may be written in Chinese): ${t}` }],
          schema: PASSAGE_SCHEMA,
          maxTokens: 1400,
          temperature: 0.7,
          onText: (raw) => setChars(raw.length),
        });
        return parsePassage(out.text, cat);
      };
      let p;
      try {
        p = await once();
      } catch (first) {
        // a small model sometimes writes Chinese in the English fields; one retry usually fixes it
        if (!(first as Error).message.includes('不能用')) throw first;
        p = await once();
      }
      addPassage(p);
      router.replace({ pathname: '/passage/[id]', params: { id: p.id } });
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <StackPage>
      <NeedModelNotice />
      <SectionTitle>類型</SectionTitle>
      <View style={s.chips}>
        {(Object.keys(CATEGORY_LABEL) as Category[]).map((c) => (
          <Chip key={c} label={CATEGORY_LABEL[c]} selected={cat === c} onPress={() => setCat(c)} />
        ))}
      </View>

      <SectionTitle>主題</SectionTitle>
      <Card>
        <TextInput
          value={topic}
          onChangeText={setTopic}
          placeholder="中文或英文都可以；留空就隨機選一個"
          placeholderTextColor={C.faint}
          style={s.input}
        />
        <Text style={s.ideaLabel}>或點一個：</Text>
        <View style={s.chips}>
          {IDEAS[cat].map((i) => (
            <Chip key={i} label={i} selected={topic === i} onPress={() => setTopic(i)} />
          ))}
        </View>
      </Card>

      <Text style={s.level}>難度：{LEVEL_LABEL[settings.level]}（可到設定調整）</Text>

      {err ? <Notice tone="bad" text={err} /> : null}

      {busy ? (
        <View style={s.busy}>
          <ActivityIndicator color={C.primary} />
          <Text style={s.busyText}>
            手機上的 AI 正在寫短文和題目…（{elapsed} 秒，已寫 {chars} 字元）{'\n'}通常要 30～90 秒。
          </Text>
        </View>
      ) : (
        <Btn title="產生短文" icon="magic" style={{ marginTop: 16 }} disabled={!modelReady} onPress={run} />
      )}
    </StackPage>
  );
}

const s = StyleSheet.create({
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  input: { backgroundColor: C.bg, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 15, color: C.text },
  ideaLabel: { fontSize: 13, color: C.sub, marginTop: 14, marginBottom: 8 },
  level: { fontSize: 13, color: C.sub, marginTop: 16, marginBottom: 6 },
  busy: { flexDirection: 'row', alignItems: 'center', gap: 10, justifyContent: 'center', paddingVertical: 20 },
  busyText: { color: C.sub, fontSize: 14, flexShrink: 1, textAlign: 'center', lineHeight: 21 },
});
