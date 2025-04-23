import React from 'react';
import { StyleSheet, Pressable, Image, ActivityIndicator } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useUserData } from '@/hooks/useUserData';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { useRouter } from 'expo-router';

export default function ProfileScreen() {
  const { signOut, loading: authLoading } = useAuth();
  const { userData, loading: dataLoading } = useUserData();
  const router = useRouter();

  const loading = authLoading || dataLoading;

  React.useEffect(() => {
    if (!loading && !userData) {
      router.replace('/');
    }
  }, [loading, userData]);

  const handleSignOut = async () => {
    try {
      await signOut();
      router.replace('/'); // Ensure navigation after sign-out
    } catch (error) {
      console.error("Error during sign out:", error);
    }
  };

  if (loading || !userData) {
    return (
      <ThemedView style={styles.container}>
        <ActivityIndicator size="large" color="#0a7ea4" />
        <ThemedText style={{ marginTop: 20 }}>
          {loading ? 'Loading profile...' : 'Redirecting...'}
        </ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title">Profile</ThemedText>
      
      <ThemedView style={styles.card}>
        <ThemedText type="subtitle">Welcome, {userData.name || userData.email || 'User'}!</ThemedText>
        
        {userData.email && (
          <ThemedText style={styles.detail}>Email: {userData.email}</ThemedText>
        )}
        
        {userData.lastLogin && (
          <ThemedText style={styles.detail}>
            Last login: {new Date(userData.lastLogin).toLocaleString()}
          </ThemedText>
        )}
        
        {userData.picture && (
          <ThemedView style={styles.pictureContainer}>
            <ThemedText style={styles.detail}>Profile Picture:</ThemedText>
            <Image source={{ uri: userData.picture }} style={styles.picture} />
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