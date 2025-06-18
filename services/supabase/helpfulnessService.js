// services/supabase/helpfulnessService.js
import { supabase } from './config';

// Layer 4: Vote on rating helpfulness
export const voteOnRatingHelpfulness = async (ratingId, userId, isHelpful) => {
  try {
    // Check if user already voted on this rating
    const { data: existingVote } = await supabase
      .from('rating_helpfulness')
      .select('*')
      .eq('rating_id', ratingId)
      .eq('user_id', userId)
      .single();

    if (existingVote) {
      // Update existing vote if different
      if (existingVote.is_helpful !== isHelpful) {
        const { data, error } = await supabase
          .from('rating_helpfulness')
          .update({
            is_helpful: isHelpful,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingVote.id)
          .select('*')
          .single();

        if (error) throw error;
        return { data, action: 'updated' };
      } else {
        // Same vote - remove it (toggle off)
        const { error } = await supabase
          .from('rating_helpfulness')
          .delete()
          .eq('id', existingVote.id);

        if (error) throw error;
        return { data: null, action: 'removed' };
      }
    } else {
      // Create new vote
      const { data, error } = await supabase
        .from('rating_helpfulness')
        .insert({
          rating_id: ratingId,
          user_id: userId,
          is_helpful: isHelpful,
          created_at: new Date().toISOString()
        })
        .select('*')
        .single();

      if (error) throw error;
      return { data, action: 'created' };
    }
  } catch (error) {
    console.error('Error voting on helpfulness:', error);
    throw error;
  }
};

// Layer 4: Get user's helpfulness votes for multiple ratings
export const getUserHelpfulnessVotes = async (userId, ratingIds) => {
  try {
    if (!ratingIds || ratingIds.length === 0) return {};

    const { data, error } = await supabase
      .from('rating_helpfulness')
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
    console.error('Error getting user helpfulness votes:', error);
    return {};
  }
};

// Layer 4: Get helpfulness statistics for a rating
export const getRatingHelpfulnessStats = async (ratingId) => {
  try {
    const { data, error } = await supabase
      .from('rating_helpfulness')
      .select('is_helpful')
      .eq('rating_id', ratingId);

    if (error) throw error;

    const helpful = (data || []).filter(vote => vote.is_helpful).length;
    const notHelpful = (data || []).filter(vote => !vote.is_helpful).length;

    return {
      helpful_count: helpful,
      not_helpful_count: notHelpful,
      total_votes: helpful + notHelpful
    };
  } catch (error) {
    console.error('Error getting helpfulness stats:', error);
    return { helpful_count: 0, not_helpful_count: 0, total_votes: 0 };
  }
};