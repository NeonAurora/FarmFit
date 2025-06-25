// constants/Colors.ts
/**
 * Enhanced color system with comprehensive component support
 * Supports both light and dark modes with semantic color names
 */

const tintColorLight = '#0a7ea4';
const tintColorDark = '#0099e6';

// Gray shade system for dark theme (you can adjust grayTestNumber)
const grayTestNumber = 4; // Your preferred choice

const getGrayShade = (level: number) => {
  const shades = [
    '#000000', // 0 - Pure black
    '#0a0a0a', // 1 - Very dark
    '#151718', // 2 - Original
    '#1a1a1a', // 3 - Slightly lighter
    '#202020', // 4 - More noticeable (your preferred)
    '#2a2a2a', // 5 - Medium gray
    '#353535', // 6 - Lighter
    '#404040', // 7 - Light gray
    '#4a4a4a', // 8 - Even lighter
    '#555555', // 9 - Very light
    '#666666', // 10 - Lightest
  ] as const;
  return shades[Math.min(level, shades.length - 1)];
};

// Pre-calculate the gray shades to avoid function calls in the color object
const mainBackground = getGrayShade(grayTestNumber);
const secondaryBackground = getGrayShade(grayTestNumber + 1);
const tertiaryBackground = getGrayShade(grayTestNumber + 2);

// Brand colors (consistent across themes)
export const BrandColors = {
  primary: '#0a7ea4',
  primaryDark: '#087296',
  secondary: '#2E86DE',
  accent: '#ff6b6b',
  success: '#4caf50',
  warning: '#ff9800',
  error: '#f44336',
  info: '#2196f3',
  native: "#141218",
  admin: "#E74C3C",

  // Special colors for features
  debug: '#ff6b35',
  debugLight: 'rgba(255, 107, 53, 0.1)',
  debugBorder: 'rgba(255, 107, 53, 0.2)',
} as const;

// Post type colors (from your existing components)
export const PostTypeColors = {
  text: '#2196F3',
  image: '#4CAF50',
  video: '#FF5722',
  article: '#9C27B0',
  journal: '#FF9800',
  mixed: '#607D8B',
} as const;

// Mood colors (from your journal components)
export const MoodColors = {
  happy: '#4CAF50',
  worried: '#FF9800',
  proud: '#9C27B0',
  sad: '#2196F3',
  tired: '#607D8B',
} as const;

