import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { StoreProvider } from '../lib/store';
import { C } from '../theme';

export default function RootLayout() {
  return (
    <StoreProvider>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerTintColor: C.text,
          headerStyle: { backgroundColor: C.bg },
          headerTransparent: false,
          headerShadowVisible: false,
          headerTitleStyle: { fontWeight: '800' },
          headerBackTitle: '返回',
          contentStyle: { backgroundColor: C.bg },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="conversation/[id]" options={{ title: '口說對話' }} />
        <Stack.Screen name="study" options={{ title: '單字複習' }} />
        <Stack.Screen name="deck/[id]" options={{ title: '單字列表' }} />
        <Stack.Screen name="passage/[id]" options={{ title: '聽力練習' }} />
        <Stack.Screen name="passage-new" options={{ title: 'AI 產生聽力短文' }} />
      </Stack>
    </StoreProvider>
  );
}
