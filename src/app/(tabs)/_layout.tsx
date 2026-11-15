import { Tabs } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon } from '../../components/ui';
import { C } from '../../theme';

const TABS: { name: string; title: string; icon: string }[] = [
  { name: 'index', title: '今天', icon: 'sun-o' },
  { name: 'talk', title: '對話', icon: 'comments' },
  { name: 'words', title: '單字', icon: 'clone' },
  { name: 'listen', title: '聽力', icon: 'headphones' },
  { name: 'settings', title: '設定', icon: 'cog' },
];

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: C.primary,
        tabBarInactiveTintColor: C.faint,
        tabBarStyle: {
          backgroundColor: C.card,
          borderTopColor: C.line,
          height: 60 + insets.bottom,
          paddingTop: 4,
          paddingBottom: insets.bottom + 4,
        },
        tabBarLabelStyle: { fontSize: 12, lineHeight: 16, fontWeight: '700' },
        sceneStyle: { backgroundColor: C.bg },
      }}
    >
      {TABS.map((t) => (
        <Tabs.Screen
          key={t.name}
          name={t.name}
          options={{
            title: t.title,
            tabBarIcon: ({ color }) => <Icon name={t.icon} size={21} color={String(color)} />,
          }}
        />
      ))}
    </Tabs>
  );
}