// Main color system
export const Colors = {
  light: {
    // Basic colors
    text: '#11181C',
    textSecondary: '#687076',
    textMuted: '#9BA1A6',
    textInverse: '#FFFFFF',
    
    // Background colors
    background: '#fff',
    backgroundSecondary: '#f8f9fa',
    backgroundTertiary: '#e9ecef',
    
    // Surface colors
    surface: '#fff',
    surfaceSecondary: '#f5f5f5',
    surfaceElevated: '#fff',
    
    // Interactive colors
    tint: tintColorLight,
    link: tintColorLight,
    primary: BrandColors.primary,
    secondary: BrandColors.secondary,
    accent: BrandColors.accent,
    
    // Border colors
    border: '#e1e4e8',
    borderSecondary: '#d0d7de',
    borderLight: '#f0f0f0',
    
    // Component-specific colors
    card: {
      background: '#fff',
      border: '#e1e4e8',
      shadow: 'rgba(0,0,0,0.1)',
    },
    
    button: {
      primary: BrandColors.primary,
      primaryText: '#fff',
      secondary: '#f8f9fa',
      secondaryText: '#687076',
      disabled: '#e9ecef',
      disabledText: '#9BA1A6',
    },
    
    input: {
      background: '#fff',
      border: '#e1e4e8',
      borderFocused: BrandColors.primary,
      placeholder: '#9BA1A6',
      text: '#11181C',
    },
    
    chip: {
      background: '#f8f9fa',
      text: '#687076',
      border: '#e1e4e8',
      selected: BrandColors.primary + '20',
      selectedText: BrandColors.primary,
    },
    
    badge: {
      background: BrandColors.error,
      text: '#fff',
      success: BrandColors.success,
      warning: BrandColors.warning,
      info: BrandColors.info,
    },
    
    avatar: {
      background: '#e0e0e0',
      text: '#666',
      border: '#e1e4e8',
    },
    
    fab: {
      background: BrandColors.primary,
      text: '#fff',
      shadow: 'rgba(10,126,164,0.3)',
    },
    
    progressBar: {
      background: '#e9ecef',
      fill: BrandColors.primary,
      success: BrandColors.success,
      warning: BrandColors.warning,
      error: BrandColors.error,
    },
    
    activityIndicator: {
      primary: BrandColors.primary,
      secondary: '#9BA1A6',
    },
    
    list: {
      background: '#fff',
      itemBackground: '#fff',
      itemBorder: '#f0f0f0',
      headerText: '#687076',
    },
    
    navigation: {
      headerBackground: '#fff',
      headerText: '#11181C',
      tabBackground: '#fff',
      tabIconDefault: '#687076',
      tabIconSelected: tintColorLight,
      drawerBackground: '#fff',
      drawerText: '#11181C',
    },
    
    // Status colors
    success: BrandColors.success,
    warning: BrandColors.warning,
    error: BrandColors.error,
    info: BrandColors.info,
    
    // Legacy compatibility
    icon: '#687076',
    tabIconDefault: '#687076',
    tabIconSelected: tintColorLight,
  },
  
  dark: {
    // Basic colors
    text: '#ECEDEE',
    textSecondary: '#9BA1A6',
    textMuted: '#6E7681',
    textInverse: '#11181C',
    
    // Background colors
    background: mainBackground,
    backgroundSecondary: secondaryBackground,
    backgroundTertiary: tertiaryBackground,
    
    // Surface colors
    surface: secondaryBackground,
    surfaceSecondary: mainBackground,
    surfaceElevated: tertiaryBackground,
    
    // Interactive colors
    tint: tintColorDark,
    link: '#58a6ff',
    primary: BrandColors.primary,
    secondary: BrandColors.secondary,
    accent: BrandColors.accent,
    
    // Border colors
    border: '#747474',
    borderSecondary: '#21262d',
    borderLight: '#404040',
    
    // Component-specific colors
    card: {
      background: secondaryBackground,
      border: '#404040',
      shadow: 'rgba(0,0,0,0.3)',
    },
    
    button: {
      primary: BrandColors.primary,
      primaryText: '#fff',
      secondary: tertiaryBackground,
      secondaryText: '#9BA1A6',
      disabled: secondaryBackground,
      disabledText: '#6E7681',
    },
    
    input: {
      background: secondaryBackground,
      border: '#404040',
      borderFocused: tintColorDark,
      placeholder: '#6E7681',
      text: '#ECEDEE',
    },
    
    chip: {
      background: tertiaryBackground,
      text: '#9BA1A6',
      border: '#404040',
      selected: tintColorDark + '30',
      selectedText: tintColorDark,
    },
    
    badge: {
      background: '#f85149',
      text: '#fff',
      success: '#3fb950',
      warning: '#d29922',
      info: '#58a6ff',
    },
    
    avatar: {
      background: '#444',
      text: '#fff',
      border: '#555',
    },
    
    fab: {
      background: tintColorDark,
      text: '#000',
      shadow: 'rgba(0,153,230,0.3)',
    },
    
    progressBar: {
      background: secondaryBackground,
      fill: tintColorDark,
      success: '#3fb950',
      warning: '#d29922',
      error: '#f85149',
    },
    
    activityIndicator: {
      primary: tintColorDark,
      secondary: '#6E7681',
    },
    
    list: {
      background: mainBackground,
      itemBackground: secondaryBackground,
      itemBorder: '#404040',
      headerText: '#9BA1A6',
    },
    
    navigation: {
      headerBackground: mainBackground,
      headerText: '#ECEDEE',
      tabBackground: mainBackground,
      tabIconDefault: '#9BA1A6',
      tabIconSelected: tintColorDark,
      drawerBackground: mainBackground,
      drawerText: '#ECEDEE',
    },
    
    // Status colors
    success: '#3fb950',
    warning: '#d29922',
    error: '#f85149',
    info: '#58a6ff',
    
    // Legacy compatibility
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: tintColorDark,
  },
} as const;

// Type definitions
export type ColorTheme = keyof typeof Colors;
export type ColorName = keyof typeof Colors.light;

// Helper functions
export const getPostTypeColor = (postType: keyof typeof PostTypeColors) => {
  return PostTypeColors[postType] || PostTypeColors.text;
};

export const getMoodColor = (mood: keyof typeof MoodColors) => {
  return MoodColors[mood] || MoodColors.happy;
};

// Default export
export default Colors;