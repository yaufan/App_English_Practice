import React from 'react';
import { ScrollView, StyleSheet, Text, View, type ScrollViewProps } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { C } from '../theme';

/** Scrollable page for tab screens, with a big title under the status bar. */
export function TabPage({
  title,
  subtitle,
  right,
  children,
  ...rest
}: {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
  children: React.ReactNode;
} & ScrollViewProps) {
  const insets = useSafeAreaInsets();
  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[s.content, { paddingTop: insets.top + 14 }]}
        keyboardShouldPersistTaps="handled"
        {...rest}
      >
        <View style={s.head}>
          <View style={{ flex: 1 }}>
            <Text style={s.title}>{title}</Text>
            {subtitle ? <Text style={s.subtitle}>{subtitle}</Text> : null}
          </View>
          {right}
        </View>
        {children}
      </ScrollView>
      {/* solid strip behind the status bar so scrolled cards don't show under the clock */}
      <View pointerEvents="none" style={[s.statusShield, { height: insets.top }]} />
    </View>
  );
}

/** Scrollable page inside a stack screen (header already shown). */
export function StackPage({ children, ...rest }: { children: React.ReactNode } & ScrollViewProps) {
  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: C.bg }}
      contentContainerStyle={[s.content, { paddingTop: 8 }]}
      keyboardShouldPersistTaps="handled"
      {...rest}
    >
      {children}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  content: { paddingHorizontal: 18, paddingBottom: 40 },
  statusShield: { position: 'absolute', top: 0, left: 0, right: 0, backgroundColor: C.bg },
  head: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  title: { fontSize: 28, fontWeight: '900', color: C.text },
  subtitle: { fontSize: 14, color: C.sub, marginTop: 4 },
});
