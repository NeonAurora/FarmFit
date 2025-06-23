// app/(main)/profile.jsx
import React from 'react';
import { StyleSheet, Image, ActivityIndicator } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useUserData } from '@/hooks/useUserData'; 
import { ThemedView } from '@/components/themes/ThemedView';
import { ThemedText } from '@/components/themes/ThemedText';
import { ThemedButton } from '@/components/themes/ThemedButton';
import { ThemedCard } from '@/components/themes/ThemedCard';
import { useTheme } from '@/contexts/ThemeContext';
import { useActivityIndicatorColors } from '@/hooks/useThemeColor';
import { useRouter } from 'expo-router';

export default function ProfileScreen() {
  const { user, signOut, loading: authLoading } = useAuth();
  const { userData, loading: dataLoading, error } = useUserData();
  const { colors, isDark } = useTheme();
  const activityIndicatorColors = useActivityIndicatorColors();
  const router = useRouter();

  const loading = authLoading || dataLoading;

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

  const dynamicStyles = createDynamicStyles(colors, isDark);

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title">My Profile</ThemedText>
      
      <ThemedCard variant="elevated" style={styles.card}>
        <ThemedText type="subtitle" style={styles.welcomeText}>
          Welcome, {displayData.name || displayData.email || 'User'}!
        </ThemedText>
        
        {displayData.email && (
          <ThemedText style={[styles.detail, { color: colors.textSecondary }]}>
            Email: {displayData.email}
          </ThemedText>
        )}
        
        {/* Only show these if they exist */}
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
      
      {/* Edit Profile Button */}
      <ThemedButton 
        variant="secondary" 
        style={styles.editButton}
        onPress={handleEditProfile}
      >
        Edit Profile
      </ThemedButton>
      
      {/* Sign Out Button */}
      <ThemedButton 
        variant="primary" 
        style={[styles.signOutButton, dynamicStyles.signOutButton]}
        labelStyle={dynamicStyles.signOutButtonText}
        onPress={handleSignOut}
      >
        Sign Out
      </ThemedButton>
    </ThemedView>
  );
}

// Create dynamic styles that respond to theme changes
const createDynamicStyles = (colors, isDark) => StyleSheet.create({
  signOutButton: {
    backgroundColor: colors.error,
  },
  signOutButtonText: {
    color: '#fff', // Always white text on error background
    fontWeight: 'bold',
  },
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
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
  editButton: {
    marginBottom: 10,
    borderRadius: 8,
  },
  signOutButton: {
    borderRadius: 8,
  },
  loadingText: {
    marginTop: 20,
    textAlign: 'center',
  },
  errorText: {
    marginTop: 10,
    textAlign: 'center',
  },
});