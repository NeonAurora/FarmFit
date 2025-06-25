// app/(main)/(screens)/(utils)/_layout.jsx
import { Stack, useRouter } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import { BrandColors } from '@/constants/Colors';
import { IconButton } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { useEffect, useState } from 'react';

function CustomHeaderLeft() {
  const router = useRouter();
  const navigation = useNavigation();
  const { colors } = useTheme();
  const [canGoBack, setCanGoBack] = useState(false);

  useEffect(() => {
    // Check if we can go back in the current stack
    const checkCanGoBack = () => {
      setCanGoBack(router.canGoBack());
    };
    
    checkCanGoBack();
    
    // Listen for navigation state changes
    const unsubscribe = navigation.addListener('state', checkCanGoBack);
    return unsubscribe;
  }, [navigation, router]);

  const handleBackPress = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      // Go back to main/home screen when no stack history
      router.replace('/(main)');
    }
  };

  // Always show back button for better UX
  return (
    <IconButton
      icon="arrow-left"
      size={24}
      iconColor={colors.text}
      onPress={handleBackPress}
      style={{ marginLeft: 0 }}
    />
  );
}

export default function PractitionerLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: BrandColors.success, // Green theme for practitioner features
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
        headerLeft: () => <CustomHeaderLeft />,
      }}
    >
      {/* Profile Creation & Management */}
      <Stack.Screen 
        name="userRatingHistoryScreen" 
        options={{ 
          title: 'Rating History',
          headerShown: true,
          presentation: 'modal'
        }} 
      />
    </Stack>
  );
}