import React, { useEffect } from 'react';
import { ActivityIndicator, StyleSheet } from 'react-native';
import { ThemedView } from '@/components/ThemedView';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'expo-router';

export default function CallbackScreen() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // If not loading and we have a user, navigate to home
    if (!loading) {
      // Short delay to ensure auth state is properly updated
      const timer = setTimeout(() => {
        router.replace('/');
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [user, loading, router]);

  return (
    <ThemedView style={styles.container}>
      <ActivityIndicator size="large" color="#ff00ff" />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  }
});