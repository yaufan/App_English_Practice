import { StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { TabPage } from '../../components/Page';
import { Btn, Card, Icon, SectionTitle } from '../../components/ui';
import { useStore } from '../../lib/store';
import { countDue, countLearned } from '../../lib/srs';
import { ALL_DECK_ID, deckItems } from '../../lib/vocab';
import { DECKS, SAVED_DECK_ID } from '../../data/decks';
import { C } from '../../theme';

export default function Words() {
  const router = useRouter();
  const { progress, today, newLeftToday } = useStore();

  const allIds = deckItems(ALL_DECK_ID, progress.saved).map((i) => i.id);
  const due = countDue(allIds, progress.srs, today);
  const unseen = allIds.filter((id) => !progress.srs[id]).length;
  const fresh = Math.min(newLeftToday, unseen);

  const decks = [
    ...(progress.saved.length > 0
      ? [{ id: SAVED_DECK_ID, title: '我的收藏', subtitle: '對話和聽力裡存下來的句子', icon: 'bookmark', count: progress.saved.length }]
      : []),
    ...DECKS.map((d) => ({ id: d.id, title: d.title, subtitle: d.subtitle, icon: d.icon, count: d.items.length })),
  ];

  const go = (deck: string, mode: 'flip' | 'speak') => router.push({ pathname: '/study', params: { deck, mode } });

  return (
    <TabPage title="單字片語" subtitle="間隔複習：忘記的會更快再出現">
      <Card style={s.hero}>
        <View style={{ flex: 1 }}>
          <Text style={s.heroN}>{due + fresh}</Text>
          <Text style={s.heroLabel}>今天要練的卡片</Text>
          <Text style={s.heroSub}>
            複習 {due}・新字 {fresh}
          </Text>
        </View>
        <View style={{ gap: 8 }}>
          <Btn small title="翻卡" icon="clone" disabled={due + fresh === 0} onPress={() => go(ALL_DECK_ID, 'flip')} />
          <Btn small variant="secondary" title="開口說" icon="microphone" disabled={due + fresh === 0} onPress={() => go(ALL_DECK_ID, 'speak')} />
        </View>
      </Card>

      <SectionTitle>單字組</SectionTitle>
      <View style={{ gap: 12 }}>
        {decks.map((d) => {
          const ids = deckItems(d.id, progress.saved).map((i) => i.id);
          const learned = countLearned(ids, progress.srs);
          const dDue = countDue(ids, progress.srs, today);
          const pct = d.count ? learned / d.count : 0;
          return (
            <Card key={d.id}>
              <View style={s.row}>
                <View style={s.iconBox}>
                  <Icon name={d.icon} size={19} color={C.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.title}>{d.title}</Text>
                  <Text style={s.sub}>{d.subtitle}</Text>
                </View>
                {dDue > 0 && (
                  <View style={s.dueBadge}>
                    <Text style={s.dueText}>{dDue} 待複習</Text>
                  </View>
                )}
              </View>
              <View style={s.barBg}>
                <View style={[s.barFg, { width: `${Math.round(pct * 100)}%` }]} />
              </View>
              <Text style={s.barText}>
                已學 {learned} / {d.count}
              </Text>
              <View style={s.btnRow}>
                <Btn small style={{ flex: 1 }} title="翻卡" icon="clone" onPress={() => go(d.id, 'flip')} />
                <Btn small style={{ flex: 1 }} variant="secondary" title="開口說" icon="microphone" onPress={() => go(d.id, 'speak')} />
                <Btn small style={{ flex: 1 }} variant="ghost" title="列表" icon="list" onPress={() => router.push({ pathname: '/deck/[id]', params: { id: d.id } })} />
              </View>
            </Card>
          );
        })}
      </View>
    </TabPage>
  );
}

const s = StyleSheet.create({
  hero: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  heroN: { fontSize: 40, fontWeight: '900', color: C.primary },
  heroLabel: { fontSize: 15, fontWeight: '800', color: C.text },
  heroSub: { fontSize: 13, color: C.sub, marginTop: 3 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconBox: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: C.primarySoft },
  title: { fontSize: 16, fontWeight: '800', color: C.text },
  sub: { fontSize: 13, color: C.sub, marginTop: 2 },
  dueBadge: { backgroundColor: C.warnSoft, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999 },
  dueText: { color: '#8A5A00', fontSize: 12, fontWeight: '800' },
  barBg: { height: 6, backgroundColor: C.line, borderRadius: 3, marginTop: 14, overflow: 'hidden' },
  barFg: { height: 6, backgroundColor: C.good, borderRadius: 3 },
  barText: { fontSize: 12, color: C.sub, marginTop: 6 },
  btnRow: { flexDirection: 'row', gap: 8, marginTop: 12 },
});
