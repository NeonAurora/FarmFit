// services/supabase/practitionerRatingService.js
import { supabase } from './config';

// ============ MAIN RATING FUNCTIONS ============

// Check if user has already rated a practitioner
export const hasUserRatedPractitioner = async (userId, practitionerId) => {
  try {
    const { data, error } = await supabase
      .from('practitioner_ratings')
      .select('id')
      .eq('user_id', userId)
      .eq('practitioner_id', practitionerId)
      .eq('is_deleted', false)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    return !!data;
  } catch (error) {
    console.error('Error checking user practitioner rating:', error);
    return false;
  }
};

// Get user's rating for a specific practitioner
export const getUserPractitionerRating = async (userId, practitionerId) => {
  try {
    const { data, error } = await supabase
      .from('practitioner_ratings')
      .select('*')
      .eq('user_id', userId)
      .eq('practitioner_id', practitionerId)
      .eq('is_deleted', false)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    return data || null;
  } catch (error) {
    console.error('Error getting user practitioner rating:', error);
    return null;
  }
};

// Submit practitioner rating
export const submitPractitionerRating = async (ratingData, currentUser, ipAddress = null, userAgent = null) => {
  let loggedAttempt = false;
  
  try {
    // Check eligibility with fraud detection
    const eligibility = await checkPractitionerRatingEligibility(currentUser?.sub, ratingData.practitioner_id, ipAddress);
    if (!eligibility.eligible) {
      await logPractitionerRatingSubmission(currentUser?.sub, ratingData.practitioner_id, false, eligibility.reason, ipAddress, userAgent);
      loggedAttempt = true;
      
      const errorMessages = {
        'already_rated': 'You have already rated this practitioner',
        'daily_limit_exceeded': 'You have reached the daily limit of 3 ratings',
        'account_too_new': 'Account must be at least 7 days old to submit ratings',
        'ip_rate_limit_exceeded': 'Too many attempts from this location. Please try again later',
        'suspicious_activity': 'Suspicious activity detected. Please try again later.'
      };
      
      throw new Error(errorMessages[eligibility.reason] || 'Rating submission not allowed');
    }

    // Content moderation
    const contentCheck = detectInappropriateContent(ratingData.review_content, ratingData.review_title);
    
    const submissionData = {
      ...ratingData,
      user_id: currentUser.sub,
      ip_address: ipAddress,
      user_agent: userAgent,
      is_flagged: contentCheck.shouldFlag,
      flag_reason: contentCheck.reason,
      flagged_at: contentCheck.shouldFlag ? new Date().toISOString() : null,
      created_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('practitioner_ratings')
      .insert(submissionData)
      .select(`
        *,
        author:users!practitioner_ratings_user_id_fkey(
          id, name, picture
        ),
        practitioner:practitioner_profiles(
          id, full_name
        )
      `)
      .single();

    if (error) {
      if (!loggedAttempt) {
        await logPractitionerRatingSubmission(currentUser?.sub, ratingData.practitioner_id, false, error.message, ipAddress, userAgent);
      }
      
      if (error.code === '23505') {
        throw new Error('You have already rated this practitioner');
      }
      throw error;
    }

    // Log successful submission
    await logPractitionerRatingSubmission(currentUser?.sub, ratingData.practitioner_id, true, null, ipAddress, userAgent);

    return data;
  } catch (error) {
    if (!loggedAttempt) {
      await logPractitionerRatingSubmission(currentUser?.sub, ratingData.practitioner_id, false, error.message, ipAddress, userAgent);
    }
    console.error('Error submitting practitioner rating:', error);
    throw error;
  }
};

// Get practitioner rating summary
export const getPractitionerRatingSummary = async (practitionerId) => {
  try {
    const { data, error } = await supabase
      .from('practitioner_ratings')
      .select('*')
      .eq('practitioner_id', practitionerId)
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

    // Calculate dimensional averages (practitioner-specific dimensions)
    const calcDimensionAverage = (field) => {
      const values = data.filter(r => r[field]).map(r => r[field]);
      return values.length > 0 ? values.reduce((sum, val) => sum + val, 0) / values.length : 0;
    };

    const dimensionalAverages = {
      communication_skills: Number(calcDimensionAverage('communication_skills').toFixed(1)),
      knowledge_expertise: Number(calcDimensionAverage('knowledge_expertise').toFixed(1)),
      consultation_quality: Number(calcDimensionAverage('consultation_quality').toFixed(1)),
      value_for_money: Number(calcDimensionAverage('value_for_money').toFixed(1)),
      punctuality: Number(calcDimensionAverage('punctuality').toFixed(1))
    };

    // Calculate rating distribution
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
    console.error('Error getting practitioner rating summary:', error);
    return {
      average_rating: 0,
      total_ratings: 0,
      ratings_data: [],
      dimensional_averages: {},
      rating_distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
    };
  }
};

// Get practitioner ratings with sorting
export const getPractitionerRatings = async (practitionerId, options = {}) => {
  try {
    const { 
      limit = 20, 
      offset = 0, 
      sortBy = 'created_at',
      sortOrder = 'desc' 
    } = options;

    let query = supabase
      .from('practitioner_ratings')
      .select(`
        *,
        author:users!practitioner_ratings_user_id_fkey(
          id, name, picture
        )
      `)
      .eq('practitioner_id', practitionerId)
      .eq('is_deleted', false);

    // Apply sorting
    switch (sortBy) {
      case 'helpfulness':
        query = query.order('helpful_count', { ascending: sortOrder === 'asc' })
                    .order('created_at', { ascending: false });
        break;
      case 'rating':
        query = query.order('overall_rating', { ascending: sortOrder === 'asc' })
                    .order('created_at', { ascending: false });
        break;
      default:
        query = query.order('created_at', { ascending: sortOrder === 'asc' });
    }

    const { data, error } = await query.range(offset, offset + limit - 1);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error getting practitioner ratings:', error);
    return [];
  }
};

// Update practitioner rating
export const updatePractitionerRating = async (ratingId, userId, updateData, editReason = null) => {
  try {
    // Verify ownership and edit eligibility
    const { data: existingRating } = await supabase
      .from('practitioner_ratings')
      .select('user_id, edit_count, created_at')
      .eq('id', ratingId)
      .eq('user_id', userId)
      .eq('is_deleted', false)
      .single();

    if (!existingRating) {
      throw new Error('Rating not found or you do not have permission to edit it');
    }

    if (existingRating.edit_count >= 3) {
      throw new Error('Maximum edit limit reached (3 edits allowed)');
    }

    const { data, error } = await supabase
      .from('practitioner_ratings')
      .update({
        ...updateData,
        edit_count: existingRating.edit_count + 1,
        last_edited_at: new Date().toISOString(),
        edit_reason: editReason,
        updated_at: new Date().toISOString()
      })
      .eq('id', ratingId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error updating practitioner rating:', error);
    throw error;
  }
};

// Delete practitioner rating (soft delete)
export const deletePractitionerRating = async (ratingId, userId) => {
  try {
    // Verify ownership
    const { data: existingRating } = await supabase
      .from('practitioner_ratings')
      .select('user_id')
      .eq('id', ratingId)
      .eq('user_id', userId)
      .eq('is_deleted', false)
      .single();

    if (!existingRating) {
      throw new Error('Rating not found or you do not have permission to delete it');
    }

    const { error } = await supabase
      .from('practitioner_ratings')
      .update({
        is_deleted: true,
        updated_at: new Date().toISOString()
      })
      .eq('id', ratingId)
      .eq('user_id', userId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error deleting practitioner rating:', error);
    throw error;
  }
};

// Get user's rating history for practitioners
export const getUserPractitionerRatingHistory = async (userId, options = {}) => {
  try {
    const { limit = 20, offset = 0 } = options;

    const { data, error } = await supabase
      .from('practitioner_ratings')
      .select(`
        *,
        practitioner:practitioner_profiles(
          id, full_name, designation, district
        )
      `)
      .eq('user_id', userId)
      .eq('is_deleted', false)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error getting user practitioner rating history:', error);
    return [];
  }
};

// ============ HELPFULNESS VOTING ============

// Vote on rating helpfulness
export const voteOnPractitionerRatingHelpfulness = async (ratingId, userId, isHelpful) => {
  try {
    // Check if user has already voted
    const { data: existingVote } = await supabase
      .from('practitioner_rating_helpfulness')
      .select('*')
      .eq('rating_id', ratingId)
      .eq('user_id', userId)
      .single();

    if (existingVote) {
      if (existingVote.is_helpful === isHelpful) {
        // Same vote - remove it
        const { error } = await supabase
          .from('practitioner_rating_helpfulness')
          .delete()
          .eq('rating_id', ratingId)
          .eq('user_id', userId);

        if (error) throw error;
        return { action: 'removed' };
      } else {
        // Different vote - update it
        const { error } = await supabase
          .from('practitioner_rating_helpfulness')
          .update({
            is_helpful: isHelpful,
            updated_at: new Date().toISOString()
          })
          .eq('rating_id', ratingId)
          .eq('user_id', userId);

        if (error) throw error;
        return { action: 'updated' };
      }
    } else {
      // New vote - create it
      const { error } = await supabase
        .from('practitioner_rating_helpfulness')
        .insert({
          rating_id: ratingId,
          user_id: userId,
          is_helpful: isHelpful
        });

      if (error) throw error;
      return { action: 'created' };
    }
  } catch (error) {
    console.error('Error voting on practitioner rating helpfulness:', error);
    throw error;
  }
};

// Get user's helpfulness votes for multiple ratings
export const getUserPractitionerHelpfulnessVotes = async (userId, ratingIds) => {
  try {
    const { data, error } = await supabase
      .from('practitioner_rating_helpfulness')
      .select('rating_id, is_helpful')
      .eq('user_id', userId)
      .in('rating_id', ratingIds);

    if (error) throw error;

    // Convert to object for easy lookup
    const votes = {};
    (data || []).forEach(vote => {
      votes[vote.rating_id] = vote.is_helpful;
    });

    return votes;
  } catch (error) {
    console.error('Error getting user practitioner helpfulness votes:', error);
    return {};
  }
};

// ============ REPORTING & MODERATION ============

// Report a practitioner rating
export const reportPractitionerRating = async (ratingId, reporterUserId, reportReason, reportDetails = null) => {
  try {
    // Check if user has already reported this rating
    const { data: existingReport } = await supabase
      .from('practitioner_rating_reports')
      .select('id')
      .eq('rating_id', ratingId)
      .eq('reporter_user_id', reporterUserId)
      .single();

    if (existingReport) {
      throw new Error('You have already reported this rating');
    }

    const { data, error } = await supabase
      .from('practitioner_rating_reports')
      .insert({
        rating_id: ratingId,
        reporter_user_id: reporterUserId,
        report_reason: reportReason,
        report_details: reportDetails,
        status: 'pending'
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error reporting practitioner rating:', error);
    throw error;
  }
};

// ============ HELPER FUNCTIONS ============

// Check if user is eligible to rate (fraud detection)
const checkPractitionerRatingEligibility = async (userId, practitionerId, ipAddress = null) => {
  try {
    // Check if user already rated this practitioner
    const { data: existingRating } = await supabase
      .from('practitioner_ratings')
      .select('id')
      .eq('user_id', userId)
      .eq('practitioner_id', practitionerId)
      .eq('is_deleted', false)
      .single();
    
    if (existingRating) {
      return { eligible: false, reason: 'already_rated' };
    }

    // Check daily rate limiting (max 3 ratings per day)
    const today = new Date().toISOString().split('T')[0];
    const { data: todayRatings } = await supabase
      .from('practitioner_ratings')
      .select('id')
      .eq('user_id', userId)
      .gte('created_at', today)
      .eq('is_deleted', false);
    
    if (todayRatings && todayRatings.length >= 3) {
      return { eligible: false, reason: 'daily_limit_exceeded' };
    }

    // Check account age (require 7+ days)
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

    // Check IP-based rate limiting (max 5 attempts per IP per hour)
    if (ipAddress) {
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
      const { data: ipAttempts } = await supabase
        .from('practitioner_rating_submission_logs')
        .select('id')
        .eq('ip_address', ipAddress)
        .gte('attempt_timestamp', oneHourAgo);
      
      if (ipAttempts && ipAttempts.length >= 5) {
        return { eligible: false, reason: 'ip_rate_limit_exceeded' };
      }
    }

    // Check for suspicious patterns (multiple failed attempts)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { data: recentFailures } = await supabase
      .from('practitioner_rating_submission_logs')
      .select('id')
      .eq('user_id', userId)
      .eq('was_successful', false)
      .gte('attempt_timestamp', oneHourAgo);
    
    if (recentFailures && recentFailures.length >= 5) {
      return { eligible: false, reason: 'suspicious_activity' };
    }

    return { eligible: true };
  } catch (error) {
    console.error('Error checking practitioner rating eligibility:', error);
    return { eligible: false, reason: 'error' };
  }
};

// Log rating submission attempt
const logPractitionerRatingSubmission = async (userId, practitionerId, wasSuccessful, failureReason = null, ipAddress = null, userAgent = null) => {
  try {
    const { error } = await supabase
      .from('practitioner_rating_submission_logs')
      .insert({
        user_id: userId,
        practitioner_id: practitionerId,
        ip_address: ipAddress,
        user_agent: userAgent,
        was_successful: wasSuccessful,
        failure_reason: failureReason,
        attempt_timestamp: new Date().toISOString()
      });
    
    if (error) {
      console.error('Error logging practitioner rating submission:', error);
    }
  } catch (error) {
    console.error('Error logging practitioner rating submission:', error);
  }
};

// Content moderation - detect inappropriate content
const detectInappropriateContent = (content, title) => {
  const inappropriateKeywords = [
    'spam', 'fake', 'scam', 'worst', 'terrible', 'awful', 'horrible',
    'never go', 'avoid', 'run away', 'money grab', 'rip off', 'fraud',
    'incompetent', 'dangerous', 'kill', 'die', 'death'
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