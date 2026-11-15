import { useEffect, useState } from 'react';
import { Alert, Platform, Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import Constants from 'expo-constants';
import { TabPage } from '../../components/Page';
import { Btn, Card, Chip, Icon, Notice, SectionTitle, Tag } from '../../components/ui';
import { useStore } from '../../lib/store';
import { MODELS, downloadedSizeMB, freeSpaceMB, generate, getSpec } from '../../lib/llm';
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
  const { settings, updateSettings, resetProgress, downloaded, download, downloadError, startDownload, cancelDownload, removeModel } = useStore();
  const [testMsg, setTestMsg] = useState<{ tone: 'good' | 'bad' | 'info'; text: string } | null>(null);
  const [testing, setTesting] = useState(false);
  const [voices, setVoices] = useState<{ id: string; name: string; lang: string }[]>([]);
  const [showVoices, setShowVoices] = useState(false);

  useEffect(() => {
    englishVoices().then(setVoices);
  }, []);

  const spec = getSpec(settings.modelId);
  const isDl = downloaded[settings.modelId];
  const dlThis = download?.id === settings.modelId ? download : null;

  async function testModel() {
    setTesting(true);
    setTestMsg({ tone: 'info', text: '第一次會花幾秒載入模型…' });
    try {
      const r = await generate({
        modelId: settings.modelId,
        system: 'You are a friendly English tutor. Answer in one short sentence.',
        messages: [{ role: 'user', content: 'Say hello to a beginner English learner from Taiwan.' }],
        maxTokens: 40,
      });
      setTestMsg({
        tone: 'good',
        text: `可以用了！\n「${r.text.trim()}」\n用了 ${(r.ms / 1000).toFixed(1)} 秒，每秒約 ${r.tokensPerSecond} 個字詞。`,
      });
    } catch (e) {
      setTestMsg({ tone: 'bad', text: (e as Error).message });
    } finally {
      setTesting(false);
    }
  }

  function confirmDelete() {
    const go = async () => {
      await removeModel(settings.modelId);
      setTestMsg(null);
    };
    if (Platform.OS === 'web') return go();
    Alert.alert('刪除模型', `刪除「${spec.label}」可以空出約 ${downloadedSizeMB(settings.modelId)} MB，之後要用 AI 對話得重新下載。確定嗎？`, [
      { text: '取消', style: 'cancel' },
      { text: '刪除', style: 'destructive', onPress: go },
    ]);
  }

  function confirmReset() {
    const go = () => resetProgress();
    if (Platform.OS === 'web') return go();
    Alert.alert('清除學習紀錄', '單字進度、收藏、聽力成績和 AI 產生的短文都會刪除，模型和設定會保留。確定嗎？', [
      { text: '取消', style: 'cancel' },
      { text: '清除', style: 'destructive', onPress: go },
    ]);
  }

  const voiceName = settings.voice ? voices.find((v) => v.id === settings.voice)?.name ?? settings.voice : '系統預設';
  const free = freeSpaceMB();

  return (
    <TabPage title="設定">
      <SectionTitle>離線 AI 模型</SectionTitle>
      <Card style={{ gap: 10 }}>
        <Text style={s.help}>AI 對話、檢討和產生聽力短文都在手機上執行，不用網路、不用金鑰，你說的話也不會傳出去。</Text>
        {MODELS.map((m) => {
          const on = settings.modelId === m.id;
          const dl = download?.id === m.id;
          return (
            <Pressable key={m.id} testID={`model-${m.id}`} onPress={() => updateSettings({ modelId: m.id })} style={s.radioRow}>
              <Icon name={on ? 'dot-circle-o' : 'circle-o'} size={20} color={on ? C.primary : C.faint} />
              <View style={{ flex: 1 }}>
                <Text style={s.radioTitle}>{m.label}</Text>
                <Text style={s.radioSub}>{m.note}</Text>
              </View>
              {downloaded[m.id] ? (
                <Tag label="已下載" fg={C.good} bg={C.goodSoft} />
              ) : dl ? (
                <Tag label={`${Math.round((download?.fraction ?? 0) * 100)}%`} fg={C.primary} bg={C.primarySoft} />
              ) : null}
            </Pressable>
          );
        })}

        {dlThis ? (
          <View style={{ marginTop: 4 }}>
            <View style={s.barBg}>
              <View style={[s.barFg, { width: `${Math.round(dlThis.fraction * 100)}%` }]} />
            </View>
            <Text style={s.help}>
              下載中 {dlThis.mbDone} / {dlThis.mbTotal || spec.approxMB} MB。可以先去練單字和聽力，別關掉 App。
            </Text>
            <Btn small variant="ghost" title="取消下載" style={{ marginTop: 8 }} onPress={cancelDownload} />
          </View>
        ) : isDl ? (
          <View style={{ flexDirection: 'row', gap: 10, marginTop: 4 }}>
            <Btn style={{ flex: 1 }} testID="model-test" title="測試模型" icon="play" loading={testing} onPress={testModel} />
            <Btn variant="danger" title="刪除" icon="trash-o" onPress={confirmDelete} />
          </View>
        ) : (
          <View style={{ marginTop: 4 }}>
            <Btn
              testID="model-download"
              title={`下載（約 ${spec.approxMB >= 1000 ? `${(spec.approxMB / 1024).toFixed(1)} GB` : `${spec.approxMB} MB`}）`}
              icon="download"
              disabled={!!download}
              onPress={() => startDownload(settings.modelId)}
            />
            <Text style={[s.help, { marginTop: 8 }]}>
              建議用 Wi-Fi。{free > 0 ? `手機目前剩 ${(free / 1024).toFixed(1)} GB。` : ''}
            </Text>
          </View>
        )}
        {downloadError ? <Notice tone="bad" text={downloadError} /> : null}
        {testMsg ? <Notice tone={testMsg.tone} text={testMsg.text} /> : null}
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
  barBg: { height: 8, backgroundColor: C.line, borderRadius: 4, overflow: 'hidden', marginBottom: 8 },
  barFg: { height: 8, backgroundColor: C.primary, borderRadius: 4 },
  help: { fontSize: 13, color: C.sub, lineHeight: 19 },
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
