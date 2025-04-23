import React, { createContext, useState, useEffect, useContext } from 'react';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { login, getUserInfo, logout } from "@/services/auth0/AuthService";
import { getUserData, saveUserData, updateUserData, subscribeToUserData } from "@/services/supabase/database";

export const AuthContext = createContext();

// Helper for cross-platform storage (keeping your existing code)
const tokenStorage = {
  setItem: async (key, value) => {
    if (Platform.OS === 'web') {
      localStorage.setItem(key, value);
    } else {
      await SecureStore.setItemAsync(key, value);
    }
  },
  getItem: async (key) => {
    if (Platform.OS === 'web') {
      return localStorage.getItem(key);
    } else {
      return await SecureStore.getItemAsync(key);
    }
  },
  removeItem: async (key) => {
    if (Platform.OS === 'web') {
      localStorage.removeItem(key);
    } else {
      await SecureStore.deleteItemAsync(key);
    }
  }
};


export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [supabaseData, setSupabaseData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Initialize or get user data from Supabase
  const initializeUserData = async (authUser) => {
    if (!authUser || !authUser.sub) return null;
    
    try {
      // Get Auth0 user ID
      const userId = authUser.sub;
      
      // Check if user exists in Supabase
      let userData = await getUserData(userId);
      
      if (!userData) {
        // Create new user record if it doesn't exist
        userData = {
          id: userId, // Important for Supabase - explicit ID
          email: authUser.email,
          name: authUser.name || authUser.email,
          picture: authUser.picture,
          created_at: new Date().toISOString(),
          last_login: new Date().toISOString(),
          // Add any other default user properties
        };
        const result = await saveUserData(userId, userData);
        // Update with actual returned data from Supabase
        if (result) userData = Array.isArray(result) ? result[0] : result;
      } else {
        // Update last login time
        const updates = {
          last_login: new Date().toISOString(),
          // Update user picture if changed
          picture: authUser.picture || userData.picture
        };
        const result = await updateUserData(userId, updates);
        // Update userData with the response
        if (result) userData = Array.isArray(result) ? result[0] : result;
      }
      
      setSupabaseData(userData);
      return userData;
    } catch (error) {
      console.error('Error initializing user data:', error);
      return null;
    }
  };

  useEffect(() => {
    // Check for stored token on startup
    const loadToken = async () => {
      try {
        const token = await tokenStorage.getItem('auth_token');
        if (token) {
          const userInfo = await getUserInfo(token);
          setUser(userInfo);
          
          // Initialize user data in Supabase
          await initializeUserData(userInfo);
        }
      } catch (error) {
        console.error('Error loading token:', error);
      } finally {
        setLoading(false);
      }
    };

    loadToken();
  }, []);

  const signIn = async () => {
    setLoading(true);
    try {
      const token = await login();
      if (token) {
        await tokenStorage.setItem('auth_token', token);
        const userInfo = await getUserInfo(token);
        setUser(userInfo);
        
        // Initialize user data in Supabase
        await initializeUserData(userInfo);
      }
    } catch (error) {
      console.error('Sign in error:', error);
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      await tokenStorage.removeItem('auth_token');
      await logout();
      setUser(null);
      setSupabaseData(null);
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  // Method to update user data in Supabase
  const updateUserSupabaseData = async (updates) => {
    if (!user || !user.sub) return false;
    
    try {
      const result = await updateUserData(user.sub, updates);
      if (result) {
        // Update local state with the actual data returned from Supabase
        const updatedData = Array.isArray(result) ? result[0] : result;
        setSupabaseData(prev => ({
          ...prev,
          ...updatedData
        }));
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error updating user data:', error);
      return false;
    }
  };

  // Set up a subscription to user data changes (Supabase realtime)
  useEffect(() => {
    if (!user || !user.sub) return;
    
    const unsubscribe = subscribeToUserData(user.sub, (updatedData) => {
      if (updatedData) {
        setSupabaseData(updatedData);
      }
    });
    
    // Clean up subscription on unmount or user change
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [user]);

  return (
    <AuthContext.Provider value={{ 
      user, 
      userData: supabaseData, // Renamed for clarity
      loading, 
      signIn, 
      signOut,
      updateUserData: updateUserSupabaseData
    }}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use auth context
export const useAuth = () => useContext(AuthContext);