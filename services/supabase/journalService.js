// services/supabase/journalService.js
import { supabase } from './config';

// Helper function to ensure pet_id is properly handled
const sanitizePetId = (petId) => {
  if (!petId || petId === '') return null;
  return parseInt(petId, 10);
};

// Get all journals for a user with optional filters
export const getJournalsByUserId = async (userId, filters = {}) => {
  try {
    let query = supabase
      .from('journals')
      .select(`
        *,
        pet:pets(id, name, species, image_url)
      `)
      .eq('user_id', userId)
      .order('journal_date', { ascending: false });

    // Apply filters
    if (filters.petId) {
      query = query.eq('pet_id', sanitizePetId(filters.petId));
    }

    if (filters.mood) {
      query = query.eq('mood', filters.mood);
    }

    if (filters.dateFrom) {
      query = query.gte('journal_date', filters.dateFrom);
    }

    if (filters.dateTo) {
      query = query.lte('journal_date', filters.dateTo);
    }

    if (filters.tags && filters.tags.length > 0) {
      query = query.overlaps('tags', filters.tags);
    }

    const { data, error } = await query;
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error getting journals by user ID:', error);
    return [];
  }
};

// Get a specific journal by ID
export const getJournalById = async (journalId, userId) => {
  try {
    const { data, error } = await supabase
      .from('journals')
      .select(`
        *,
        pet:pets(id, name, species, image_url)
      `)
      .eq('id', journalId)
      .eq('user_id', userId)
      .single();
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error getting journal by ID:', error);
    return null;
  }
};

// Save journal data
export const saveJournalData = async (journalData) => {
  try {
    const dataToInsert = {
      ...journalData,
      pet_id: sanitizePetId(journalData.pet_id), // Ensure proper type
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('journals')
      .insert(dataToInsert)
      .select(`
        *,
        pet:pets(id, name, species, image_url)
      `)
      .single();
    
    if (error) {
      console.error('Detailed Supabase error:', JSON.stringify(error));
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error('Error saving journal data:', error);
    throw error;
  }
};

// Update journal data
export const updateJournalData = async (journalId, userId, journalData) => {
  try {
    const dataToUpdate = {
      ...journalData,
      pet_id: sanitizePetId(journalData.pet_id), // Ensure proper type
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('journals')
      .update(dataToUpdate)
      .eq('id', journalId)
      .eq('user_id', userId)
      .select(`
        *,
        pet:pets(id, name, species, image_url)
      `)
      .single();
    
    if (error) {
      console.error('Detailed Supabase error:', JSON.stringify(error));
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error('Error updating journal data:', error);
    throw error;
  }
};

// Delete journal data
export const deleteJournalData = async (journalId, userId) => {
  try {
    const { error } = await supabase
      .from('journals')
      .delete()
      .eq('id', journalId)
      .eq('user_id', userId);
    
    if (error) {
      console.error('Detailed Supabase error:', JSON.stringify(error));
      throw error;
    }
    
    return true;
  } catch (error) {
    console.error('Error deleting journal data:', error);
    throw error;
  }
};

// Subscribe to journal data changes for a specific user
export const subscribeToJournals = (userId, callback) => {
  const subscription = supabase
    .channel(`public:journals:user_id=eq.${userId}`)
    .on('postgres_changes', 
      { 
        event: '*', 
        schema: 'public', 
        table: 'journals',
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

// Get journal statistics for user
export const getJournalStats = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('journals')
      .select('mood, created_at')
      .eq('user_id', userId);

    if (error) throw error;

    const stats = {
      total: data.length,
      thisMonth: 0,
      moodCounts: {
        happy: 0,
        worried: 0,
        proud: 0,
        sad: 0,
        tired: 0
      }
    };

    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    data.forEach(journal => {
      const journalDate = new Date(journal.created_at);
      if (journalDate.getMonth() === currentMonth && journalDate.getFullYear() === currentYear) {
        stats.thisMonth++;
      }
      if (journal.mood) {
        stats.moodCounts[journal.mood]++;
      }
    });

    return stats;
  } catch (error) {
    console.error('Error getting journal stats:', error);
    return {
      total: 0,
      thisMonth: 0,
      moodCounts: { happy: 0, worried: 0, proud: 0, sad: 0, tired: 0 }
    };
  }
};