// services/supabase/database.js
import { supabase } from './config';

// Create or update user data
export const saveUserData = async (userId, userData) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .upsert({ id: userId, ...userData })
      .select();
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error saving user data:', error);
    return false;
  }
};

// Get user data once
export const getUserData = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error getting user data:', error);
    return null;
  }
};

// Update specific user data fields
export const updateUserData = async (userId, updates) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', userId)
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