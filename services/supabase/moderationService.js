// services/supabase/moderationService.js
import { supabase } from './config';

// Layer 3: Report a rating for inappropriate content
export const reportRating = async (ratingId, reporterUserId, reason, details = null) => {
  try {
    // Check if user already reported this rating
    const { data: existingReport } = await supabase
      .from('rating_reports')
      .select('id')
      .eq('rating_id', ratingId)
      .eq('reporter_user_id', reporterUserId)
      .single();
    
    if (existingReport) {
      throw new Error('You have already reported this rating');
    }

    const { data, error } = await supabase
      .from('rating_reports')
      .insert({
        rating_id: ratingId,
        reporter_user_id: reporterUserId,
        report_reason: reason,
        report_details: details,
        created_at: new Date().toISOString()
      })
      .select('*')
      .single();
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error reporting rating:', error);
    throw error;
  }
};

// Layer 3: Get pending reports for admin review
export const getPendingReports = async (options = {}) => {
  try {
    const { limit = 20, offset = 0 } = options;

    const { data, error } = await supabase
      .from('rating_reports')
      .select(`
        *,
        rating:veterinary_ratings(*),
        reporter:users!rating_reports_reporter_user_id_fkey(id, name, email)
      `)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error getting pending reports:', error);
    return [];
  }
};

// Layer 3: Admin action on reported content
export const reviewReport = async (reportId, adminUserId, action, adminNotes = null) => {
  try {
    const { data, error } = await supabase
      .from('rating_reports')
      .update({
        status: action, // 'reviewed', 'dismissed', 'action_taken'
        reviewed_by: adminUserId,
        reviewed_at: new Date().toISOString(),
        admin_notes: adminNotes
      })
      .eq('id', reportId)
      .select('*, rating:veterinary_ratings(*)')
      .single();
    
    if (error) throw error;

    // If action taken, also flag/delete the rating
    if (action === 'action_taken' && data.rating) {
      await supabase
        .from('veterinary_ratings')
        .update({
          is_flagged: true,
          flagged_at: new Date().toISOString(),
          flagged_by: adminUserId,
          flag_reason: `Admin action: ${adminNotes || 'Inappropriate content'}`
        })
        .eq('id', data.rating.id);
    }
    
    return data;
  } catch (error) {
    console.error('Error reviewing report:', error);
    throw error;
  }
};

// Layer 3: Get flagged ratings for admin review
export const getFlaggedRatings = async (options = {}) => {
  try {
    const { limit = 20, offset = 0 } = options;

    const { data, error } = await supabase
      .from('veterinary_ratings')
      .select(`
        *,
        author:users!veterinary_ratings_user_id_fkey(id, name, email),
        clinic:veterinary_clinics(id, clinic_name)
      `)
      .eq('is_flagged', true)
      .eq('is_deleted', false)
      .order('flagged_at', { ascending: false })
      .range(offset, offset + limit - 1);
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error getting flagged ratings:', error);
    return [];
  }
};

// Layer 3: Admin unflag rating
export const unflagRating = async (ratingId, adminUserId, reason = null) => {
  try {
    const { data, error } = await supabase
      .from('veterinary_ratings')
      .update({
        is_flagged: false,
        flagged_at: null,
        flagged_by: null,
        flag_reason: null
      })
      .eq('id', ratingId)
      .select('*')
      .single();
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error unflagging rating:', error);
    throw error;
  }
};

// Layer 3: Soft delete rating
export const softDeleteRating = async (ratingId, adminUserId, reason = null) => {
  try {
    const { data, error } = await supabase
      .from('veterinary_ratings')
      .update({
        is_deleted: true,
        updated_at: new Date().toISOString()
      })
      .eq('id', ratingId)
      .select('*')
      .single();
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error deleting rating:', error);
    throw error;
  }
};