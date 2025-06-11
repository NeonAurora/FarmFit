// services/supabase/userService.js
import { supabase } from './config';

// Create or update user data
export const saveUserData = async (userData) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .insert(userData)
      .select();
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error saving user data:', error);
    return false;
  }
};

// Update specific user data fields by Supabase ID
export const updateUserData = async (supabaseId, updates) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', supabaseId)
      .select();
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error updating user data:', error);
    return false;
  }
};

// Get user data by Auth0 ID
export const getUserDataByAuthId = async (authUserId) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('auth_id', authUserId)
      .single();
    
    if (error && error.code !== 'PGRST116') {
      console.error('Error in getUserDataByAuthId:', error);
      throw error;
    }
    return data;
  } catch (error) {
    console.error('Error getting user data by auth ID:', error);
    return null;
  }
};

// Search users by name or email (excluding current user)
export const searchUsers = async (query, currentUserId) => {
  try {
    if (!query || query.trim().length < 2) {
      return [];
    }
    
    const searchTerm = query.trim().toLowerCase();
    
    const { data, error } = await supabase
      .from('users')
      .select('id, name, email, picture, created_at')
      .neq('auth_id', currentUserId)
      .or(`name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`)
      .order('name', { ascending: true })
      .limit(50);
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error searching users:', error);
    return [];
  }
};

// Get user profile by ID
export const getUserById = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id, name, email, auth_id, picture, created_at')
      .eq('id', userId)
      .single();
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error getting user by ID:', error);
    return null;
  }
};

// Subscribe to user data changes
export const subscribeToUserData = (userId, callback) => {
  const subscription = supabase
    .channel(`public:users:id=eq.${userId}`)
    .on('postgres_changes', 
      { 
        event: '*', 
        schema: 'public', 
        table: 'users',
        filter: `id=eq.${userId}` 
      }, 
      (payload) => {
        callback(payload.new);
      }
    )
    .subscribe();
  
  return () => {
    supabase.removeChannel(subscription);
  };
};