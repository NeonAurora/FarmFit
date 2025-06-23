// contexts/AuthContext.js
import React, { createContext, useState, useEffect, useContext } from 'react';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { login, getUserInfo, logout, validateToken, refreshToken } from "@/services/auth0/AuthService";
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
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  
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


  useEffect(() => {
    console.log('AuthProvider mounted, checking for existing session...');
    checkExistingSession();
  }, []);

  const checkExistingSession = async () => {
    try {
      setLoading(true);
      console.log('Checking for existing auth session...');
      
      await testSupabaseConnection();
      
      const storedToken = await tokenStorage.getItem('auth_token');
      
      if (!storedToken) {
        console.log('No stored token found - user needs to sign in');
        setLoading(false);
        return;
      }

      console.log('Stored token found, validating...');
      
      const validation = await validateToken(storedToken);
      
      if (validation.isValid && validation.userInfo) {
        console.log('Token is valid, auto-signing in user');
        
        // Set user from validated token
        setUser(validation.userInfo);
        
        // Initialize user data
        const supabaseResult = await initializeUserData(validation.userInfo);
        console.log('Auto-login successful');
        
        if (!supabaseResult) {
          console.warn('Auto-login succeeded but Supabase initialization failed');
        }
        
      } else {
        // Token is invalid, expired, or validation failed
        console.log('Token validation failed:', validation.error || 'Unknown error');
        
        if (validation.expired) {
          console.log('Token has expired - clearing and requiring re-login');
        } else {
          console.log('Token is invalid - clearing and requiring re-login');
        }
        
        await clearStoredTokens();
      }
      
    } catch (error) {
      console.error('Error checking existing session:', error);
      
      // On any error, clear tokens to ensure clean state
      await clearStoredTokens();
    } finally {
      setLoading(false);
    }
  };

  const clearStoredTokens = async () => {
    try {
      console.log('Clearing all stored authentication data...');
      
      await tokenStorage.removeItem('auth_token');
      await tokenStorage.removeItem('refresh_token'); // Keep this for future compatibility
      await tokenStorage.removeItem('current_role');
      
      console.log('Stored tokens cleared successfully');
    } catch (error) {
      console.error('Error clearing stored tokens:', error);
    }
  };


  // Initialize or get user data from Supabase (your existing code)
  const initializeUserData = async (authUser) => {
    if (!authUser || !authUser.sub) return null;
    
    try {
      const authUserId = authUser.sub;
      let userData = await getUserDataByAuthId(authUserId);
      
      if (!userData) {
        // Create new user - this part is fine
        const newUserData = {
          auth_id: authUserId,
          email: authUser.email,
          name: authUser.name || authUser.email,
          picture: authUser.picture,
          created_at: new Date().toISOString(),
          last_login: new Date().toISOString(),
          is_pet_owner: true,
          is_practitioner: false
        };
        
        const result = await saveUserData(newUserData);
        if (result) userData = Array.isArray(result) ? result[0] : result;
      } else {
        // User exists - be selective about updates
        console.log('Existing user found, updating minimal fields...');
        
        const updates = {
          last_login: new Date().toISOString(),
        };
        
        // Only update email if it changed in Auth0
        if (authUser.email && authUser.email !== userData.email) {
          console.log('Email changed in Auth0, updating...');
          updates.email = authUser.email;
        }
        
        // Only update name if user hasn't set a custom name
        // (Check if current name is the same as email, indicating no custom name set)
        if (authUser.name && userData.name === userData.email && authUser.name !== authUser.email) {
          console.log('Setting name from Auth0 for first time...');
          updates.name = authUser.name;
        }
        
        // Only update picture if user is still using Auth0/Google picture
        // (i.e., if current picture is NOT from Supabase storage)
        if (authUser.picture && userData.picture && 
            !userData.picture.includes('supabase.co/storage')) {
          console.log('Updating Auth0/Google profile picture...');
          updates.picture = authUser.picture;
        }
        
        // If user has no picture at all, set Auth0 picture
        if (authUser.picture && !userData.picture) {
          console.log('Setting initial profile picture from Auth0...');
          updates.picture = authUser.picture;
        }
        
        console.log('Updating user with:', updates);
        
        // Only update if there are meaningful changes (beyond just last_login)
        if (Object.keys(updates).length > 1) {
          const result = await updateUserData(userData.id, updates);
          if (result) userData = Array.isArray(result) ? result[0] : result;
        } else {
          // Just update last_login
          const result = await updateUserData(userData.id, { last_login: updates.last_login });
          if (result) userData = Array.isArray(result) ? result[0] : result;
        }
      }
      
      setSupabaseData(userData);
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

  // Updated sign in with better token storage
  // In AuthContext.js - Update the signIn function
  const signIn = async () => {
    if (isAuthenticating) return;
    
    setIsAuthenticating(true);
    setLoading(true);
    
    try {
      console.log('Starting manual sign in...');
      
      const result = await login();
      console.log('Auth0 login result:', result ? 'Success' : 'Failed');
      
      if (result && result.accessToken) {
        // Ensure we're storing strings
        console.log('Storing access token...');
        await tokenStorage.setItem('auth_token', String(result.accessToken));
        
        if (result.refreshToken) {
          console.log('Storing refresh token...');
          await tokenStorage.setItem('refresh_token', String(result.refreshToken));
        }
        
        const userInfo = await getUserInfo(result.accessToken);
        console.log('Auth0 user info:', userInfo ? 'Retrieved successfully' : 'Failed to retrieve');
        
        if (userInfo) {
          setUser(userInfo);
          const supabaseResult = await initializeUserData(userInfo);
          console.log('Supabase initialization result:', supabaseResult);
        } else {
          throw new Error('Failed to get user information');
        }
      } else {
        throw new Error('Login failed - no access token received');
      }
    } catch (error) {
      console.error('Sign in error:', error);
      await clearStoredTokens();
    } finally {
      setLoading(false);
      setIsAuthenticating(false);
    }
  };

  // Updated sign out
  const signOut = async () => {
    try {
      console.log('Signing out user...');
      
      // Clear all stored data
      await clearStoredTokens();
      
      // Auth0 logout
      await logout();
      
      // Reset all state
      setUser(null);
      setSupabaseData(null);
      setUserRoles({
        is_pet_owner: false,
        is_practitioner: false,
        practitioner_status: null,
        practitioner_verified_at: null
      });
      setCurrentRole('pet_owner');
      setPractitionerProfile(null);
      setIsAdmin(false);
      setAdminDetails(null);
      
      console.log('Sign out complete');
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

  // NEW: Check if user is authenticated
  const isAuthenticated = () => {
    return !!user;
  };

  // NEW: Force token refresh
  const forceTokenRefresh = async () => {
    try {
      const storedRefreshToken = await tokenStorage.getItem('refresh_token');
      if (!storedRefreshToken) {
        throw new Error('No refresh token available');
      }

      const refreshResult = await refreshToken(storedRefreshToken);
      
      if (refreshResult.success) {
        await tokenStorage.setItem('auth_token', refreshResult.accessToken);
        if (refreshResult.refreshToken) {
          await tokenStorage.setItem('refresh_token', refreshResult.refreshToken);
        }
        return true;
      }
      return false;
    } catch (error) {
      console.error('Force token refresh failed:', error);
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
      refreshRoles,

      // NEW: Persistent login values
      isAuthenticated,
      isAuthenticating,
      forceTokenRefresh,
      checkExistingSession
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