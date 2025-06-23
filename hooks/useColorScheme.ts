// hooks/useColorScheme.ts
import { useEffect, useState, useCallback } from 'react';
import { useColorScheme as useRNColorScheme } from 'react-native';
import { Platform } from 'react-native';

export type ColorScheme = 'light' | 'dark';

interface UseColorSchemeReturn {
  colorScheme: ColorScheme;
  isDark: boolean;
  isLight: boolean;
  toggleColorScheme: () => void;
  setColorScheme: (scheme: ColorScheme) => void;
}

// Web-specific color scheme detection
const getWebColorScheme = (): ColorScheme => {
  if (typeof window === 'undefined') return 'light';
  
  // Check if user has set a preference in localStorage
  const saved = localStorage.getItem('color-scheme');
  if (saved === 'light' || saved === 'dark') {
    return saved as ColorScheme;
  }
  
  // Check system preference
  if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return 'dark';
  }
  
  return 'light';
};

// Set web color scheme
const setWebColorScheme = (scheme: ColorScheme) => {
  if (typeof window === 'undefined') return;
  
  localStorage.setItem('color-scheme', scheme);
  
  // Update document class for CSS
  document.documentElement.classList.remove('light', 'dark');
  document.documentElement.classList.add(scheme);
  
  // Update CSS custom properties
  document.documentElement.style.setProperty('--color-scheme', scheme);
  
  // Update meta theme-color for mobile browsers
  let metaThemeColor = document.querySelector('meta[name="theme-color"]');
  if (!metaThemeColor) {
    metaThemeColor = document.createElement('meta');
    metaThemeColor.setAttribute('name', 'theme-color');
    document.head.appendChild(metaThemeColor);
  }
  metaThemeColor.setAttribute('content', scheme === 'dark' ? '#151718' : '#ffffff');
};

export function useColorScheme(): UseColorSchemeReturn {
  const rnColorScheme = useRNColorScheme();
  const [hasHydrated, setHasHydrated] = useState(Platform.OS !== 'web');
  const [manualScheme, setManualScheme] = useState<ColorScheme | null>(null);
  const [webColorScheme, setWebColorSchemeState] = useState<ColorScheme>('light');

  // Web hydration effect
  useEffect(() => {
    if (Platform.OS === 'web' && !hasHydrated) {
      const webScheme = getWebColorScheme();
      setWebColorSchemeState(webScheme);
      setWebColorScheme(webScheme);
      
      // If it's different from system preference, set as manual override
      if (typeof window !== 'undefined') {
        const systemScheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        if (webScheme !== systemScheme) {
          setManualScheme(webScheme);
        }
      }
      
      setHasHydrated(true);
    }
  }, [hasHydrated]);

  // Listen for system color scheme changes on web
  useEffect(() => {
    if (Platform.OS === 'web' && hasHydrated && !manualScheme) {
      if (typeof window === 'undefined') return;
      
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      
      const handleChange = (e: MediaQueryListEvent) => {
        const newScheme = e.matches ? 'dark' : 'light';
        setWebColorSchemeState(newScheme);
        setWebColorScheme(newScheme);
      };
      
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, [hasHydrated, manualScheme]);

  // Determine current color scheme
  const getCurrentScheme = useCallback((): ColorScheme => {
    if (!hasHydrated) return 'light'; // Safe default during hydration
    
    if (Platform.OS === 'web') {
      return manualScheme || webColorScheme;
    } else {
      // For native platforms, use React Native's useColorScheme
      return (rnColorScheme as ColorScheme) || 'light';
    }
  }, [hasHydrated, manualScheme, webColorScheme, rnColorScheme]);

  const colorScheme = getCurrentScheme();
  const isDark = colorScheme === 'dark';
  const isLight = colorScheme === 'light';

  // Main function to update color scheme
  const updateColorScheme = useCallback((scheme: ColorScheme) => {
    if (Platform.OS === 'web') {
      setWebColorScheme(scheme);
      setWebColorSchemeState(scheme);
      setManualScheme(scheme);
    } else {
      // On native platforms, we can't actually change the system scheme
      // but we can store the preference for app-specific theming
      setManualScheme(scheme);
    }
  }, []);

  // Toggle function
  const toggleColorScheme = useCallback(() => {
    const newScheme: ColorScheme = colorScheme === 'dark' ? 'light' : 'dark';
    updateColorScheme(newScheme);
  }, [colorScheme, updateColorScheme]);

  return {
    colorScheme,
    isDark,
    isLight,
    toggleColorScheme,
    setColorScheme: updateColorScheme,
  };
}

// Legacy export for backward compatibility - now returns just the string
export const useColorSchemeString = (): ColorScheme => {
  const { colorScheme } = useColorScheme();
  return colorScheme;
};