// app/(main)/profile.jsx
import React, { useState, useRef } from 'react';
import { 
  StyleSheet, 
  Image, 
  ActivityIndicator, 
  Alert, 
  ScrollView, 
  Pressable,
  Animated,
  Vibration
} from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useUserData } from '@/hooks/useUserData'; 
import { ThemedView } from '@/components/themes/ThemedView';
import { ThemedText } from '@/components/themes/ThemedText';
import { ThemedButton } from '@/components/themes/ThemedButton';
import { ThemedCard } from '@/components/themes/ThemedCard';
import { useTheme } from '@/contexts/ThemeContext';
import { useActivityIndicatorColors } from '@/hooks/useThemeColor';
import { useRouter } from 'expo-router';
import { Colors, BrandColors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import * as Crypto from 'expo-crypto';

export default function ProfileScreen() {
  const { user, signOut, loading: authLoading, testTokenRefresh } = useAuth();
  const { userData, loading: dataLoading, error } = useUserData();
  const { colors, isDark } = useTheme();
  const activityIndicatorColors = useActivityIndicatorColors();
  const colorScheme = useColorScheme();
  const router = useRouter();

  const loading = authLoading || dataLoading;

  // Debug tools state and animation
  const [showDebugTools, setShowDebugTools] = useState(false);
  const [isLongPressing, setIsLongPressing] = useState(false);
  const slideAnimation = useRef(new Animated.Value(0)).current;
  const longPressTimer = useRef(null);
  const progressAnimation = useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    if (!loading && !user) {
      router.replace('/');
    }
  }, [loading, user]);

  const handleSignOut = async () => {
    try {
      await signOut();
      router.replace('/');
    } catch (error) {
      console.error("Error during sign out:", error);
    }
  };

  const handleEditProfile = () => {
    router.push({
      pathname: '/editUserSelfProfileScreen',
      params: { userId: userData?.id || 'current' }
    });
  };

  // Long press handlers for Edit Profile button
  const handleEditProfilePressIn = () => {
    setIsLongPressing(true);
    
    // Start progress animation
    Animated.timing(progressAnimation, {
      toValue: 1,
      duration: 5000,
      useNativeDriver: false,
    }).start();

    // Set timer for 5 seconds
    longPressTimer.current = setTimeout(() => {
      // Vibrate to indicate success
      Vibration.vibrate([0, 100, 100, 100]);
      
      // Show debug tools with slide animation
      setShowDebugTools(true);
      Animated.spring(slideAnimation, {
        toValue: 1,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      }).start();

      console.log('🎉 Secret debug mode activated!');
    }, 5000);
  };

  const handleEditProfilePressOut = () => {
    setIsLongPressing(false);
    
    // Clear timer if not completed
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }

    // Reset progress animation
    Animated.timing(progressAnimation, {
      toValue: 0,
      duration: 200,
      useNativeDriver: false,
    }).start();

    // If it was a short press, do normal edit action
    if (!showDebugTools) {
      handleEditProfile();
    }
  };

  // Hide debug tools
  const hideDebugTools = () => {
    Animated.timing(slideAnimation, {
      toValue: 0,
      useNativeDriver: true,
      duration: 300,
    }).start(() => {
      setShowDebugTools(false);
    });
  };

  // Token refresh testing function
  const handleTestRefresh = async () => {
    try {
      Alert.alert('Testing Token Refresh', 'Check console for results...');
      await testTokenRefresh();
      Alert.alert('Test Complete', 'Check console logs for results');
    } catch (error) {
      Alert.alert('Test Failed', error.message);
    }
  };

  // Crypto testing function
  const testCrypto = async () => {
    try {
      console.log('=== TESTING CRYPTO FUNCTIONS ===');
      Alert.alert('Testing Crypto', 'Check console for detailed results...');
      
      const randomBytes = await Crypto.getRandomBytesAsync(16);
      console.log('🔢 Random bytes generated:', randomBytes);
      
      const hexString = Array.from(randomBytes)
        .map(byte => byte.toString(16).padStart(2, '0'))
        .join('');
      console.log('🔐 Hex string:', hexString);
      
      const testString = 'Hello FarmFit App!';
      const sha256Hash = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        testString,
        { encoding: Crypto.CryptoEncoding.HEX }
      );
      console.log('🔑 SHA256 hash:', sha256Hash);
      
      const secureState = await generateSecureRandomState();
      console.log('⚡ Secure state:', secureState);
      
      console.log('✅ All crypto tests completed successfully!');
      Alert.alert(
        'Crypto Test Complete', 
        'All tests passed! Check console for detailed results.'
      );
      
    } catch (error) {
      console.error('❌ Crypto test failed:', error);
      Alert.alert('Crypto Test Failed', error.message);
    }
  };

  // Helper function for secure state generation
  const generateSecureRandomState = async () => {
    try {
      const bytes = await Crypto.getRandomBytesAsync(16);
      return Array.from(bytes)
        .map(byte => byte.toString(16).padStart(2, '0'))
        .join('');
    } catch (error) {
      console.warn('Crypto state generation failed:', error);
      return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    }
  };

  const testRotation = async () => {
    console.log('=== TESTING REFRESH TOKEN ROTATION ===');
    
    // First refresh
    const result1 = await testTokenRefresh();
    const token1 = await tokenStorage.getItem('refresh_token');
    
    // Second refresh (should get new token)
    const result2 = await testTokenRefresh();
    const token2 = await tokenStorage.getItem('refresh_token');
    
    console.log('Token rotation working:', token1 !== token2);
    console.log('First token:', token1?.substring(0, 20) + '...');
    console.log('Second token:', token2?.substring(0, 20) + '...');
  };

  if (loading) {
    return (
      <ThemedView style={styles.container}>
        <ActivityIndicator 
          size="large" 
          color={activityIndicatorColors.primary} 
        />
        <ThemedText style={[styles.loadingText, { color: colors.textSecondary }]}>
          Loading profile...
        </ThemedText>
      </ThemedView>
    );
  }

  if (error) {
    return (
      <ThemedView style={styles.container}>
        <ThemedText type="title">Error Loading Profile</ThemedText>
        <ThemedText style={[styles.errorText, { color: colors.error }]}>
          {error}
        </ThemedText>
      </ThemedView>
    );
  }

  if (!user) {
    return (
      <ThemedView style={styles.container}>
        <ThemedText type="title">Please Sign In</ThemedText>
      </ThemedView>
    );
  }

  // Use Supabase data with Auth0 fallbacks
  const displayData = {
    name: userData?.name || user.name,
    email: userData?.email || user.email,
    picture: userData?.picture || user.picture,
    lastLogin: userData?.last_login,
    bio: userData?.bio,
    location: userData?.location,
    phoneNumber: userData?.phone_number,
  };

  // Calculate progress bar width
  const progressWidth = progressAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  // Calculate slide animation
  const slideTranslateY = slideAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [200, 0],
  });

  const slideOpacity = slideAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  return (
    <ThemedView style={styles.container}>
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
        style={styles.scrollView}
      >
        <ThemedText type="title" style={styles.title}>My Profile</ThemedText>
        
        <ThemedCard variant="elevated" style={styles.card}>
          <ThemedText type="subtitle" style={styles.welcomeText}>
            Welcome, {displayData.name || displayData.email || 'User'}!
          </ThemedText>
          
          {displayData.email && (
            <ThemedText style={[styles.detail, { color: colors.textSecondary }]}>
              Email: {displayData.email}
            </ThemedText>
          )}
          
          {displayData.phoneNumber && (
            <ThemedText style={[styles.detail, { color: colors.textSecondary }]}>
              Phone: {displayData.phoneNumber}
            </ThemedText>
          )}
          
          {displayData.location && (
            <ThemedText style={[styles.detail, { color: colors.textSecondary }]}>
              Location: {displayData.location}
            </ThemedText>
          )}
          
          {displayData.bio && (
            <ThemedText style={[styles.detail, { color: colors.textSecondary }]}>
              Bio: {displayData.bio}
            </ThemedText>
          )}
          
          {displayData.lastLogin && (
            <ThemedText style={[styles.detail, { color: colors.textMuted }]}>
              Last login: {new Date(displayData.lastLogin).toLocaleString()}
            </ThemedText>
          )}
            
          {displayData.picture && (
            <ThemedView style={styles.pictureContainer}>
              <ThemedText style={[styles.detail, { color: colors.textSecondary }]}>
                Profile Picture:
              </ThemedText>
              <Image 
                source={{ uri: displayData.picture }} 
                style={[
                  styles.picture, 
                  { 
                    borderColor: colors.border,
                    borderWidth: 2,
                  }
                ]} 
              />
            </ThemedView>
          )}
        </ThemedCard>
        
        {/* Horizontal Button Row */}
        <ThemedView style={styles.buttonRow}>
          {/* Edit Profile Button with Long Press */}
          <Pressable
            onPressIn={handleEditProfilePressIn}
            onPressOut={handleEditProfilePressOut}
            style={[styles.buttonContainer, styles.editButtonContainer]}
          >
            <ThemedView style={[
              styles.buttonWrapper,
              { 
                backgroundColor: isLongPressing ? colors.primary : 'transparent',
                borderColor: colors.primary,
              }
            ]}>
              <ThemedText style={[
                styles.buttonText,
                { 
                  color: isLongPressing ? colors.background : colors.primary,
                }
              ]}>
                Edit Profile
              </ThemedText>
              
              {/* Progress bar for long press */}
              {isLongPressing && (
                <Animated.View
                  style={[
                    styles.progressBar,
                    { backgroundColor: colors.primary },
                    { width: progressWidth }
                  ]}
                />
              )}
            </ThemedView>
          </Pressable>
          
          {/* Sign Out Button */}
          <ThemedButton 
            variant="primary" 
            style={[
              styles.signOutButton,
              { backgroundColor: colors.error }
            ]}
            labelStyle={[
              styles.signOutButtonText,
              { color: colors.background }
            ]}
            onPress={handleSignOut}
          >
            Sign Out
          </ThemedButton>
        </ThemedView>

        {/* Secret Debug Tools - Animated Slide In */}
        {showDebugTools && (
          <Animated.View
            style={[
              styles.debugSection,
              {
                backgroundColor: BrandColors.debugLight,
                borderColor: BrandColors.debug,
                transform: [{ translateY: slideTranslateY }],
                opacity: slideOpacity,
              }
            ]}
          >
            <ThemedView style={[styles.debugHeader, { backgroundColor: 'transparent' }]}>
              <ThemedText type="subtitle" style={styles.debugTitle}>
                🛠️ Secret Debug Mode Activated!
              </ThemedText>
              <Pressable 
                onPress={hideDebugTools} 
                style={[
                  styles.closeButton,
                  { backgroundColor: BrandColors.debugBorder }
                ]}
              >
                <ThemedText style={[styles.closeButtonText, { color: BrandColors.debug }]}>
                  ✕
                </ThemedText>
              </Pressable>
            </ThemedView>
            
            <ThemedButton 
              variant="outlined" 
              onPress={handleTestRefresh}
              style={[
                styles.testButton,
                { borderColor: BrandColors.debug }
              ]}
              labelStyle={{ color: BrandColors.debug }}
            >
              🔄 Test Token Refresh
            </ThemedButton>
            
            <ThemedButton 
              variant="outlined" 
              onPress={testCrypto}
              style={[
                styles.testButton,
                { borderColor: BrandColors.debug }
              ]}
              labelStyle={{ color: BrandColors.debug }}
            >
              🔐 Test Crypto Functions
            </ThemedButton>
            <ThemedButton 
              variant="outlined" 
              onPress={testRotation}
              style={[
                styles.testButton,
                { borderColor: BrandColors.debug }
              ]}
              labelStyle={{ color: BrandColors.debug }}
            >
              Test Token Rotation
            </ThemedButton>
          </Animated.View>
        )}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
    paddingBottom: 40,
  },
  title: {
    textAlign: 'center',
    marginBottom: 10,
  },
  card: {
    marginVertical: 20,
    padding: 15,
  },
  welcomeText: {
    marginBottom: 10,
  },
  detail: {
    marginTop: 10,
    fontSize: 16,
  },
  pictureContainer: {
    marginTop: 15,
    alignItems: 'center',
  },
  picture: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginTop: 10,
  },
  // Horizontal button row with perfect alignment
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
    alignItems: 'stretch', // This ensures equal height
  },
  buttonContainer: {
    flex: 1,
  },
  editButtonContainer: {
    borderRadius: 8,
    borderWidth: 2,
    overflow: 'hidden',
  },
  buttonWrapper: {
    padding: 16, // Increased padding for better alignment
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    minHeight: 56, // Minimum height for consistent sizing
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    zIndex: 2,
    textAlign: 'center', // Center text horizontally
  },
  progressBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    height: 3,
    borderRadius: 1.5,
  },
  signOutButton: {
    flex: 1,
    borderRadius: 8,
    minHeight: 56, // Match the edit button height
    justifyContent: 'center', // Center content vertically
  },
  signOutButtonText: {
    fontWeight: 'bold',
    textAlign: 'center', // Center text horizontally
    fontSize: 16,
  },
  loadingText: {
    marginTop: 20,
    textAlign: 'center',
  },
  errorText: {
    marginTop: 10,
    textAlign: 'center',
  },
  debugSection: {
    marginTop: 20,
    padding: 20,
    borderWidth: 2,
    borderRadius: 12,
    marginBottom: 20,
  },
  debugHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  debugTitle: {
    textAlign: 'center',
    flex: 1,
  },
  closeButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  testButton: {
    marginTop: 10,
  },
});