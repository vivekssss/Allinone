import { Spacing, BorderRadius, FontSize, DarkColors, LightColors } from './theme';

export const AuraTheme = {
  dark: {
    ...DarkColors,
    background: '#070A1A',
    surface: '#0E122A',
    card: '#161B3D',
    primary: '#7C4DFF', // Deeper, more vibrant purple
    secondary: '#00E5FF', // Cyan highlights
    accent: '#FF3D71', // Vibrant rose
    glass: 'rgba(22, 27, 61, 0.7)',
    glassBorder: 'rgba(124, 77, 255, 0.2)',
    success: '#00E676',
    warning: '#FFD600',
    error: '#FF1744',
  },
  light: {
    ...LightColors,
    background: '#FBFCFF',
    primary: '#7C4DFF',
    secondary: '#00B8D4',
  }
};

export const AuraStyles = {
  glass: {
    backgroundColor: AuraTheme.dark.glass,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: AuraTheme.dark.glassBorder,
    backdropFilter: 'blur(20px)', // For web, RN uses expo-blur
  },
  neonShadow: (color: string) => ({
    shadowColor: color,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 15,
    elevation: 10,
  }),
  gradientText: {
    fontWeight: '800',
    fontSize: FontSize.title,
    letterSpacing: -0.5,
  }
};

export default AuraTheme;
