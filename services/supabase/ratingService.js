// Layer 3: Enhanced fraud detection and logging
import { supabase } from './config';

// Layer 3: Log rating submission attempt
export const logRatingSubmission = async (userId, clinicId, wasSuccessful, failureReason = null, ipAddress = null, userAgent = null) => {
  try {
    const { error } = await supabase
      .from('rating_submission_logs')
      .insert({
        user_id: userId,
        clinic_id: clinicId,
        ip_address: ipAddress,
        user_agent: userAgent,
        was_successful: wasSuccessful,
        failure_reason: failureReason,
        attempt_timestamp: new Date().toISOString()
      });
    
    if (error) {
      console.error('Error logging submission:', error);
    }
  } catch (error) {
    console.error('Error logging submission:', error);
  }
};

// Layer 3: Check if user is eligible to rate (enhanced fraud detection)
export const checkRatingEligibility = async (userId, clinicId, ipAddress = null) => {
  try {
    // Check if user already rated this clinic
    const { data: existingRating } = await supabase
      .from('veterinary_ratings')
      .select('id')
      .eq('user_id', userId)
      .eq('clinic_id', clinicId)
      .eq('is_deleted', false)
      .single();
    
    if (existingRating) {
      return { eligible: false, reason: 'already_rated' };
    }

    // Layer 3: Check daily rate limiting (max 3 ratings per day)
    const today = new Date().toISOString().split('T')[0];
    const { data: todayRatings } = await supabase
      .from('veterinary_ratings')
      .select('id')
      .eq('user_id', userId)
      .gte('created_at', today)
      .eq('is_deleted', false);
    
    if (todayRatings && todayRatings.length >= 3) {
      return { eligible: false, reason: 'daily_limit_exceeded' };
    }

    // Layer 3: Check account age (require 7+ days)
    const { data: user } = await supabase
      .from('users')
      .select('created_at')
      .eq('auth_id', userId)
      .single();
    
    if (user) {
      const accountAge = Date.now() - new Date(user.created_at).getTime();
      const sevenDaysInMs = 7 * 24 * 60 * 60 * 1000;
      
      if (accountAge < sevenDaysInMs) {
        return { eligible: false, reason: 'account_too_new' };
      }
    }

    // Layer 3: Check IP-based rate limiting (max 5 attempts per IP per hour)
    if (ipAddress) {
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
      const { data: ipAttempts } = await supabase
        .from('rating_submission_logs')
        .select('id')
        .eq('ip_address', ipAddress)
        .gte('attempt_timestamp', oneHourAgo);
      
      if (ipAttempts && ipAttempts.length >= 5) {
        return { eligible: false, reason: 'ip_rate_limit_exceeded' };
      }
    }

    // Layer 3: Check for suspicious patterns (multiple failed attempts)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { data: recentFailures } = await supabase
      .from('rating_submission_logs')
      .select('id')
      .eq('user_id', userId)
      .eq('was_successful', false)
      .gte('attempt_timestamp', oneHourAgo);
    
    if (recentFailures && recentFailures.length >= 5) {
      return { eligible: false, reason: 'suspicious_activity' };
    }

    return { eligible: true };
  } catch (error) {
    console.error('Error checking rating eligibility:', error);
    return { eligible: false, reason: 'error' };
  }
};

