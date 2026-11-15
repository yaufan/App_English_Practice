import { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { TabPage } from '../../components/Page';
import { Btn, Card, Icon, NeedModelNotice, SectionTitle } from '../../components/ui';
import { useStore } from '../../lib/store';
import { CATEGORY_LABEL, SCENARIOS, type Category } from '../../data/scenarios';
import { C, CAT_COLOR } from '../../theme';

const ORDER: Category[] = ['daily', 'work', 'exam'];

export default function Talk() {
  const router = useRouter();
  const { progress } = useStore();
  const [topic, setTopic] = useState('');

  return (
    <TabPage title="口說對話" subtitle="選一個情境，跟 AI 用語音一來一往">
      <NeedModelNotice />

      <Card style={{ marginTop: 12 }}>
        <Text style={s.freeTitle}>自由聊天</Text>
        <Text style={s.freeSub}>輸入想聊的主題，中文也可以</Text>
        <View style={s.freeRow}>
          <TextInput
            testID="topic-input"
            value={topic}
            onChangeText={setTopic}
            placeholder="例如：週末去哪裡玩、最近看的電影"
            placeholderTextColor={C.faint}
            style={s.input}
            returnKeyType="go"
            onSubmitEditing={() => topic.trim() && router.push({ pathname: '/conversation/[id]', params: { id: 'free', topic: topic.trim() } })}
          />
          <Btn
            title="開始"
            small
            disabled={!topic.trim()}
            onPress={() => router.push({ pathname: '/conversation/[id]', params: { id: 'free', topic: topic.trim() } })}
          />
        </View>
      </Card>

      {ORDER.map((cat) => (
        <View key={cat}>
          <SectionTitle>{CATEGORY_LABEL[cat]}</SectionTitle>
          <View style={{ gap: 10 }}>
            {SCENARIOS.filter((x) => x.category === cat).map((sc) => {
              const n = progress.talkDone[sc.id] ?? 0;
              return (
                <Card key={sc.id} onPress={() => router.push({ pathname: '/conversation/[id]', params: { id: sc.id } })}>
                  <View style={s.row}>
                    <View style={[s.iconBox, { backgroundColor: CAT_COLOR[cat].bg }]}>
                      <Icon name={sc.icon} size={20} color={CAT_COLOR[cat].fg} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={s.title}>{sc.title}</Text>
                      <Text style={s.sub} numberOfLines={1}>
                        {sc.titleEn}
                      </Text>
                    </View>
                    {n > 0 ? (
                      <View style={s.done}>
                        <Icon name="check" size={11} color={C.good} />
                        <Text style={s.doneText}>{n}</Text>
                      </View>
                    ) : null}
                    <Icon name="chevron-right" size={13} color={C.faint} />
                  </View>
                </Card>
              );
            })}
          </View>
        </View>
      ))}
    </TabPage>
  );
}

const s = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconBox: { width: 42, height: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 16, fontWeight: '800', color: C.text },
  sub: { fontSize: 13, color: C.sub, marginTop: 2 },
  done: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: C.goodSoft, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999 },
  doneText: { fontSize: 12, color: C.good, fontWeight: '800' },
  freeTitle: { fontSize: 16, fontWeight: '800', color: C.text },
  freeSub: { fontSize: 13, color: C.sub, marginTop: 2 },
  freeRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 12 },
  input: {
    flex: 1,
    backgroundColor: C.bg,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: C.text,
  },
});
