// app/(main)/profile.jsx
import React from 'react';
import { StyleSheet, Pressable, Image, ActivityIndicator } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useUserData } from '@/hooks/useUserData'; 
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { useRouter } from 'expo-router';

export default function ProfileScreen() {
  const { user, signOut, loading: authLoading } = useAuth();
  const { userData, loading: dataLoading, error } = useUserData(); // ✅ Get Supabase data
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

  if (loading) {
    return (
      <ThemedView style={styles.container}>
        <ActivityIndicator size="large" color="#0a7ea4" />
        <ThemedText style={{ marginTop: 20 }}>Loading profile...</ThemedText>
      </ThemedView>
    );
  }

  if (error) {
    return (
      <ThemedView style={styles.container}>
        <ThemedText type="title">Error Loading Profile</ThemedText>
        <ThemedText style={styles.errorText}>{error}</ThemedText>
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
    // Add any additional Supabase-only fields here
    // customField: userData?.custom_field,
    // preferences: userData?.preferences,
    // etc.
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title">Profile</ThemedText>
      
      <ThemedView style={styles.card}>
        <ThemedText type="subtitle">
          Welcome, {displayData.name || displayData.email || 'User'}!
        </ThemedText>
        
        {displayData.email && (
          <ThemedText style={styles.detail}>Email: {displayData.email}</ThemedText>
        )}
        
        {displayData.lastLogin && (
          <ThemedText style={styles.detail}>
            Last login: {new Date(displayData.lastLogin).toLocaleString()}
          </ThemedText>
        )}
        
        {/* Add any additional Supabase fields here */}
        
        {displayData.picture && (
          <ThemedView style={styles.pictureContainer}>
            <ThemedText style={styles.detail}>Profile Picture:</ThemedText>
            <Image source={{ uri: displayData.picture }} style={styles.picture} />
          </ThemedView>
        )}
      </ThemedView>
      
      <Pressable style={styles.button} onPress={handleSignOut}>
        <ThemedText style={styles.buttonText}>Sign Out</ThemedText>
      </Pressable>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  card: {
    marginVertical: 20,
    padding: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  detail: {
    marginTop: 10,
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
  button: {
    backgroundColor: '#E74C3C',
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
  },
});