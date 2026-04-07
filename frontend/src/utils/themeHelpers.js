import {
  BROWN,
  DARK_ACCENT,
  DARK_BG,
  DARK_NOTE,
  PAPER_BEIGE,
  TERRACOTTA,
  WARM_BG,
} from '../constants/colors';

export const getThemeColors = (theme) => {
  if (theme === 'dark') {
    return {
      background: DARK_BG,
      card: DARK_NOTE,
      text: PAPER_BEIGE,
      mutedText: 'rgba(239,228,216,0.7)',
      accent: DARK_ACCENT,
      accentText: PAPER_BEIGE,
      shadow: BROWN,
    };
  }
  return {
    background: WARM_BG,
    card: PAPER_BEIGE,
    text: BROWN,
    mutedText: 'rgba(139,94,60,0.7)',
    accent: TERRACOTTA,
    accentText: PAPER_BEIGE,
    shadow: BROWN,
  };
};
