import type { Category } from './data/scenarios';

export const C = {
  bg: '#F6F7FB',
  card: '#FFFFFF',
  text: '#1B2433',
  sub: '#5D6B82',
  faint: '#98A3B6',
  line: '#E6E9F0',
  primary: '#2F6BFF',
  primarySoft: '#E8EFFF',
  good: '#1F9D67',
  goodSoft: '#E3F6EE',
  warn: '#D98A00',
  warnSoft: '#FFF4DE',
  bad: '#D64545',
  badSoft: '#FDECEC',
  mic: '#FF5A5F',
};

export const CAT_COLOR: Record<Category, { fg: string; bg: string }> = {
  daily: { fg: '#1F9D67', bg: '#E3F6EE' },
  work: { fg: '#2F6BFF', bg: '#E8EFFF' },
  exam: { fg: '#B3541E', bg: '#FCEBDD' },
};

export const R = { sm: 8, md: 14, lg: 20 };

export const shadow = {
  shadowColor: '#1B2433',
  shadowOpacity: 0.06,
  shadowRadius: 10,
  shadowOffset: { width: 0, height: 3 },
  elevation: 2,
} as const;
