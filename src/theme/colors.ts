export const colors = {
  // Backgrounds
  bg: '#0A0E1A',
  bgElevated: '#141927',
  bgCard: '#1A2033',
  bgOverlay: 'rgba(10, 14, 26, 0.92)',

  // Text
  text: '#F4EFE6',
  textMuted: '#8A92A6',
  textInverse: '#0A0E1A',

  // Accents
  cedar: '#2E7D4F', // town/police/safe
  cedarDim: '#1F5436',
  mafia: '#C43E3E', // mafia/elimination/danger
  mafiaDim: '#7B2727',

  // States
  success: '#2E7D4F',
  warning: '#C49E3E',
  danger: '#C43E3E',

  // Misc
  border: '#2A3148',
  divider: '#1F2538',
  black: '#000000',
  transparent: 'transparent',
};

export type ColorKey = keyof typeof colors;
