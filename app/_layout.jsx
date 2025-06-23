// app/_layout.jsx
import React, { useEffect } from 'react';
import { Slot } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts } from 'expo-font';
import { DefaultTheme as NavigationDefaultTheme, DarkTheme as NavigationDarkTheme } from '@react-navigation/native';
import { MD3LightTheme, MD3DarkTheme, Provider as PaperProvider } from 'react-native-paper';
import { AuthProvider } from '@/contexts/AuthContext';
import { ThemeProvider } from '@/contexts/ThemeContext'; // ✅ Add this
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors, BrandColors } from '@/constants/Colors';

SplashScreen.preventAutoHideAsync();

// Create themes using your colors
const CombinedLightTheme = {
  ...NavigationDefaultTheme,
  ...MD3LightTheme,
  colors: {
    ...NavigationDefaultTheme.colors,
    ...MD3LightTheme.colors,
    primary: BrandColors.primary,
    background: Colors.light.background,
    text: Colors.light.text,
    surface: Colors.light.surface,
    card: Colors.light.card.background,
    border: Colors.light.border,
  },
};

const CombinedDarkTheme = {
  ...NavigationDarkTheme,
  ...MD3DarkTheme,
  colors: {
    ...NavigationDarkTheme.colors,
    ...MD3DarkTheme.colors,
    primary: BrandColors.primary,
    background: Colors.dark.background,
    text: Colors.dark.text,
    surface: Colors.dark.surface,
    card: Colors.dark.card.background,
    border: Colors.dark.border,
  },
};

export default function RootLayout() {
  const { colorScheme } = useColorScheme();
  const theme = colorScheme === 'dark' ? CombinedDarkTheme : CombinedLightTheme;

  const [fontsLoaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <AuthProvider>
      <ThemeProvider>
        <PaperProvider theme={theme}>
          <Slot />
        </PaperProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}