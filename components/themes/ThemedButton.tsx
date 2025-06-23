// components/themes/ThemedButton.tsx
import React from 'react';
import { Button } from 'react-native-paper';
import { useButtonColors } from '@/hooks/useThemeColor';
import { ViewStyle, TextStyle } from 'react-native';

export interface ThemedButtonProps {
  variant?: 'primary' | 'secondary' | 'outlined';
  style?: ViewStyle | ViewStyle[];
  labelStyle?: TextStyle | TextStyle[];
  children: React.ReactNode;
  onPress?: () => void;
  disabled?: boolean;
  loading?: boolean;
  icon?: string;
  mode?: 'text' | 'outlined' | 'contained' | 'elevated' | 'contained-tonal';
  compact?: boolean;
  uppercase?: boolean;
  accessibilityLabel?: string;
  testID?: string;
}

export function ThemedButton({ 
  variant = 'primary', 
  style, 
  labelStyle,
  mode,
  children,
  ...props 
}: ThemedButtonProps) {
  const buttonColors = useButtonColors();
  
  const getButtonStyle = (): ViewStyle => {
    switch (variant) {
      case 'primary':
        return {
          backgroundColor: buttonColors.primary,
        };
      case 'secondary':
        return {
          backgroundColor: buttonColors.secondary,
        };
      case 'outlined':
        return {
          backgroundColor: 'transparent',
          borderColor: buttonColors.primary,
        };
      default:
        return {};
    }
  };
  
  const getLabelStyle = (): TextStyle => {
    switch (variant) {
      case 'primary':
        return { color: buttonColors.primaryText };
      case 'secondary':
        return { color: buttonColors.secondaryText };
      case 'outlined':
        return { color: buttonColors.primary };
      default:
        return {};
    }
  };

  const getButtonMode = () => {
    if (mode) return mode;
    
    switch (variant) {
      case 'primary':
        return 'contained';
      case 'secondary':
        return 'contained-tonal';
      case 'outlined':
        return 'outlined';
      default:
        return 'contained';
    }
  };

  return (
    <Button 
      mode={getButtonMode()}
      style={[getButtonStyle(), style]}
      labelStyle={[getLabelStyle(), labelStyle]}
      {...props}
    >
      {children}
    </Button>
  );
}