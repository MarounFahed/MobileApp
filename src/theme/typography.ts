import { TextStyle } from 'react-native';

export const typography = {
  display: {
    fontSize: 36,
    fontWeight: '700',
    letterSpacing: 0.5,
  } satisfies TextStyle,
  h1: {
    fontSize: 28,
    fontWeight: '700',
  } satisfies TextStyle,
  h2: {
    fontSize: 22,
    fontWeight: '600',
  } satisfies TextStyle,
  h3: {
    fontSize: 18,
    fontWeight: '600',
  } satisfies TextStyle,
  body: {
    fontSize: 16,
    fontWeight: '400',
  } satisfies TextStyle,
  bodyBold: {
    fontSize: 16,
    fontWeight: '600',
  } satisfies TextStyle,
  caption: {
    fontSize: 13,
    fontWeight: '400',
  } satisfies TextStyle,
  micro: {
    fontSize: 11,
    fontWeight: '500',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  } satisfies TextStyle,
};

export const spacing = {
  xs: 4,
  s: 8,
  m: 16,
  l: 24,
  xl: 32,
  xxl: 48,
};

export const radius = {
  s: 6,
  m: 12,
  l: 20,
  pill: 999,
};
