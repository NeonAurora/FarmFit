// components/themes/ThemedCard.tsx
import React from 'react';
import { Card } from 'react-native-paper';
import { useCardColors } from '@/hooks/useThemeColor';
import { ViewStyle } from 'react-native';

export interface ThemedCardProps {
  style?: ViewStyle | ViewStyle[];
  variant?: 'elevated' | 'outlined' | 'flat';
  children: React.ReactNode;
  elevation?: 0 | 1 | 2 | 3 | 4 | 5;
  onPress?: () => void;
  disabled?: boolean;
  accessibilityLabel?: string;
  testID?: string;
}

export function ThemedCard({ 
  style, 
  variant = 'elevated', 
  children, 
  elevation = 2,
  onPress,
  disabled,
  accessibilityLabel,
  testID,
}: ThemedCardProps) {
  const cardColors = useCardColors();
  
  const cardStyle: ViewStyle = {
    backgroundColor: cardColors.background,
    borderColor: variant === 'outlined' ? cardColors.border : 'transparent',
    borderWidth: variant === 'outlined' ? 1 : 0,
  };

  const commonProps = {
    style: [cardStyle, style],
    onPress,
    disabled,
    accessibilityLabel,
    testID,
  };

  // Use explicit switch with literal values to avoid type issues
  switch (variant) {
    case 'elevated':
      return (
        <Card 
          mode="elevated"
          elevation={elevation}
          {...commonProps}
        >
          {children}
        </Card>
      );
      
    case 'outlined':
      return (
        <Card 
          mode="outlined"
          {...commonProps}
        >
          {children}
        </Card>
      );
      
    case 'flat':
      return (
        <Card 
          mode="contained"
          {...commonProps}
        >
          {children}
        </Card>
      );
      
    default:
      return (
        <Card 
          mode="elevated"
          elevation={2}
          {...commonProps}
        >
          {children}
        </Card>
      );
  }
}