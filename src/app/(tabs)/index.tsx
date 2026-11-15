import { StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { TabPage } from '../../components/Page';
import { Btn, Card, Icon, NeedModelNotice, SectionTitle, Tag } from '../../components/ui';
import { useStore } from '../../lib/store';
import { countDue, countLearned } from '../../lib/srs';
import { ALL_DECK_ID, deckItems } from '../../lib/vocab';
import { SCENARIOS, CATEGORY_LABEL } from '../../data/scenarios';
import { PASSAGES } from '../../data/listening';
import { C, CAT_COLOR } from '../../theme';

const WEEKDAY = ['日', '一', '二', '三', '四', '五', '六'];

export default function Today() {
  const router = useRouter();
  const { progress, today, newLeftToday, streak } = useStore();

  const all = deckItems(ALL_DECK_ID, progress.saved).map((i) => i.id);
  const due = countDue(all, progress.srs, today);
  const unseen = all.filter((id) => !progress.srs[id]).length;
  const newToday = Math.min(newLeftToday, unseen);
  const learned = countLearned(all, progress.srs);

  const scenario = SCENARIOS[today % SCENARIOS.length];
  const passage = PASSAGES.find((p) => !progress.listenDone[p.id]) ?? PASSAGES[today % PASSAGES.length];
  const talks = Object.values(progress.talkDone).reduce((a, b) => a + b, 0);
  const listens = Object.keys(progress.listenDone).length;

  const d = new Date();
  const dateText = `${d.getMonth() + 1} 月 ${d.getDate()} 日 星期${WEEKDAY[d.getDay()]}`;

  return (
    <TabPage
      title="今天"
      subtitle={dateText}
      right={
        <View style={s.streak}>
          <Icon name="fire" size={18} color={streak > 0 ? '#FF7A1A' : C.faint} />
          <Text style={[s.streakText, streak === 0 && { color: C.faint }]}>{streak} 天</Text>
        </View>
      }
    >
      <NeedModelNotice />

      <SectionTitle>單字複習</SectionTitle>
      <Card>
        <View style={s.row}>
          <Stat n={due} label="待複習" color={C.warn} />
          <Stat n={newToday} label="今日新字" color={C.primary} />
          <Stat n={learned} label="已學會" color={C.good} />
        </View>
        <Btn
          style={{ marginTop: 14 }}
          title={due + newToday > 0 ? `開始（${due + newToday} 張）` : '今天的進度完成了'}
          icon="play"
          disabled={due + newToday === 0}
          onPress={() => router.push({ pathname: '/study', params: { deck: ALL_DECK_ID, mode: 'flip' } })}
        />
      </Card>

      <SectionTitle>今日對話</SectionTitle>
      <Card onPress={() => router.push({ pathname: '/conversation/[id]', params: { id: scenario.id } })}>
        <View style={s.row}>
          <View style={[s.iconBox, { backgroundColor: CAT_COLOR[scenario.category].bg }]}>
            <Icon name={scenario.icon} size={22} color={CAT_COLOR[scenario.category].fg} />
          </View>
          <View style={{ flex: 1 }}>
            <Tag label={CATEGORY_LABEL[scenario.category]} {...CAT_COLOR[scenario.category]} />
            <Text style={s.cardTitle}>{scenario.title}</Text>
            <Text style={s.cardSub}>{scenario.goalZh}</Text>
          </View>
          <Icon name="chevron-right" size={14} color={C.faint} />
        </View>
      </Card>

      <SectionTitle>今日聽力</SectionTitle>
      <Card onPress={() => router.push({ pathname: '/passage/[id]', params: { id: passage.id } })}>
        <View style={s.row}>
          <View style={[s.iconBox, { backgroundColor: CAT_COLOR[passage.category].bg }]}>
            <Icon name="headphones" size={22} color={CAT_COLOR[passage.category].fg} />
          </View>
          <View style={{ flex: 1 }}>
            <Tag label={CATEGORY_LABEL[passage.category]} {...CAT_COLOR[passage.category]} />
            <Text style={s.cardTitle}>{passage.title}</Text>
            <Text style={s.cardSub}>{passage.titleEn}</Text>
          </View>
          <Icon name="chevron-right" size={14} color={C.faint} />
        </View>
      </Card>

      <SectionTitle>累積</SectionTitle>
      <Card>
        <View style={s.row}>
          <Stat n={talks} label="完成對話" color={C.text} />
          <Stat n={listens} label="完成聽力" color={C.text} />
          <Stat n={progress.saved.length} label="收藏句子" color={C.text} />
        </View>
      </Card>
    </TabPage>
  );
}

function Stat({ n, label, color }: { n: number; label: string; color: string }) {
  return (
    <View style={{ flex: 1, alignItems: 'center' }}>
      <Text style={[s.statN, { color }]}>{n}</Text>
      <Text style={s.statLabel}>{label}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  streak: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: C.card, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999 },
  streakText: { fontSize: 15, fontWeight: '800', color: '#FF7A1A' },
  statN: { fontSize: 26, fontWeight: '900' },
  statLabel: { fontSize: 13, color: C.sub, marginTop: 2 },
  iconBox: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  cardTitle: { fontSize: 17, fontWeight: '800', color: C.text, marginTop: 6 },
  cardSub: { fontSize: 13, color: C.sub, marginTop: 3 },
});
