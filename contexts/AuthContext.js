import React, { createContext, useState, useEffect, useContext } from 'react';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { login, getUserInfo, logout } from "@/services/auth0/AuthService";
import { getUserDataByAuthId, saveUserData, updateUserData, subscribeToUserData, testSupabaseConnection } from '@/services/supabase';

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
      const authUserId = authUser.sub;
      
      // Check if user exists in Supabase by Auth0 ID
      let userData = await getUserDataByAuthId(authUserId);
      
      if (!userData) {
        // Create new user record if it doesn't exist
        const newUserData = {
          auth_id: authUserId,
          email: authUser.email,
          name: authUser.name || authUser.email,
          picture: authUser.picture,
          created_at: new Date().toISOString(),
          last_login: new Date().toISOString(),
        };
        
        const result = await saveUserData(newUserData);
        // Update with actual returned data from Supabase
        if (result) userData = Array.isArray(result) ? result[0] : result;
      } else {
        // Update last login time
        const updates = {
          last_login: new Date().toISOString(),
          picture: authUser.picture || userData.picture
        };
        
        const result = await updateUserData(userData.id, updates);
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
    if (!user || !user.sub) return;
    
    // First get the Supabase ID
    getUserDataByAuthId(user.sub).then(userData => {
      if (!userData) return;
      
      // Then subscribe using the Supabase ID
      const unsubscribe = subscribeToUserData(userData.id, (updatedData) => {
        if (updatedData) {
          setSupabaseData(updatedData);
        }
      });
      
      // Clean up subscription on unmount or user change
      return () => {
        if (unsubscribe) unsubscribe();
      };
    });
  }, [user]);

  const signIn = async () => {
    setLoading(true);
    await testSupabaseConnection();
    try {
      const token = await login();
      console.log('Auth0 token received:', token ? 'Token present' : 'No token');
      
      if (token) {
        await tokenStorage.setItem('auth_token', token);
        const userInfo = await getUserInfo(token);
        console.log('Auth0 user info:', JSON.stringify(userInfo));
        
        setUser(userInfo);
        
        // Initialize user data in Supabase
        const supabaseResult = await initializeUserData(userInfo);
        console.log('Supabase initialization result:', supabaseResult);
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
    if (!user || !user.sub || !supabaseData?.id) return false;
    
    try {
      // Use Supabase ID (supabaseData.id), NOT Auth0 ID (user.sub)
      const result = await updateUserData(supabaseData.id, updates); // ← Fixed!
      if (result) {
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