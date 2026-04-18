export const DarkColors = {
  background: '#0A0E27',
  surface: '#141832',
  card: '#1B1F3B',
  cardBorder: 'rgba(108, 92, 231, 0.2)',

  primary: '#6C5CE7',
  primaryLight: '#A29BFE',
  secondary: '#00D2FF',
  secondaryLight: '#74E6FF',
  accent: '#FF6B6B',
  accentLight: '#FFA3A3',

  success: '#00E676',
  successDark: '#00C853',
  warning: '#FFD93D',
  warningDark: '#FFC107',
  error: '#FF5252',
  info: '#448AFF',

  textPrimary: '#FFFFFF',
  textSecondary: '#8B8FA3',
  textMuted: '#5A5E72',
  textAccent: '#6C5CE7',

  gradient1Start: '#6C5CE7',
  gradient1End: '#00D2FF',
  gradient2Start: '#FF6B6B',
  gradient2End: '#FFD93D',
  gradient3Start: '#00E676',
  gradient3End: '#00D2FF',

  overlay: 'rgba(10, 14, 39, 0.85)',
  glass: 'rgba(27, 31, 59, 0.6)',
  glassBorder: 'rgba(108, 92, 231, 0.15)',
};

export const LightColors = {
  background: '#F5F7FA',
  surface: '#FFFFFF',
  card: '#FFFFFF',
  cardBorder: 'rgba(108, 92, 231, 0.12)',

  primary: '#6C5CE7',
  primaryLight: '#A29BFE',
  secondary: '#0099CC',
  secondaryLight: '#33BBDD',
  accent: '#FF5252',
  accentLight: '#FF8A80',

  success: '#00C853',
  successDark: '#00A843',
  warning: '#FFB300',
  warningDark: '#FF8F00',
  error: '#FF5252',
  info: '#2979FF',

  textPrimary: '#1A1D2E',
  textSecondary: '#6B7082',
  textMuted: '#9DA3B4',
  textAccent: '#6C5CE7',

  gradient1Start: '#6C5CE7',
  gradient1End: '#00D2FF',
  gradient2Start: '#FF6B6B',
  gradient2End: '#FFD93D',
  gradient3Start: '#00E676',
  gradient3End: '#00D2FF',

  overlay: 'rgba(0, 0, 0, 0.5)',
  glass: 'rgba(255, 255, 255, 0.7)',
  glassBorder: 'rgba(108, 92, 231, 0.1)',
};

// Default export for backward compatibility
export const Colors = DarkColors;

export type ThemeColors = typeof DarkColors;

export const getThemeColors = (mode: 'dark' | 'light'): ThemeColors =>
  mode === 'dark' ? DarkColors : LightColors;

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const BorderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 999,
};

export const FontSize = {
  xs: 10,
  sm: 12,
  md: 14,
  lg: 16,
  xl: 18,
  xxl: 22,
  title: 28,
  hero: 36,
};

export const Shadows = {
  glow: {
    shadowColor: '#6C5CE7',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 8,
  },
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  soft: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
};
