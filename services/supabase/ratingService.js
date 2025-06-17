// services/supabase/ratingService.js
import { supabase } from './config';

// Layer 1: Submit a basic rating (overall rating only)
export const submitVetRating = async (ratingData, currentUser) => {
  try {
    // Basic validation
    if (!ratingData.overall_rating || ratingData.overall_rating < 1 || ratingData.overall_rating > 5) {
      throw new Error('Overall rating must be between 1 and 5');
    }

    if (!ratingData.clinic_id || !currentUser?.sub) {
      throw new Error('Clinic ID and user authentication required');
    }

    // Layer 1: Simple rating submission
    const { data, error } = await supabase
      .from('veterinary_ratings')
      .insert({
        clinic_id: ratingData.clinic_id,
        user_id: currentUser.sub,
        overall_rating: ratingData.overall_rating,
        created_at: new Date().toISOString()
      })
      .select(`
        *,
        author:users!veterinary_ratings_user_id_fkey(
          id, name, picture
        ),
        clinic:veterinary_clinics(
          id, clinic_name
        )
      `)
      .single();

    if (error) {
      // Handle duplicate rating error
      if (error.code === '23505') {
        throw new Error('You have already rated this clinic');
      }
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error submitting rating:', error);
    throw error;
  }
};

// Layer 1: Get clinic's average rating and count
export const getClinicRatingSummary = async (clinicId) => {
  try {
    const { data, error } = await supabase
      .from('veterinary_ratings')
      .select('overall_rating')
      .eq('clinic_id', clinicId)
      .eq('is_deleted', false);

    if (error) throw error;

    const totalRatings = data.length;
    const averageRating = totalRatings > 0 
      ? data.reduce((sum, rating) => sum + rating.overall_rating, 0) / totalRatings
      : 0;

    return {
      average_rating: Number(averageRating.toFixed(1)),
      total_ratings: totalRatings,
      ratings_data: data
    };
  } catch (error) {
    console.error('Error getting clinic rating summary:', error);
    return {
      average_rating: 0,
      total_ratings: 0,
      ratings_data: []
    };
  }
};

// Layer 1: Get basic rating list for a clinic
export const getClinicRatings = async (clinicId, options = {}) => {
  try {
    const { limit = 20, offset = 0 } = options;

    const { data, error } = await supabase
      .from('veterinary_ratings')
      .select(`
        *,
        author:users!veterinary_ratings_user_id_fkey(
          id, name, picture
        )
      `)
      .eq('clinic_id', clinicId)
      .eq('is_deleted', false)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error getting clinic ratings:', error);
    return [];
  }
};

// Layer 1: Check if user has already rated a clinic
export const hasUserRatedClinic = async (userId, clinicId) => {
  try {
    const { data, error } = await supabase
      .from('veterinary_ratings')
      .select('id')
      .eq('user_id', userId)
      .eq('clinic_id', clinicId)
      .eq('is_deleted', false)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      throw error;
    }

    return !!data;
  } catch (error) {
    console.error('Error checking user rating:', error);
    return false;
  }
};

// Layer 1: Get user's rating for a specific clinic
export const getUserClinicRating = async (userId, clinicId) => {
  try {
    const { data, error } = await supabase
      .from('veterinary_ratings')
      .select('*')
      .eq('user_id', userId)
      .eq('clinic_id', clinicId)
      .eq('is_deleted', false)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    return data || null;
  } catch (error) {
    console.error('Error getting user clinic rating:', error);
    return null;
  }
};