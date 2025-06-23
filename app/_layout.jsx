// app/_layout.jsx
import React, { useEffect } from 'react';
import { Slot } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts } from 'expo-font';
import { DefaultTheme as NavigationDefaultTheme, DarkTheme as NavigationDarkTheme } from '@react-navigation/native';
import { MD3LightTheme, MD3DarkTheme, Provider as PaperProvider } from 'react-native-paper';
import { AuthProvider } from '@/contexts/AuthContext';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors'; // Import your Colors

// Prevent splash screen from auto-hiding until assets are ready
SplashScreen.preventAutoHideAsync();

// Create CUSTOM combined themes using YOUR colors
const CombinedLightTheme = {
  ...NavigationDefaultTheme,
  ...MD3LightTheme,
  colors: {
    ...NavigationDefaultTheme.colors,
    ...MD3LightTheme.colors,
    background: Colors.light.background, // Use your custom color
    text: Colors.light.text,
  },
};

const CombinedDarkTheme = {
  ...NavigationDarkTheme,
  ...MD3DarkTheme,
  colors: {
    ...NavigationDarkTheme.colors,
    ...MD3DarkTheme.colors,
    background: Colors.dark.background, // Use your custom grey (#151718)
    text: Colors.dark.text,
    surface: Colors.dark.background, // Paper components background
    surfaceVariant: Colors.dark.background, // Alternative surfaces
  },
};

export default function RootLayout() {
  const { colorScheme } = useColorScheme(); // Use destructured version
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
      <PaperProvider theme={theme}>
        <Slot />
      </PaperProvider>
    </AuthProvider>
  );
}