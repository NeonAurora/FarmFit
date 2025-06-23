// contexts/ThemeContext.tsx
import React, { createContext, useContext, ReactNode } from 'react';
import { useColorScheme } from '@/hooks/useColorScheme.native';
import { Colors, BrandColors, PostTypeColors, MoodColors } from '@/constants/Colors';

// Create a union type that accommodates both light and dark themes
type ThemeColors = typeof Colors.light | typeof Colors.dark;

interface ThemeContextType {
  colors: ThemeColors;
  brandColors: typeof BrandColors;
  postTypeColors: typeof PostTypeColors;
  moodColors: typeof MoodColors;
  isDark: boolean;
  colorScheme: 'light' | 'dark';
  toggleColorScheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const { colorScheme, isDark, toggleColorScheme } = useColorScheme();
  
  const value: ThemeContextType = {
    colors: Colors[colorScheme],
    brandColors: BrandColors,
    postTypeColors: PostTypeColors,
    moodColors: MoodColors,
    isDark,
    colorScheme,
    toggleColorScheme,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}