// constants/Colors.ts
const tintColorLight = '#0a7ea4';
const tintColorDark = '#fff';

// Test different grays by changing this number (1-10):
const grayTestNumber = 4; // Change this number to test different shades

const getGrayShade = (level: number): string => {
  const shades = [
    '#000000', // 0 - Pure black
    '#0a0a0a', // 1 - Very dark
    '#151718', // 2 - Your current (very close to black)
    '#1a1a1a', // 3 - Slightly lighter
    '#202020', // 4 - More noticeable
    '#2a2a2a', // 5 - Medium gray (recommended starting point)
    '#353535', // 6 - Lighter
    '#404040', // 7 - Light gray
    '#4a4a4a', // 8 - Even lighter
    '#555555', // 9 - Very light
    '#666666', // 10 - Lightest (might be too light)
  ];
  return shades[Math.min(level, shades.length - 1)];
};

export const Colors = {
  light: {
    text: '#11181C',
    background: '#fff',
    tint: tintColorLight,
    icon: '#687076',
    tabIconDefault: '#687076',
    tabIconSelected: tintColorLight,
  },
  dark: {
    text: '#ECEDEE',
    background: getGrayShade(grayTestNumber), // Just change the number above!
    tint: tintColorDark,
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: tintColorDark,
  },
};