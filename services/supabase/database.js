// services/supabase/database.js
import { supabase } from './config';

// Create or update user data (modified for Auth ID)
export const saveUserData = async (userData) => {
  try {
    // If auth_id exists but no id, it's a new user
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
  
  // Return unsubscribe function
  return () => {
    supabase.removeChannel(subscription);
  };
};

export const getUserDataByAuthId = async (authUserId) => {
  try {
    // Make sure column name is correct - it should be the actual DB column name
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('auth_id', authUserId)  // Make sure 'auth_id' is the actual column name
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

export const testSupabaseConnection = async () => {
  try {
    console.log('Testing Supabase connection...');
    const { data, error } = await supabase
      .from('users')
      .select('id')  // Just select a column instead of count()
      .limit(1);
    
    if (error) {
      console.error('Supabase connection test failed:', error);
      return false;
    }
    
    console.log('Supabase connection test successful:', data);
    return true;
  } catch (error) {
    console.error('Supabase connection test error:', error);
    return false;
  }
};