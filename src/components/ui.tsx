import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useRouter } from 'expo-router';
import { C, R, shadow } from '../theme';
import { useStore } from '../lib/store';
import { speak, stopSpeaking } from '../lib/tts';

export type IconName = React.ComponentProps<typeof FontAwesome>['name'];

export function Icon({ name, size = 18, color = C.text }: { name: string; size?: number; color?: string }) {
  return <FontAwesome name={name as IconName} size={size} color={color} />;
}

export function Card({
  children,
  onPress,
  style,
}: {
  children: React.ReactNode;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
}) {
  if (!onPress) return <View style={[s.card, style]}>{children}</View>;
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [s.card, style, pressed && { opacity: 0.85, transform: [{ scale: 0.99 }] }]}>
      {children}
    </Pressable>
  );
}

type BtnVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'good';

export function Btn({
  title,
  onPress,
  icon,
  variant = 'primary',
  small,
  disabled,
  loading,
  style,
}: {
  title: string;
  onPress: () => void;
  icon?: string;
  variant?: BtnVariant;
  small?: boolean;
  disabled?: boolean;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const palette: Record<BtnVariant, { bg: string; fg: string; border?: string }> = {
    primary: { bg: C.primary, fg: '#fff' },
    secondary: { bg: C.primarySoft, fg: C.primary },
    ghost: { bg: 'transparent', fg: C.sub, border: C.line },
    danger: { bg: C.badSoft, fg: C.bad },
    good: { bg: C.good, fg: '#fff' },
  };
  const p = palette[variant];
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        s.btn,
        small && s.btnSmall,
        { backgroundColor: p.bg, borderColor: p.border ?? p.bg },
        (disabled || loading) && { opacity: 0.5 },
        pressed && { opacity: 0.8 },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={p.fg} size="small" />
      ) : icon ? (
        <Icon name={icon} size={small ? 14 : 16} color={p.fg} />
      ) : null}
      <Text style={[s.btnText, small && { fontSize: 14 }, { color: p.fg }]}>{title}</Text>
    </Pressable>
  );
}

export function Chip({ label, selected, onPress }: { label: string; selected?: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={[s.chip, selected && s.chipOn]}>
      <Text style={[s.chipText, selected && { color: '#fff' }]}>{label}</Text>
    </Pressable>
  );
}

/** Small round button that reads English text aloud with the user's speed and voice. */
export function SpeakBtn({ text, size = 34, slow }: { text: string; size?: number; slow?: boolean }) {
  const { settings } = useStore();
  const [on, setOn] = useState(false);
  return (
    <Pressable
      hitSlop={8}
      onPress={() => {
        if (on) {
          stopSpeaking();
          setOn(false);
          return;
        }
        setOn(true);
        speak(text, { rate: slow ? Math.min(settings.rate, 0.6) : settings.rate, voice: settings.voice }, () => setOn(false));
      }}
      style={[s.speak, { width: size, height: size, borderRadius: size / 2 }, on && { backgroundColor: C.primary }]}
    >
      <Icon name={slow ? 'hourglass-half' : 'volume-up'} size={size * 0.45} color={on ? '#fff' : C.primary} />
    </Pressable>
  );
}

export function MicBtn({ listening, onPress, size = 72 }: { listening: boolean; onPress: () => void; size?: number }) {
  const pulse = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (!listening) {
      pulse.stopAnimation();
      pulse.setValue(0);
      return;
    }
    const loop = Animated.loop(Animated.timing(pulse, { toValue: 1, duration: 1100, useNativeDriver: true }));
    loop.start();
    return () => loop.stop();
  }, [listening, pulse]);
  const ring = {
    transform: [{ scale: pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.6] }) }],
    opacity: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.45, 0] }),
  };
  return (
    <View style={{ width: size * 1.6, height: size * 1.6, alignItems: 'center', justifyContent: 'center' }}>
      {listening && (
        <Animated.View
          style={[{ position: 'absolute', width: size, height: size, borderRadius: size / 2, backgroundColor: C.mic }, ring]}
        />
      )}
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          { width: size, height: size, borderRadius: size / 2, backgroundColor: listening ? C.mic : C.primary },
          s.micInner,
          pressed && { transform: [{ scale: 0.95 }] },
        ]}
      >
        <Icon name={listening ? 'stop' : 'microphone'} size={size * 0.4} color="#fff" />
      </Pressable>
    </View>
  );
}

export function SectionTitle({ children, right }: { children: React.ReactNode; right?: React.ReactNode }) {
  return (
    <View style={s.sectionRow}>
      <Text style={s.section}>{children}</Text>
      {right}
    </View>
  );
}

export function Tag({ label, fg, bg }: { label: string; fg: string; bg: string }) {
  return (
    <View style={[s.tag, { backgroundColor: bg }]}>
      <Text style={[s.tagText, { color: fg }]}>{label}</Text>
    </View>
  );
}

export function Notice({ text, tone = 'warn', action }: { text: string; tone?: 'warn' | 'bad' | 'good' | 'info'; action?: React.ReactNode }) {
  const map = {
    warn: { bg: C.warnSoft, fg: '#8A5A00', icon: 'exclamation-circle' },
    bad: { bg: C.badSoft, fg: C.bad, icon: 'times-circle' },
    good: { bg: C.goodSoft, fg: C.good, icon: 'check-circle' },
    info: { bg: C.primarySoft, fg: C.primary, icon: 'info-circle' },
  }[tone];
  return (
    <View style={[s.notice, { backgroundColor: map.bg }]}>
      <Icon name={map.icon} size={16} color={map.fg} />
      <Text style={[s.noticeText, { color: map.fg }]}>{text}</Text>
      {action}
    </View>
  );
}

export function NeedKeyNotice() {
  const { apiKey } = useStore();
  const router = useRouter();
  if (apiKey) return null;
  return (
    <Notice
      text="AI 功能需要先在「設定」貼上 Claude API 金鑰。"
      action={<Btn small variant="secondary" title="去設定" onPress={() => router.push('/settings')} />}
    />
  );
}

const s = StyleSheet.create({
  card: { backgroundColor: C.card, borderRadius: R.md, padding: 16, ...shadow },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: R.md,
    borderWidth: 1,
  },
  btnSmall: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: R.sm },
  btnText: { fontSize: 16, fontWeight: '700' },
  chip: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 999,
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.line,
  },
  chipOn: { backgroundColor: C.primary, borderColor: C.primary },
  chipText: { fontSize: 14, color: C.sub, fontWeight: '600' },
  speak: { backgroundColor: C.primarySoft, alignItems: 'center', justifyContent: 'center' },
  micInner: { alignItems: 'center', justifyContent: 'center', ...shadow, shadowOpacity: 0.2 },
  sectionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 22, marginBottom: 10 },
  section: { fontSize: 17, fontWeight: '800', color: C.text },
  tag: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  tagText: { fontSize: 12, fontWeight: '700' },
  notice: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderRadius: R.md },
  noticeText: { flex: 1, fontSize: 14, lineHeight: 20, fontWeight: '600' },
});
