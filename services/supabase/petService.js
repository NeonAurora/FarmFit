// services/supabase/petService.js
import { supabase } from './config';

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

// Update the getPetById function to include calculated age
export const getPetById = async (petId, userId) => {
  try {
    const { data, error } = await supabase
      .from('pets')
      .select('*')
      .eq('id', petId)
      .eq('user_id', userId)
      .single();
    
    if (error) throw error;
    
    // Calculate current age if birthday exists
    if (data && data.birthday) {
      const calculatedAge = calculateAgeFromBirthday(data.birthday);
      
      // Update age in database if it's different
      if (calculatedAge !== data.age) {
        await updatePetData(petId, userId, { age: calculatedAge });
        data.age = calculatedAge;
      }
    }
    
    return data;
  } catch (error) {
    console.error('Error getting pet by ID:', error);
    return null;
  }
};

// Save pet data
export const savePetData = async (petData) => {
  try {
    const { data, error } = await supabase
      .from('pets')
      .insert(petData)
      .select();
    
    if (error) {
      console.error('Detailed Supabase error:', JSON.stringify(error));
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error('Error saving pet data:', error);
    throw error;
  }
};

// Update pet data
export const updatePetData = async (petId, userId, petData) => {
  try {
    const { data, error } = await supabase
      .from('pets')
      .update(petData)
      .eq('id', petId)
      .eq('user_id', userId)
      .select();
    
    if (error) {
      console.error('Detailed Supabase error:', JSON.stringify(error));
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error('Error updating pet data:', error);
    throw error;
  }
};

// Delete pet data
export const deletePetData = async (petId, userId) => {
  try {
    const { error } = await supabase
      .from('pets')
      .delete()
      .eq('id', petId)
      .eq('user_id', userId);
    
    if (error) {
      console.error('Detailed Supabase error:', JSON.stringify(error));
      throw error;
    }
    
    return true;
  } catch (error) {
    console.error('Error deleting pet data:', error);
    throw error;
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
  
  return () => {
    supabase.removeChannel(subscription);
  };
};

// Subscribe to a specific pet
export const subscribeToPet = (petId, userId, callback) => {
  const subscription = supabase
    .channel(`public:pets:id=eq.${petId}`)
    .on('postgres_changes', 
      { 
        event: '*', 
        schema: 'public', 
        table: 'pets',
        filter: `id=eq.${petId}` 
      }, 
      (payload) => {
        console.log('Pet subscription update:', payload);
        callback(payload);
      }
    )
    .subscribe();
  
  return () => {
    supabase.removeChannel(subscription);
  };
};

// Calculate age from birthday
export const calculateAgeFromBirthday = (birthday) => {
  if (!birthday) return null;
  
  const today = new Date();
  const birthDate = new Date(birthday);
  const yearsDiff = today.getFullYear() - birthDate.getFullYear();
  const monthsDiff = today.getMonth() - birthDate.getMonth();
  
  let years = yearsDiff;
  let months = monthsDiff;
  
  if (months < 0) {
    years--;
    months += 12;
  }
  
  // Format age string
  if (years === 0) {
    return `${months} month${months !== 1 ? 's' : ''}`;
  } else if (months === 0) {
    return `${years} year${years !== 1 ? 's' : ''}`;
  } else {
    return `${years} year${years !== 1 ? 's' : ''}, ${months} month${months !== 1 ? 's' : ''}`;
  }
};


// Calculate approximate birthday from age
export const calculateApproximateBirthday = (ageYears, ageMonths = 0) => {
  const today = new Date();
  const approximateBirthday = new Date(today);
  approximateBirthday.setFullYear(today.getFullYear() - ageYears);
  approximateBirthday.setMonth(today.getMonth() - ageMonths);
  return approximateBirthday.toISOString().split('T')[0]; // Return YYYY-MM-DD format
};