// Layer 3: Enhanced rating submission with security logging
export const submitVetRating = async (ratingData, currentUser, ipAddress = null, userAgent = null) => {
  let loggedAttempt = false;
  
  try {
    // Layer 3: Check eligibility with enhanced fraud detection
    const eligibility = await checkRatingEligibility(currentUser?.sub, ratingData.clinic_id, ipAddress);
    if (!eligibility.eligible) {
      await logRatingSubmission(currentUser?.sub, ratingData.clinic_id, false, eligibility.reason, ipAddress, userAgent);
      loggedAttempt = true;
      
      const errorMessages = {
        'already_rated': 'You have already rated this clinic',
        'daily_limit_exceeded': 'You have reached the daily limit of 3 ratings',
        'account_too_new': 'Account must be at least 7 days old to submit ratings',
        'ip_rate_limit_exceeded': 'Too many attempts from this location. Please try again later',
        'suspicious_activity': 'Suspicious activity detected. Please contact support'
      };
      
      throw new Error(errorMessages[eligibility.reason] || 'Rating not allowed');
    }

    // Layer 2: Enhanced validation (from previous layer)
    if (!ratingData.overall_rating || ratingData.overall_rating < 1 || ratingData.overall_rating > 5) {
      throw new Error('Overall rating must be between 1 and 5');
    }

    if (!ratingData.clinic_id || !currentUser?.sub) {
      throw new Error('Clinic ID and user authentication required');
    }

    // Layer 3: Content validation and auto-flagging
    const flaggedContent = detectInappropriateContent(ratingData.review_content, ratingData.review_title);
    
    // Layer 2 & 3: Enhanced submission data
    const submissionData = {
      clinic_id: ratingData.clinic_id,
      user_id: currentUser.sub,
      overall_rating: ratingData.overall_rating,
      
      // Layer 2: Multi-dimensional ratings
      staff_friendliness: ratingData.staff_friendliness || null,
      cleanliness: ratingData.cleanliness || null,
      wait_time: ratingData.wait_time || null,
      value_for_money: ratingData.value_for_money || null,
      treatment_quality: ratingData.treatment_quality || null,
      
      // Layer 2: Review content
      review_title: ratingData.review_title?.trim() || null,
      review_content: ratingData.review_content?.trim() || null,
      visit_date: ratingData.visit_date || null,
      
      // Layer 3: Security fields
      ip_address: ipAddress,
      user_agent: userAgent,
      is_flagged: flaggedContent.shouldFlag,
      flag_reason: flaggedContent.reason,
      flagged_at: flaggedContent.shouldFlag ? new Date().toISOString() : null,
      
      created_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('veterinary_ratings')
      .insert(submissionData)
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
      if (!loggedAttempt) {
        await logRatingSubmission(currentUser?.sub, ratingData.clinic_id, false, error.message, ipAddress, userAgent);
      }
      
      if (error.code === '23505') {
        throw new Error('You have already rated this clinic');
      }
      throw error;
    }

    // Layer 3: Log successful submission
    await logRatingSubmission(currentUser?.sub, ratingData.clinic_id, true, null, ipAddress, userAgent);

    return data;
  } catch (error) {
    if (!loggedAttempt) {
      await logRatingSubmission(currentUser?.sub, ratingData.clinic_id, false, error.message, ipAddress, userAgent);
    }
    console.error('Error submitting rating:', error);
    throw error;
  }
};

// Layer 3: Content moderation - detect inappropriate content
const detectInappropriateContent = (content, title) => {
  const inappropriateKeywords = [
    'spam', 'fake', 'scam', 'worst', 'terrible', 'awful', 'horrible',
    'never go', 'avoid', 'run away', 'money grab', 'rip off'
  ];
  
  const textToCheck = `${title || ''} ${content || ''}`.toLowerCase();
  
  // Check for spam patterns
  const hasRepeatedChars = /(.)\1{4,}/.test(textToCheck); // 5+ repeated characters
  const hasAllCaps = content && content.length > 10 && content === content.toUpperCase();
  const hasInappropriateWords = inappropriateKeywords.some(keyword => textToCheck.includes(keyword));
  
  if (hasRepeatedChars || hasAllCaps || hasInappropriateWords) {
    return {
      shouldFlag: true,
      reason: 'Auto-flagged: Potential spam or inappropriate content'
    };
  }
  
  return { shouldFlag: false, reason: null };
};

// Layer 2: Enhanced clinic rating summary with dimensional averages
export const getClinicRatingSummary = async (clinicId) => {
  try {
    const { data, error } = await supabase
      .from('veterinary_ratings')
      .select('*')
      .eq('clinic_id', clinicId)
      .eq('is_deleted', false);

    if (error) throw error;

    const totalRatings = data.length;
    
    if (totalRatings === 0) {
      return {
        average_rating: 0,
        total_ratings: 0,
        ratings_data: [],
        dimensional_averages: {},
        rating_distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
      };
    }

    // Calculate overall average
    const averageRating = data.reduce((sum, rating) => sum + rating.overall_rating, 0) / totalRatings;

    // Layer 2: Calculate dimensional averages
    const calcDimensionAverage = (field) => {
      const values = data.filter(r => r[field]).map(r => r[field]);
      return values.length > 0 ? values.reduce((sum, val) => sum + val, 0) / values.length : 0;
    };

    const dimensionalAverages = {
      staff_friendliness: Number(calcDimensionAverage('staff_friendliness').toFixed(1)),
      cleanliness: Number(calcDimensionAverage('cleanliness').toFixed(1)),
      wait_time: Number(calcDimensionAverage('wait_time').toFixed(1)),
      value_for_money: Number(calcDimensionAverage('value_for_money').toFixed(1)),
      treatment_quality: Number(calcDimensionAverage('treatment_quality').toFixed(1))
    };

    // Layer 2: Calculate rating distribution
    const ratingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    data.forEach(rating => {
      ratingDistribution[rating.overall_rating]++;
    });

    return {
      average_rating: Number(averageRating.toFixed(1)),
      total_ratings: totalRatings,
      ratings_data: data,
      dimensional_averages: dimensionalAverages,
      rating_distribution: ratingDistribution
    };
  } catch (error) {
    console.error('Error getting clinic rating summary:', error);
    return {
      average_rating: 0,
      total_ratings: 0,
      ratings_data: [],
      dimensional_averages: {},
      rating_distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
    };
  }
};

