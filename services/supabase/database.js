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

// Subscribe to pet data changes for a specific user
export const subscribeToPets = (userId, callback) => {
  const subscription = supabase
    .channel(`public:pets:user_id=eq.${userId}`)
    .on('postgres_changes', 
      { 
        event: '*', 
        schema: 'public', 
        table: 'pets',
        filter: `user_id=eq.${userId}` 
      }, 
      (payload) => {
        callback(payload);
      }
    )
    .subscribe();
  
  // Return unsubscribe function
  return () => {
    supabase.removeChannel(subscription);
  };
};

export const subscribeToPet = (petId, userId, callback) => {
  const subscription = supabase
    .channel(`public:pets:id=eq.${petId}`) // Simplify channel name
    .on('postgres_changes', 
      { 
        event: '*', 
        schema: 'public', 
        table: 'pets',
        filter: `id=eq.${petId}` // Simplify filter
      }, 
      (payload) => {
        console.log('Pet subscription update:', payload); // Add logging
        callback(payload);
      }
    )
    .subscribe();
  
  // Return unsubscribe function
  return () => {
    supabase.removeChannel(subscription);
  };
};

// Get all pets for a user
export const getPetsByUserId = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('pets')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error getting pets by user ID:', error);
    return [];
  }
};

// Get a specific pet by ID
export const getPetById = async (petId, userId) => {
  try {
    const { data, error } = await supabase
      .from('pets')
      .select('*')
      .eq('id', petId)
      .eq('user_id', userId)
      .single();
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error getting pet by ID:', error);
    return null;
  }
};

// Get all approved veterinary clinics with optional filters
export const getVeterinaryClinics = async (filters = {}) => {
  try {
    let query = supabase
      .from('veterinary_clinics')
      .select('*')
      .eq('is_approved', true)
      .eq('is_active', true)
      .order('created_at', { ascending: false });
    
    // Add filters
    if (filters.district) {
      query = query.ilike('district', `%${filters.district}%`);
    }
    
    if (filters.subDistrict) {
      query = query.ilike('sub_district', `%${filters.subDistrict}%`);
    }
    
    if (filters.clinicName) {
      query = query.ilike('clinic_name', `%${filters.clinicName}%`);
    }
    
    if (filters.serviceName) {
      // Search in services JSON array
      query = query.contains('services', [{ serviceName: filters.serviceName }]);
    }
    
    const { data, error } = await query;
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error getting veterinary clinics:', error);
    return [];
  }
};

// Get a specific veterinary clinic by ID
export const getVeterinaryClinicById = async (clinicId) => {
  try {
    const { data, error } = await supabase
      .from('veterinary_clinics')
      .select('*')
      .eq('id', clinicId)
      .eq('is_approved', true)
      .eq('is_active', true)
      .single();
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error getting veterinary clinic by ID:', error);
    return null;
  }
};

// Search veterinary clinics by service
export const searchVetsByService = async (serviceName) => {
  try {
    const { data, error } = await supabase
      .from('veterinary_clinics')
      .select('*')
      .eq('is_approved', true)
      .eq('is_active', true)
      .textSearch('services', serviceName)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error searching vets by service:', error);
    return [];
  }
};