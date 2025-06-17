// app/(main)/index.jsx
import { StyleSheet } from 'react-native';
import { ThemedView } from '@/components/themes/ThemedView';
import { ThemedText } from '@/components/themes/ThemedText';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'expo-router';
import { FAB } from 'react-native-paper';
import React, { useState } from 'react';

export default function HomePage() {
  const { user } = useAuth();
  const router = useRouter();
  const [fabOpen, setFabOpen] = useState(false);

  const actions = [
    {
      icon: 'plus',
      label: 'Add Pet',
      onPress: () => router.push('/addPetScreen'),
    },
    {
      icon: 'account-clock',
      label: 'Incoming Requests',
      onPress: () => router.push('/connectionRequestsScreen'),
    },
  ];
  
  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title">Welcome to FarmFit</ThemedText>
      
      {user ? (
        <ThemedText style={styles.welcomeText}>
          Hello, {user.name || user.email || 'User'}! Manage your pets with ease.
        </ThemedText>
      ) : (
        <ThemedText style={styles.welcomeText}>
          Sign in using the button in the header to start managing your pets.
        </ThemedText>
      )}

      {/* FAB Group in bottom‑right */}
      <FAB.Group
        open={fabOpen}
        icon={fabOpen ? 'close' : 'menu'}
        actions={actions}
        onStateChange={({ open }) => setFabOpen(open)}
        style={styles.fab}
      />

    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 40,
    paddingHorizontal: 20,
  },
  welcomeText: {
    marginTop: 20,
    textAlign: 'center',
    fontSize: 16,
  },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 16,
  },
});