// Layer 4: Enhanced clinic ratings with helpfulness sorting
export const getClinicRatings = async (clinicId, options = {}) => {
  try {
    const { 
      limit = 20, 
      offset = 0, 
      sortBy = 'created_at', // 'created_at', 'helpfulness', 'rating'
      sortOrder = 'desc' 
    } = options;

    let query = supabase
      .from('veterinary_ratings')
      .select(`
        *,
        author:users!veterinary_ratings_user_id_fkey(
          id, name, picture
        )
      `)
      .eq('clinic_id', clinicId)
      .eq('is_deleted', false);

    // Layer 4: Apply sorting
    switch (sortBy) {
      case 'helpfulness':
        query = query.order('helpful_count', { ascending: sortOrder === 'asc' })
                    .order('created_at', { ascending: false }); // Secondary sort
        break;
      case 'rating':
        query = query.order('overall_rating', { ascending: sortOrder === 'asc' })
                    .order('created_at', { ascending: false }); // Secondary sort
        break;
      default:
        query = query.order('created_at', { ascending: sortOrder === 'asc' });
    }

    const { data, error } = await query.range(offset, offset + limit - 1);

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

// Layer 4: Get user's rating history
export const getUserRatingHistory = async (userId, options = {}) => {
  try {
    const { limit = 20, offset = 0 } = options;

    const { data, error } = await supabase
      .from('veterinary_ratings')
      .select(`
        *,
        clinic:veterinary_clinics(
          id, clinic_name, full_address
        )
      `)
      .eq('user_id', userId)
      .eq('is_deleted', false)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error getting user rating history:', error);
    return [];
  }
};

// Layer 4: Update existing rating
export const updateUserRating = async (ratingId, userId, updateData, editReason = null) => {
  try {
    // Verify the rating belongs to the user
    const { data: existingRating } = await supabase
      .from('veterinary_ratings')
      .select('*')
      .eq('id', ratingId)
      .eq('user_id', userId)
      .eq('is_deleted', false)
      .single();

    if (!existingRating) {
      throw new Error('Rating not found or you do not have permission to edit it');
    }

    // Layer 4: Validate edit eligibility (e.g., not too many edits, not too old)
    if (existingRating.edit_count >= 3) {
      throw new Error('Maximum number of edits (3) reached for this rating');
    }

    const ratingAge = Date.now() - new Date(existingRating.created_at).getTime();
    const thirtyDaysInMs = 30 * 24 * 60 * 60 * 1000;
    if (ratingAge > thirtyDaysInMs) {
      throw new Error('Ratings can only be edited within 30 days of creation');
    }

    // Layer 2 & 4: Validate updated data
    if (updateData.overall_rating && (updateData.overall_rating < 1 || updateData.overall_rating > 5)) {
      throw new Error('Overall rating must be between 1 and 5');
    }

    if (updateData.review_title && updateData.review_title.length > 100) {
      throw new Error('Review title must be 100 characters or less');
    }

    if (updateData.review_content && updateData.review_content.length > 1000) {
      throw new Error('Review content must be 1000 characters or less');
    }

    // Prepare update data
    const dataToUpdate = {
      ...updateData,
      edit_count: existingRating.edit_count + 1,
      last_edited_at: new Date().toISOString(),
      edit_reason: editReason,
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('veterinary_ratings')
      .update(dataToUpdate)
      .eq('id', ratingId)
      .eq('user_id', userId)
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

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error updating rating:', error);
    throw error;
  }
};

// Layer 4: Delete user's own rating
export const deleteUserRating = async (ratingId, userId) => {
  try {
    // Verify ownership
    const { data: existingRating } = await supabase
      .from('veterinary_ratings')
      .select('user_id')
      .eq('id', ratingId)
      .eq('user_id', userId)
      .eq('is_deleted', false)
      .single();

    if (!existingRating) {
      throw new Error('Rating not found or you do not have permission to delete it');
    }

    // Soft delete
    const { data, error } = await supabase
      .from('veterinary_ratings')
      .update({
        is_deleted: true,
        updated_at: new Date().toISOString()
      })
      .eq('id', ratingId)
      .eq('user_id', userId)
      .select('*')
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error deleting rating:', error);
    throw error;
  }
};