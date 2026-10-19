export type ColorScheme = 'light' | 'dark';

export const palette = {
  blush: '#FF8FAB',
  peach: '#FFB4A2',
  mint: '#9EDFC3',
  cream: '#FFF5F7',
  ink: '#2B1F24',
  fog: '#F3E6EA',
  gold: '#E6B84A',
  rareBlue: '#5B8DEF',
  limitedPurple: '#9B6BFF',
  secretGold: '#D4A017',
  ultraPink: '#FF6FAE',
  ultraCoral: '#FF9F6B',
} as const;

export const colors = {
  light: {
    background: palette.cream,
    surface: '#FFFFFF',
    surfaceMuted: palette.fog,
    text: palette.ink,
    textMuted: '#7A6670',
    border: '#F0D9E0',
    primary: palette.blush,
    primaryText: '#FFFFFF',
    accent: palette.mint,
    danger: '#E85D75',
    overlay: 'rgba(43, 31, 36, 0.08)',
    tabBar: '#FFFFFF',
    tabInactive: '#A8929C',
    success: '#3CB371',
  },
  dark: {
    background: '#1A1418',
    surface: '#2A2126',
    surfaceMuted: '#342A30',
    text: '#F8EEF2',
    textMuted: '#B9A6AF',
    border: '#3E3238',
    primary: palette.blush,
    primaryText: '#1A1418',
    accent: palette.mint,
    danger: '#FF7A90',
    overlay: 'rgba(0, 0, 0, 0.35)',
    tabBar: '#221B1F',
    tabInactive: '#8E7A84',
    success: '#6FCF97',
  },
} as const;

export type ThemeColors = (typeof colors)[ColorScheme];

export const rarityColors = {
  regular: { bg: '#EDE6E9', text: '#6B5A62', darkBg: '#3A3337', darkText: '#D7CBD1' },
  rare: { bg: '#DCE8FF', text: palette.rareBlue, darkBg: '#243552', darkText: '#9CBCFF' },
  limited: {
    bg: '#EDE0FF',
    text: palette.limitedPurple,
    darkBg: '#332448',
    darkText: '#C9AFFF',
  },
  secret: { bg: '#FFF0C2', text: palette.secretGold, darkBg: '#3D3214', darkText: '#F0D078' },
  ultra_rare: {
    bg: '#FFE0EF',
    text: palette.ultraPink,
    darkBg: '#402030',
    darkText: '#FFB0D2',
  },
} as const;
