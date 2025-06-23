// hooks/useThemeColor.ts
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme.native';

export function useThemeColor(
  props: { light?: string; dark?: string },
  colorName: keyof typeof Colors.light | string
) {
  const { colorScheme } = useColorScheme();
  const colorFromProps = props[colorScheme];

  if (colorFromProps) {
    return colorFromProps;
  }

  // Handle nested color objects (e.g., 'card.background')
  if (colorName.includes('.')) {
    const keys = colorName.split('.');
    let colorValue: any = Colors[colorScheme];
    
    for (const key of keys) {
      colorValue = colorValue?.[key];
    }
    
    return colorValue || Colors[colorScheme].text;
  }

  return (Colors[colorScheme] as any)[colorName] || Colors[colorScheme].text;
}

// New specialized hooks for component colors
export function useCardColors() {
  const { colorScheme } = useColorScheme();
  return Colors[colorScheme].card;
}

export function useButtonColors() {
  const { colorScheme } = useColorScheme();
  return Colors[colorScheme].button;
}

export function useInputColors() {
  const { colorScheme } = useColorScheme();
  return Colors[colorScheme].input;
}

export function useNavigationColors() {
  const { colorScheme } = useColorScheme();
  return Colors[colorScheme].navigation;
}

export function useChipColors() {
  const { colorScheme } = useColorScheme();
  return Colors[colorScheme].chip;
}

export function useBadgeColors() {
  const { colorScheme } = useColorScheme();
  return Colors[colorScheme].badge;
}

export function useAvatarColors() {
  const { colorScheme } = useColorScheme();
  return Colors[colorScheme].avatar;
}

export function useFabColors() {
  const { colorScheme } = useColorScheme();
  return Colors[colorScheme].fab;
}

export function useProgressBarColors() {
  const { colorScheme } = useColorScheme();
  return Colors[colorScheme].progressBar;
}

export function useActivityIndicatorColors() {
  const { colorScheme } = useColorScheme();
  return Colors[colorScheme].activityIndicator;
}

export function useListColors() {
  const { colorScheme } = useColorScheme();
  return Colors[colorScheme].list;
}