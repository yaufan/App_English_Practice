import { useEffect, useState } from 'react';
import { Alert, Linking, Platform, Pressable, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import Constants from 'expo-constants';
import { TabPage } from '../../components/Page';
import { Btn, Card, Chip, Icon, Notice, SectionTitle } from '../../components/ui';
import { useStore } from '../../lib/store';
import { MODELS, testKey } from '../../lib/claude';
import { LEVEL_LABEL, type Level } from '../../lib/prompts';
import { englishVoices, speak } from '../../lib/tts';
import { C } from '../../theme';

const RATES: { v: number; label: string }[] = [
  { v: 0.6, label: '很慢' },
  { v: 0.75, label: '慢' },
  { v: 0.85, label: '稍慢' },
  { v: 1.0, label: '正常' },
];

export default function SettingsScreen() {
  const { apiKey, setApiKey, settings, updateSettings, resetProgress } = useStore();
  const [keyInput, setKeyInput] = useState('');
  const [keyMsg, setKeyMsg] = useState<{ tone: 'good' | 'bad' | 'info'; text: string } | null>(null);
  const [testing, setTesting] = useState(false);
  const [voices, setVoices] = useState<{ id: string; name: string; lang: string }[]>([]);
  const [showVoices, setShowVoices] = useState(false);

  useEffect(() => {
    englishVoices().then(setVoices);
  }, []);

  const masked = apiKey ? `${apiKey.slice(0, 10)}…${apiKey.slice(-4)}` : '';

  async function saveAndTest() {
    const k = keyInput.trim();
    if (!k) return;
    setTesting(true);
    setKeyMsg(null);
    try {
      await testKey(k, settings.model);
      await setApiKey(k);
      setKeyInput('');
      setKeyMsg({ tone: 'good', text: '金鑰可以用，已儲存在這支手機。' });
    } catch (e) {
      setKeyMsg({ tone: 'bad', text: (e as Error).message });
    } finally {
      setTesting(false);
    }
  }

  async function retest() {
    setTesting(true);
    setKeyMsg(null);
    try {
      await testKey(apiKey, settings.model);
      setKeyMsg({ tone: 'good', text: `連線正常（${MODELS.find((m) => m.id === settings.model)?.label}）。` });
    } catch (e) {
      setKeyMsg({ tone: 'bad', text: (e as Error).message });
    } finally {
      setTesting(false);
    }
  }

  function confirmReset() {
    const go = () => resetProgress();
    if (Platform.OS === 'web') return go();
    Alert.alert('清除學習紀錄', '單字進度、收藏、聽力成績和 AI 產生的短文都會刪除，金鑰和設定會保留。確定嗎？', [
      { text: '取消', style: 'cancel' },
      { text: '清除', style: 'destructive', onPress: go },
    ]);
  }

  const voiceName = settings.voice ? voices.find((v) => v.id === settings.voice)?.name ?? settings.voice : '系統預設';

  return (
    <TabPage title="設定">
      <SectionTitle>Claude API 金鑰</SectionTitle>
      <Card>
        {apiKey ? (
          <View style={s.keyRow}>
            <Icon name="key" size={16} color={C.good} />
            <Text style={s.keyText}>{masked}</Text>
            <Btn small variant="ghost" title="測試" loading={testing} onPress={retest} />
            <Btn small variant="danger" title="移除" onPress={() => setApiKey('')} />
          </View>
        ) : (
          <Text style={s.help}>對話檢討、AI 對話和產生聽力短文需要金鑰。金鑰只存在這支手機裡。</Text>
        )}
        <TextInput
          value={keyInput}
          onChangeText={setKeyInput}
          placeholder={apiKey ? '貼上新的金鑰以更換' : 'sk-ant-…'}
          placeholderTextColor={C.faint}
          autoCapitalize="none"
          autoCorrect={false}
          secureTextEntry
          style={s.input}
        />
        <Btn title="儲存並測試" icon="check" style={{ marginTop: 10 }} disabled={!keyInput.trim()} loading={testing && !!keyInput} onPress={saveAndTest} />
        {keyMsg ? <View style={{ marginTop: 10 }}><Notice tone={keyMsg.tone} text={keyMsg.text} /></View> : null}
        <Pressable onPress={() => Linking.openURL('https://console.anthropic.com/settings/keys')} style={{ marginTop: 12 }}>
          <Text style={s.link}>到 console.anthropic.com 建立金鑰 ›</Text>
        </Pressable>
      </Card>

      <SectionTitle>AI 模型</SectionTitle>
      <Card style={{ gap: 10 }}>
        {MODELS.map((m) => (
          <Pressable key={m.id} onPress={() => updateSettings({ model: m.id })} style={s.radioRow}>
            <Icon name={settings.model === m.id ? 'dot-circle-o' : 'circle-o'} size={20} color={settings.model === m.id ? C.primary : C.faint} />
            <View style={{ flex: 1 }}>
              <Text style={s.radioTitle}>{m.label}</Text>
              <Text style={s.radioSub}>{m.note}</Text>
            </View>
          </Pressable>
        ))}
      </Card>

      <SectionTitle>英文難度</SectionTitle>
      <Card style={{ gap: 10 }}>
        {(Object.keys(LEVEL_LABEL) as Level[]).map((l) => (
          <Pressable key={l} onPress={() => updateSettings({ level: l })} style={s.radioRow}>
            <Icon name={settings.level === l ? 'dot-circle-o' : 'circle-o'} size={20} color={settings.level === l ? C.primary : C.faint} />
            <Text style={[s.radioTitle, { flex: 1 }]}>{LEVEL_LABEL[l]}</Text>
          </Pressable>
        ))}
        <Text style={s.help}>影響 AI 對話和 AI 產生短文用的字和句子長度。</Text>
      </Card>

      <SectionTitle>朗讀</SectionTitle>
      <Card>
        <Text style={s.label}>速度</Text>
        <View style={s.chips}>
          {RATES.map((r) => (
            <Chip
              key={r.v}
              label={r.label}
              selected={settings.rate === r.v}
              onPress={() => {
                updateSettings({ rate: r.v });
                speak('This is how fast I will speak.', { rate: r.v, voice: settings.voice });
              }}
            />
          ))}
        </View>

        <Text style={[s.label, { marginTop: 16 }]}>聲音</Text>
        <Pressable onPress={() => setShowVoices((v) => !v)} style={s.voiceBtn}>
          <Text style={s.voiceText}>{voiceName}</Text>
          <Icon name={showVoices ? 'chevron-up' : 'chevron-down'} size={12} color={C.sub} />
        </Pressable>
        {showVoices && (
          <View style={{ marginTop: 8, gap: 6 }}>
            <VoiceRow label="系統預設" selected={!settings.voice} onPress={() => updateSettings({ voice: '' })} />
            {voices.length === 0 ? <Text style={s.help}>找不到可選的英文聲音，會用系統預設。</Text> : null}
            {voices.map((v) => (
              <VoiceRow
                key={v.id}
                label={`${v.name}（${v.lang}）`}
                selected={settings.voice === v.id}
                onPress={() => {
                  updateSettings({ voice: v.id });
                  speak('Hello! Nice to meet you.', { rate: settings.rate, voice: v.id });
                }}
              />
            ))}
          </View>
        )}

        <View style={[s.switchRow, { marginTop: 16 }]}>
          <View style={{ flex: 1 }}>
            <Text style={s.radioTitle}>自動朗讀</Text>
            <Text style={s.radioSub}>對話和單字卡出現時自動唸出來</Text>
          </View>
          <Switch value={settings.autoPlay} onValueChange={(v) => updateSettings({ autoPlay: v })} />
        </View>
        <View style={[s.switchRow, { marginTop: 12 }]}>
          <View style={{ flex: 1 }}>
            <Text style={s.radioTitle}>對話預設顯示中文</Text>
            <Text style={s.radioSub}>關掉後要按「看中文」才會顯示</Text>
          </View>
          <Switch value={settings.showZh} onValueChange={(v) => updateSettings({ showZh: v })} />
        </View>
      </Card>

      <SectionTitle>單字</SectionTitle>
      <Card>
        <Text style={s.label}>每天新字數量</Text>
        <View style={s.chips}>
          {[5, 10, 15, 20, 30].map((n) => (
            <Chip key={n} label={`${n}`} selected={settings.newPerDay === n} onPress={() => updateSettings({ newPerDay: n })} />
          ))}
        </View>
      </Card>

      <SectionTitle>其他</SectionTitle>
      <Card>
        <Btn title="清除學習紀錄" variant="danger" icon="trash-o" onPress={confirmReset} />
        <Text style={[s.help, { marginTop: 12, textAlign: 'center' }]}>
          英文練習 v{Constants.expoConfig?.version ?? '1.0.0'}
        </Text>
      </Card>
    </TabPage>
  );
}

function VoiceRow({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={[s.voiceRow, selected && { backgroundColor: C.primarySoft }]}>
      <Icon name={selected ? 'check' : 'volume-up'} size={13} color={selected ? C.primary : C.faint} />
      <Text style={[s.voiceRowText, selected && { color: C.primary, fontWeight: '800' }]}>{label}</Text>
    </Pressable>
  );
}

const s = StyleSheet.create({
  keyRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  keyText: { flex: 1, fontSize: 14, color: C.text, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' },
  help: { fontSize: 13, color: C.sub, lineHeight: 19 },
  input: { marginTop: 10, backgroundColor: C.bg, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 11, fontSize: 15, color: C.text },
  link: { color: C.primary, fontWeight: '700', fontSize: 14 },
  radioRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 4 },
  radioTitle: { fontSize: 15, fontWeight: '700', color: C.text },
  radioSub: { fontSize: 13, color: C.sub, marginTop: 2 },
  label: { fontSize: 13, color: C.sub, fontWeight: '700', marginBottom: 8 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  voiceBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: C.bg, borderRadius: 10, padding: 12 },
  voiceText: { fontSize: 15, color: C.text },
  voiceRow: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 10, borderRadius: 8 },
  voiceRowText: { fontSize: 14, color: C.text, flex: 1 },
  switchRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
});
