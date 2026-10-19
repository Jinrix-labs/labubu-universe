import { TextStyle } from 'react-native';

export const typography = {
  hero: {
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: -0.4,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  subtitle: {
    fontSize: 17,
    fontWeight: '600',
  },
  body: {
    fontSize: 15,
    fontWeight: '400',
  },
  bodyStrong: {
    fontSize: 15,
    fontWeight: '600',
  },
  caption: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
  },
} as const satisfies Record<string, TextStyle>;
