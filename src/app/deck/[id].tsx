import { useState } from 'react';
import { Alert, FlatList, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import { Icon, SpeakBtn } from '../../components/ui';
import { useStore } from '../../lib/store';
import { deckItems, deckTitle } from '../../lib/vocab';
import { SAVED_DECK_ID } from '../../data/decks';
import { C } from '../../theme';

export default function DeckList() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { progress, today, removeSaved } = useStore();
  const [q, setQ] = useState('');
  const items = deckItems(id, progress.saved).filter((i) => {
    const t = q.trim().toLowerCase();
    return !t || i.en.toLowerCase().includes(t) || i.zh.includes(t);
  });
  const isSavedDeck = id === SAVED_DECK_ID;

  const confirmRemove = (itemId: string, en: string) => {
    if (Platform.OS === 'web') {
      removeSaved(itemId);
      return;
    }
    Alert.alert('刪除收藏', `確定刪除「${en}」？`, [
      { text: '取消', style: 'cancel' },
      { text: '刪除', style: 'destructive', onPress: () => removeSaved(itemId) },
    ]);
  };

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <Stack.Screen options={{ title: deckTitle(id) }} />
      <View style={s.searchBox}>
        <Icon name="search" size={14} color={C.faint} />
        <TextInput value={q} onChangeText={setQ} placeholder="搜尋英文或中文" placeholderTextColor={C.faint} style={s.search} />
      </View>
      <FlatList
        data={items}
        keyExtractor={(i) => i.id}
        contentContainerStyle={{ paddingHorizontal: 18, paddingBottom: 30 }}
        ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
        ListEmptyComponent={<Text style={s.empty}>{isSavedDeck ? '還沒有收藏。對話檢討和聽力裡可以按書籤收藏句子。' : '找不到符合的單字'}</Text>}
        renderItem={({ item }) => {
          const st = progress.srs[item.id];
          const status = !st ? { t: '未學', c: C.faint } : st.due <= today ? { t: '待複習', c: C.warn } : { t: `${st.due - today} 天後`, c: C.good };
          return (
            <View style={s.row}>
              <View style={{ flex: 1 }}>
                <Text style={s.en}>{item.en}</Text>
                <Text style={s.zh}>{item.zh}</Text>
                {item.ex ? <Text style={s.ex}>{item.ex}</Text> : null}
              </View>
              <View style={{ alignItems: 'flex-end', gap: 8 }}>
                <Text style={[s.status, { color: status.c }]}>{status.t}</Text>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <SpeakBtn text={item.en} size={32} />
                  {isSavedDeck && (
                    <Pressable onPress={() => confirmRemove(item.id, item.en)} hitSlop={8} style={s.del}>
                      <Icon name="trash-o" size={15} color={C.bad} />
                    </Pressable>
                  )}
                </View>
              </View>
            </View>
          );
        }}
      />
    </View>
  );
}

const s = StyleSheet.create({
  searchBox: { flexDirection: 'row', alignItems: 'center', gap: 8, margin: 18, marginTop: 8, paddingHorizontal: 12, backgroundColor: C.card, borderRadius: 10 },
  search: { flex: 1, paddingVertical: 10, fontSize: 15, color: C.text },
  row: { flexDirection: 'row', gap: 10, backgroundColor: C.card, borderRadius: 12, padding: 14 },
  en: { fontSize: 16, fontWeight: '800', color: C.text },
  zh: { fontSize: 14, color: C.sub, marginTop: 3 },
  ex: { fontSize: 13, color: C.faint, marginTop: 6, fontStyle: 'italic' },
  status: { fontSize: 12, fontWeight: '800' },
  del: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: C.badSoft },
  empty: { textAlign: 'center', color: C.sub, marginTop: 40, lineHeight: 22, paddingHorizontal: 20 },
});
