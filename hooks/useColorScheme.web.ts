// hooks/useColorScheme.web.ts
import { useEffect, useState, useCallback } from 'react';

export type ColorScheme = 'light' | 'dark';

interface UseColorSchemeReturn {
  colorScheme: ColorScheme;
  isDark: boolean;
  isLight: boolean;
  toggleColorScheme: () => void;
  setColorScheme: (scheme: ColorScheme) => void;
}

export function useColorScheme(): UseColorSchemeReturn {
  const [hasHydrated, setHasHydrated] = useState(false);
  const [webColorScheme, setWebColorScheme] = useState<ColorScheme>('light');
  const [manualOverride, setManualOverride] = useState<ColorScheme | null>(null);

  // Hydration effect - runs only on client side
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Get stored preference
      const stored = localStorage.getItem('color-scheme') as ColorScheme | null;
      
      if (stored === 'light' || stored === 'dark') {
        setWebColorScheme(stored);
        setManualOverride(stored);
      } else {
        // Use system preference
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        setWebColorScheme(prefersDark ? 'dark' : 'light');
      }
      
      setHasHydrated(true);
    }
  }, []);

  // Listen for system changes after hydration
  useEffect(() => {
    if (!hasHydrated || typeof window === 'undefined' || manualOverride) return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleSystemChange = (e: MediaQueryListEvent) => {
      if (!manualOverride) {
        setWebColorScheme(e.matches ? 'dark' : 'light');
      }
    };

    mediaQuery.addEventListener('change', handleSystemChange);
    return () => mediaQuery.removeEventListener('change', handleSystemChange);
  }, [hasHydrated, manualOverride]);

  // Apply color scheme to document
  useEffect(() => {
    if (hasHydrated && typeof window !== 'undefined') {
      // Remove previous theme classes
      document.documentElement.classList.remove('light', 'dark');
      document.documentElement.classList.add(webColorScheme);
      
      // Force body and html background colors to match your theme
      const backgroundColor = webColorScheme === 'dark' ? '#151718' : '#ffffff';
      document.body.style.backgroundColor = backgroundColor;
      document.documentElement.style.backgroundColor = backgroundColor;
      
      // Set CSS custom properties
      document.documentElement.style.setProperty('--color-scheme', webColorScheme);
      document.documentElement.style.setProperty('--background-color', backgroundColor);
      document.documentElement.style.setProperty('--text-color', webColorScheme === 'dark' ? '#ECEDEE' : '#11181C');
      
      // Update meta theme-color for mobile browsers
      let metaThemeColor = document.querySelector('meta[name="theme-color"]');
      if (!metaThemeColor) {
        metaThemeColor = document.createElement('meta');
        metaThemeColor.setAttribute('name', 'theme-color');
        document.head.appendChild(metaThemeColor);
      }
      metaThemeColor.setAttribute('content', backgroundColor);
      
      // Trigger a storage event to notify other tabs (if any)
      window.dispatchEvent(new StorageEvent('storage', {
        key: 'color-scheme',
        newValue: webColorScheme,
        url: window.location.href
      }));
    }
  }, [webColorScheme, hasHydrated]);

  // Function to manually set color scheme
  const updateColorScheme = useCallback((scheme: ColorScheme) => {
    if (typeof window === 'undefined') return;
    
    localStorage.setItem('color-scheme', scheme);
    setWebColorScheme(scheme);
    setManualOverride(scheme);
  }, []);

  // Toggle function
  const toggleColorScheme = useCallback(() => {
    const newScheme: ColorScheme = webColorScheme === 'dark' ? 'light' : 'dark';
    updateColorScheme(newScheme);
  }, [webColorScheme, updateColorScheme]);

  const colorScheme = hasHydrated ? webColorScheme : 'light';
  const isDark = colorScheme === 'dark';
  const isLight = colorScheme === 'light';

  return {
    colorScheme,
    isDark,
    isLight,
    toggleColorScheme,
    setColorScheme: updateColorScheme,
  };
}

// Helper function to set color scheme on web
export const setWebColorScheme = (scheme: ColorScheme): void => {
  if (typeof window === 'undefined') return;
  
  localStorage.setItem('color-scheme', scheme);
  
  // Trigger a storage event to notify other tabs
  window.dispatchEvent(new StorageEvent('storage', {
    key: 'color-scheme',
    newValue: scheme,
    url: window.location.href
  }));
};

// Helper to get initial color scheme for SSR
export const getInitialColorScheme = (): ColorScheme => {
  if (typeof window === 'undefined') return 'light';
  
  const stored = localStorage.getItem('color-scheme');
  if (stored === 'light' || stored === 'dark') return stored;
  
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};