import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DarkColors, LightColors, type ThemeColors, Spacing, BorderRadius, FontSize, Shadows } from './theme';

type ThemeMode = 'dark' | 'light';

interface ThemeContextType {
  mode: ThemeMode;
  colors: ThemeColors;
  spacing: typeof Spacing;
  borderRadius: typeof BorderRadius;
  fontSize: typeof FontSize;
  shadows: typeof Shadows;
  toggleTheme: () => void;
  setThemeMode: (mode: ThemeMode) => void;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType>({
  mode: 'dark',
  colors: DarkColors,
  spacing: Spacing,
  borderRadius: BorderRadius,
  fontSize: FontSize,
  shadows: Shadows,
  toggleTheme: () => {},
  setThemeMode: () => {},
  isDark: true,
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<ThemeMode>('dark');

  useEffect(() => {
    loadTheme();
  }, []);

  const loadTheme = async () => {
    try {
      const saved = await AsyncStorage.getItem('app_theme');
      if (saved === 'light' || saved === 'dark') {
        setMode(saved);
      }
    } catch (e) {
      // Default to dark
    }
  };

  const toggleTheme = async () => {
    const newMode = mode === 'dark' ? 'light' : 'dark';
    setMode(newMode);
    try {
      await AsyncStorage.setItem('app_theme', newMode);
    } catch (e) {}
  };

  const setThemeMode = async (newMode: ThemeMode) => {
    setMode(newMode);
    try {
      await AsyncStorage.setItem('app_theme', newMode);
    } catch (e) {}
  };

  const colors = mode === 'dark' ? DarkColors : LightColors;

  return (
    <ThemeContext.Provider
      value={{
        mode,
        colors,
        spacing: Spacing,
        borderRadius: BorderRadius,
        fontSize: FontSize,
        shadows: Shadows,
        toggleTheme,
        setThemeMode,
        isDark: mode === 'dark',
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

export default ThemeContext;
