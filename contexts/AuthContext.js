// contexts/AuthContext.js
import React, { createContext, useState, useEffect, useContext } from 'react';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { login, getUserInfo, logout } from "@/services/auth0/AuthService";
import { 
  getUserDataByAuthId, 
  saveUserData, 
  updateUserData, 
  subscribeToUserData, 
  testSupabaseConnection,
  getUserRoles,
  getPractitionerProfileByUserId,
  isUserAdmin,
  getAdminDetails 
} from '@/services/supabase';

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
  
  // NEW: Role management state
  const [userRoles, setUserRoles] = useState({
    is_pet_owner: false,
    is_practitioner: false,
    practitioner_status: null,
    practitioner_verified_at: null
  });
  const [currentRole, setCurrentRole] = useState('pet_owner'); // Active role
  const [practitionerProfile, setPractitionerProfile] = useState(null);
  const [roleLoading, setRoleLoading] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminDetails, setAdminDetails] = useState(null);

  // Initialize or get user data from Supabase (your existing code)
  const initializeUserData = async (authUser) => {
    if (!authUser || !authUser.sub) return null;
    
    try {
      const authUserId = authUser.sub;
      let userData = await getUserDataByAuthId(authUserId);
      
      if (!userData) {
        const newUserData = {
          auth_id: authUserId,
          email: authUser.email,
          name: authUser.name || authUser.email,
          picture: authUser.picture,
          created_at: new Date().toISOString(),
          last_login: new Date().toISOString(),
          // NEW: Initialize with default roles
          is_pet_owner: true,
          is_practitioner: false
        };
        
        const result = await saveUserData(newUserData);
        if (result) userData = Array.isArray(result) ? result[0] : result;
      } else {
        const updates = {
          last_login: new Date().toISOString(),
          picture: authUser.picture || userData.picture
        };
        
        const result = await updateUserData(userData.id, updates);
        if (result) userData = Array.isArray(result) ? result[0] : result;
      }
      
      setSupabaseData(userData);
      
      // NEW: Load user roles after user data is set
      await loadUserRoles(authUserId);
      
      return userData;
    } catch (error) {
      console.error('Error initializing user data:', error);
      return null;
    }
  };

  // NEW: Load user roles and practitioner profile
  const loadUserRoles = async (authUserId) => {
    try {
      setRoleLoading(true);
      
      // Get user roles
      const roles = await getUserRoles(authUserId);
      if (roles) {
        setUserRoles(roles);

        // Check admin status
        const adminStatus = await isUserAdmin(authUserId);
        setIsAdmin(adminStatus);
        
        if (adminStatus) {
          const adminData = await getAdminDetails(authUserId);
          if (adminData.success) {
            setAdminDetails(adminData.data);
          }
        }
        
        // If user is a verified practitioner, load their profile
        if (roles.is_practitioner && roles.practitioner_status === 'verified') {
          const profile = await getPractitionerProfileByUserId(authUserId);
          setPractitionerProfile(profile);
        }
        
        // Set appropriate current role based on verification status
        if (adminStatus)  {
          setCurrentRole('admin');
        } else if (roles.is_practitioner && roles.practitioner_status === 'verified') {
          setCurrentRole('practitioner');
        } else {
          setCurrentRole('pet_owner');
        }
      }
    } catch (error) {
      console.error('Error loading user roles:', error);
    } finally {
      setRoleLoading(false);
    }
  };

  // NEW: Switch between roles
  const switchRole = async (newRole) => {
    if (!user?.sub) return false;

    // Validate role switch
    if (newRole === 'practitioner' && (!userRoles.is_practitioner || userRoles.practitioner_status !== 'verified')) {
      console.warn('Cannot switch to practitioner role: not verified');
      return false;
    }

    if (newRole === 'pet_owner' && !userRoles.is_pet_owner) {
      console.warn('Cannot switch to pet owner role: not authorized');
      return false;
    }

    setCurrentRole(newRole);
    
    // Store the current role preference
    await tokenStorage.setItem('current_role', newRole);
    
    return true;
  };

  // NEW: Check if user has specific role
  const hasRole = (roleName) => {
    switch (roleName) {
      case 'admin':
        return isAdmin;
      case 'pet_owner':
        return userRoles.is_pet_owner;
      case 'practitioner':
        return userRoles.is_practitioner && userRoles.practitioner_status === 'verified';
      case 'pending_practitioner':
        return userRoles.is_practitioner && userRoles.practitioner_status === 'pending';
      default:
        return false;
    }
  };

  // NEW: Refresh roles (useful after applying for practitioner status)
  const refreshRoles = async () => {
    if (user?.sub) {
      await loadUserRoles(user.sub);
    }
  };

  // Your existing useEffect for user subscription
  useEffect(() => {
    if (!user || !user.sub) return;
    
    getUserDataByAuthId(user.sub).then(userData => {
      if (!userData) return;
      
      const unsubscribe = subscribeToUserData(userData.id, (updatedData) => {
        if (updatedData) {
          setSupabaseData(updatedData);
          // NEW: Refresh roles when user data changes
          refreshRoles();
        }
      });
      
      return () => {
        if (unsubscribe) unsubscribe();
      };
    });
  }, [user]);

  // NEW: Load stored role preference on app start
  useEffect(() => {
    const loadStoredRole = async () => {
      const storedRole = await tokenStorage.getItem('current_role');
      if (storedRole && hasRole(storedRole)) {
        setCurrentRole(storedRole);
      }
    };

    if (userRoles.is_pet_owner || userRoles.is_practitioner) {
      loadStoredRole();
    }
  }, [userRoles]);

  // Your existing signIn method
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
        
        const supabaseResult = await initializeUserData(userInfo);
        console.log('Supabase initialization result:', supabaseResult);
      }
    } catch (error) {
      console.error('Sign in error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Your existing signOut method
  const signOut = async () => {
    try {
      await tokenStorage.removeItem('auth_token');
      await tokenStorage.removeItem('current_role'); // NEW: Clear role preference
      await logout();
      setUser(null);
      setSupabaseData(null);
      // NEW: Reset role state
      setUserRoles({
        is_pet_owner: false,
        is_practitioner: false,
        practitioner_status: null,
        practitioner_verified_at: null
      });
      setCurrentRole('pet_owner');
      setPractitionerProfile(null);
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  // Your existing updateUserSupabaseData method
  const updateUserSupabaseData = async (updates) => {
    if (!user || !user.sub || !supabaseData?.id) return false;
    
    try {
      const result = await updateUserData(supabaseData.id, updates);
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
      // Your existing values
      user, 
      userData: supabaseData,
      loading, 
      signIn, 
      signOut,
      updateUserData: updateUserSupabaseData,
      
      // NEW: Role management values
      userRoles,
      currentRole,
      isAdmin,
      adminDetails,
      practitionerProfile,
      roleLoading,
      switchRole,
      hasRole,
      refreshRoles
    }}>
      {children}
    </AuthContext.Provider>
  );
};

// Your existing hook
export const useAuth = () => useContext(AuthContext);

// NEW: Hook specifically for role management
export const useRoles = () => {
  const { userRoles, currentRole, hasRole, switchRole, practitionerProfile } = useAuth();
  return { userRoles, currentRole, hasRole, switchRole, practitionerProfile };
};