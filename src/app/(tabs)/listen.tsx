import { StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { TabPage } from '../../components/Page';
import { Card, Icon, SectionTitle, Tag } from '../../components/ui';
import { useStore } from '../../lib/store';
import { PASSAGES, type Passage } from '../../data/listening';
import { CATEGORY_LABEL, type Category } from '../../data/scenarios';
import { C, CAT_COLOR } from '../../theme';

const ORDER: Category[] = ['daily', 'work', 'exam'];

export default function Listen() {
  const router = useRouter();
  const { progress } = useStore();

  const Row = ({ p }: { p: Passage }) => {
    const done = progress.listenDone[p.id];
    return (
      <Card onPress={() => router.push({ pathname: '/passage/[id]', params: { id: p.id } })}>
        <View style={s.row}>
          <View style={[s.iconBox, { backgroundColor: CAT_COLOR[p.category].bg }]}>
            <Icon name={p.generated ? 'magic' : 'headphones'} size={18} color={CAT_COLOR[p.category].fg} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.title}>{p.title}</Text>
            <Text style={s.sub} numberOfLines={1}>
              {p.titleEn}
            </Text>
          </View>
          {done ? <Tag label={`答對 ${done.correct}/${done.total}`} fg={C.good} bg={C.goodSoft} /> : null}
          <Icon name="chevron-right" size={13} color={C.faint} />
        </View>
      </Card>
    );
  };

  return (
    <TabPage title="聽力" subtitle="慢速播放、逐句聽、聽寫、做題目">
      <Card onPress={() => router.push('/passage-new')} style={s.genCard}>
        <View style={s.row}>
          <View style={[s.iconBox, { backgroundColor: '#fff' }]}>
            <Icon name="magic" size={18} color={C.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[s.title, { color: '#fff' }]}>請 AI 產生新短文</Text>
            <Text style={[s.sub, { color: '#DCE6FF' }]}>指定主題和類型，馬上有新的聽力練習</Text>
          </View>
          <Icon name="chevron-right" size={13} color="#fff" />
        </View>
      </Card>

      {progress.passages.length > 0 && (
        <>
          <SectionTitle>AI 產生的</SectionTitle>
          <View style={{ gap: 10 }}>
            {progress.passages.map((p) => (
              <Row key={p.id} p={p} />
            ))}
          </View>
        </>
      )}

      {ORDER.map((cat) => (
        <View key={cat}>
          <SectionTitle>{CATEGORY_LABEL[cat]}</SectionTitle>
          <View style={{ gap: 10 }}>
            {PASSAGES.filter((p) => p.category === cat).map((p) => (
              <Row key={p.id} p={p} />
            ))}
          </View>
        </View>
      ))}
    </TabPage>
  );
}

const s = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconBox: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 16, fontWeight: '800', color: C.text },
  sub: { fontSize: 13, color: C.sub, marginTop: 2 },
  genCard: { backgroundColor: C.primary },
});
