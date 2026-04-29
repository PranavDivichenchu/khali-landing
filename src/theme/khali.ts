import { Platform } from 'react-native';

export const khaliColors = {
  primary: '#cbbeff',
  secondary: '#c6c6c9',
  accent: '#ffb866',
  highlight: '#cbbeff',
  deep: '#131314',
  deepBlue: '#201f20',
  deepAlt: '#1c1b1c',
  surface: '#131314',
  surfaceStrong: '#353436',
  surfaceSoft: '#2a2a2b',
  panel: 'rgba(202, 195, 216, 0.05)',
  panelStrong: 'rgba(202, 195, 216, 0.1)',
  text: '#e5e2e3',
  textMuted: '#cac3d8',
  textDim: 'rgba(229, 226, 227, 0.48)',
  border: '#494455',
  borderStrong: '#948ea1',
  shadow: 'rgba(0, 0, 0, 0.8)',
  success: '#cbbeff',
  danger: '#ffb4ab',
  neutral: '#454749',
} as const;

export const khaliSpacing = {
  xxs: 4,
  xs: 8,
  s: 12,
  m: 16,
  l: 20,
  xl: 24,
  xxl: 32,
  xxxl: 48,
} as const;

export const khaliFonts = Platform.select({
  web: {
    regular: '"Manrope", sans-serif',
    medium: '"Manrope", sans-serif',
    semibold: '"Manrope", sans-serif',
    bold: '"Manrope", sans-serif',
    extrabold: '"Manrope", sans-serif',
    black: '"Manrope", sans-serif',
  },
  default: {
    regular: 'Manrope_400Regular',
    medium: 'Manrope_500Medium',
    semibold: 'Manrope_600SemiBold',
    bold: 'Manrope_700Bold',
    extrabold: 'Manrope_800ExtraBold',
    black: 'Manrope_800ExtraBold',
  },
})!;

export const khaliDisplayFonts = Platform.select({
  web: {
    regular: '"Newsreader", serif',
    bold: '"Newsreader", serif',
    black: '"Newsreader", serif',
  },
  default: {
    regular: 'Newsreader_400Regular',
    bold: 'Newsreader_700Bold',
    black: 'Newsreader_800ExtraBold',
  },
})!;

export const khaliTypography = {
  brand: {
    fontSize: 48,
    fontFamily: khaliDisplayFonts.black,
    fontWeight: '900' as const,
    letterSpacing: 1,
  },
  title: {
    fontSize: 32,
    fontFamily: khaliDisplayFonts.black,
    fontWeight: '900' as const,
    letterSpacing: -0.5,
  },
  header: {
    fontSize: 22,
    fontFamily: khaliFonts.bold,
    fontWeight: '700' as const,
  },
  body: {
    fontSize: 15,
    fontFamily: khaliFonts.regular,
    fontWeight: '400' as const,
  },
  caption: {
    fontSize: 13,
    fontFamily: khaliFonts.medium,
    fontWeight: '500' as const,
  },
  label: {
    fontSize: 12,
    fontFamily: khaliFonts.bold,
    fontWeight: '700' as const,
    letterSpacing: 0.6,
  },
} as const;

export function rgba(hex: string | undefined, alpha: number) {
  if (typeof hex !== 'string' || !hex) {
    return `rgba(255, 255, 255, ${alpha})`;
  }

  if (hex.startsWith('rgba(') || hex.startsWith('rgb(')) {
    const channels = hex.match(/[\d.]+/g)?.slice(0, 3) ?? [];
    const [red = '255', green = '255', blue = '255'] = channels;
    return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
  }

  if (!hex.startsWith('#')) {
    return hex;
  }

  const normalized = hex.replace('#', '');
  const value =
    normalized.length === 3
      ? normalized
          .split('')
          .map((char) => char + char)
          .join('')
      : normalized;
  const red = Number.parseInt(value.slice(0, 2), 16);
  const green = Number.parseInt(value.slice(2, 4), 16);
  const blue = Number.parseInt(value.slice(4, 6), 16);

  return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
}
