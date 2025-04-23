// services/supabase/config.js
import 'react-native-url-polyfill/auto';
import * as SecureStore from 'expo-secure-store';
import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const supabaseUrl = 'https://mvetervkfpblfwyzxvig.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im12ZXRlcnZrZnBibGZ3eXp4dmlnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUzODA1ODQsImV4cCI6MjA2MDk1NjU4NH0.JjRaDzPESRg7AD96Ln8FLzt9pE20y6S05pkafgM_qLs';

// Check if we're in a browser environment
const isBrowser = typeof window !== 'undefined';

// Create a custom storage adapter for Supabase
const ExpoSecureStoreAdapter = {
  getItem: async (key) => {
    // Only use AsyncStorage on web when in browser environment
    if (Platform.OS === 'web' && isBrowser) {
      return AsyncStorage.getItem(key);
    } else if (Platform.OS !== 'web') {
      // Use SecureStore for native platforms
      return SecureStore.getItemAsync(key);
    }
    // Return null if neither condition is met (SSR environment)
    return null;
  },
  setItem: async (key, value) => {
    if (Platform.OS === 'web' && isBrowser) {
      return AsyncStorage.setItem(key, value);
    } else if (Platform.OS !== 'web') {
      return SecureStore.setItemAsync(key, value);
    }
    return null;
  },
  removeItem: async (key) => {
    if (Platform.OS === 'web' && isBrowser) {
      return AsyncStorage.removeItem(key);
    } else if (Platform.OS !== 'web') {
      return SecureStore.deleteItemAsync(key);
    }
    return null;
  },
};

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    storage: ExpoSecureStoreAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});