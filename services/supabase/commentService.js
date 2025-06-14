// services/supabase/commentService.js
import { supabase } from './config';

const MAX_COMMENT_DEPTH = 3; // Prevent infinite nesting

// Helper function to sanitize comment data
const sanitizeCommentData = (commentData) => {
  return {
    ...commentData,
    content: commentData.content?.trim(),
  };
};

// Get comments for a specific post
export const getPostComments = async (postId, options = {}) => {
  try {
    const { limit = 50, offset = 0 } = options;

    const { data, error } = await supabase
      .from('comments')
      .select(`
        *,
        author:users!comments_user_id_fkey(
          id,
          auth_id,
          name,
          email,
          picture
        ),
        reactions_count:reactions(count),
        replies:comments!parent_comment_id(
          *,
          author:users!comments_user_id_fkey(
            id,
            auth_id,
            name,
            email,
            picture
          ),
          reactions_count:reactions(count)
        )
      `)
      .eq('post_id', postId)
      .eq('is_deleted', false)
      .is('parent_comment_id', null) // Only get top-level comments
      .order('created_at', { ascending: true })
      .range(offset, offset + limit - 1);
    
    if (error) throw error;
    
    // Process nested replies
    const processedComments = (data || []).map(comment => ({
      ...comment,
      replies: (comment.replies || [])
        .filter(reply => !reply.is_deleted)
        .sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
    }));
    
    return processedComments;
  } catch (error) {
    console.error('Error getting post comments:', error);
    return [];
  }
};

// Get a single comment by ID
export const getCommentById = async (commentId) => {
  try {
    const { data, error } = await supabase
      .from('comments')
      .select(`
        *,
        author:users!comments_user_id_fkey(
          id,
          auth_id,
          name,
          email,
          picture
        ),
        reactions_count:reactions(count),
        post:posts(id, title, user_id)
      `)
      .eq('id', commentId)
      .eq('is_deleted', false)
      .single();
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error getting comment by ID:', error);
    return null;
  }
};

// Create a new comment
export const createComment = async (commentData) => {
  try {
    const sanitizedData = sanitizeCommentData(commentData);
    
    // Validate required fields
    if (!sanitizedData.content || !sanitizedData.post_id || !sanitizedData.user_id) {
      throw new Error('Content, post_id, and user_id are required');
    }

    // Check comment depth if it's a reply
    let depth = 0;
    if (sanitizedData.parent_comment_id) {
      const parentComment = await getCommentById(sanitizedData.parent_comment_id);
      if (!parentComment) {
        throw new Error('Parent comment not found');
      }
      
      depth = (parentComment.comment_depth || 0) + 1;
      
      if (depth > MAX_COMMENT_DEPTH) {
        throw new Error(`Maximum comment depth of ${MAX_COMMENT_DEPTH} exceeded`);
      }
    }

    const dataToInsert = {
      ...sanitizedData,
      comment_depth: depth,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('comments')
      .insert(dataToInsert)
      .select(`
        *,
        author:users!comments_user_id_fkey(
          id,
          auth_id,
          name,
          email,
          picture
        ),
        reactions_count:reactions(count),
        post:posts(id, title)
      `)
      .single();
    
    if (error) {
      console.error('Detailed Supabase error:', error);
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error('Error creating comment:', error);
    throw error;
  }
};

// Update a comment
export const updateComment = async (commentId, userId, updateData) => {
  try {
    const sanitizedData = sanitizeCommentData(updateData);
    
    // First get current edit_count
    const { data: currentComment, error: fetchError } = await supabase
      .from('comments')
      .select('edit_count')
      .eq('id', commentId)
      .eq('user_id', userId)
      .eq('is_deleted', false)
      .single();

    if (fetchError) {
      console.error('Error fetching current comment:', fetchError);
      throw fetchError;
    }

    // Only allow content updates
    const dataToUpdate = {
      content: sanitizedData.content,
      updated_at: new Date().toISOString(),
      is_edited: true,
      edit_count: (currentComment.edit_count || 0) + 1,
    };

    const { data, error } = await supabase
      .from('comments')
      .update(dataToUpdate)
      .eq('id', commentId)
      .eq('user_id', userId) // Ensure only author can update
      .eq('is_deleted', false)
      .select(`
        *,
        author:users!comments_user_id_fkey(
          id,
          auth_id,
          name,
          email,
          picture
        ),
        reactions_count:reactions(count)
      `)
      .single();
    
    if (error) {
      console.error('Detailed Supabase error:', error);
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error('Error updating comment:', error);
    throw error;
  }
};

// Soft delete a comment
export const deleteComment = async (commentId, userId) => {
  try {
    const { error } = await supabase
      .from('comments')
      .update({ 
        is_deleted: true,
        updated_at: new Date().toISOString()
      })
      .eq('id', commentId)
      .eq('user_id', userId) // Ensure only author can delete
      .eq('is_deleted', false);
    
    if (error) {
      console.error('Detailed Supabase error:', error);
      throw error;
    }
    
    return true;
  } catch (error) {
    console.error('Error deleting comment:', error);
    throw error;
  }
};

// Get comments by a specific user
export const getUserComments = async (userId, options = {}) => {
  try {
    const { limit = 20, offset = 0 } = options;

    const { data, error } = await supabase
      .from('comments')
      .select(`
        *,
        post:posts!inner(id, title, visibility),
        author:users!comments_user_id_fkey(
          id,
          auth_id,
          name,
          email,
          picture
        ),
        reactions_count:reactions(count)
      `)
      .eq('user_id', userId)
      .eq('is_deleted', false)
      .eq('post.visibility', 'public') // Only show comments on public posts
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error getting user comments:', error);
    return [];
  }
};

// Get replies to a specific comment
export const getCommentReplies = async (parentCommentId, options = {}) => {
  try {
    const { limit = 20, offset = 0 } = options;

    const { data, error } = await supabase
      .from('comments')
      .select(`
        *,
        author:users!comments_user_id_fkey(
          id,
          auth_id,
          name,
          email,
          picture
        ),
        reactions_count:reactions(count)
      `)
      .eq('parent_comment_id', parentCommentId)
      .eq('is_deleted', false)
      .order('created_at', { ascending: true })
      .range(offset, offset + limit - 1);
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error getting comment replies:', error);
    return [];
  }
};

// Get recent comments on user's posts
export const getCommentsOnUserPosts = async (userId, options = {}) => {
  try {
    const { limit = 20, offset = 0 } = options;

    const { data, error } = await supabase
      .from('comments')
      .select(`
        *,
        author:users!comments_user_id_fkey(
          id,
          auth_id,
          name,
          email,
          picture
        ),
        post:posts!inner(id, title, user_id),
        reactions_count:reactions(count)
      `)
      .eq('post.user_id', userId)
      .eq('is_deleted', false)
      .neq('user_id', userId) // Exclude user's own comments
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error getting comments on user posts:', error);
    return [];
  }
};

// Get threaded comments (with full reply chains)
export const getThreadedComments = async (postId, options = {}) => {
  try {
    const { limit = 50, offset = 0 } = options;

    // Get all comments for the post (not just top-level)
    const { data, error } = await supabase
      .from('comments')
      .select(`
        *,
        author:users!comments_user_id_fkey(
          id,
          auth_id,
          name,
          email,
          picture
        ),
        reactions_count:reactions(count)
      `)
      .eq('post_id', postId)
      .eq('is_deleted', false)
      .order('created_at', { ascending: true });
    
    if (error) throw error;
    
    // Build comment tree
    const commentMap = new Map();
    const rootComments = [];
    
    // First pass: create all comment objects
    (data || []).forEach(comment => {
      commentMap.set(comment.id, { ...comment, replies: [] });
    });
    
    // Second pass: build the tree structure
    (data || []).forEach(comment => {
      if (comment.parent_comment_id && commentMap.has(comment.parent_comment_id)) {
        // This is a reply
        commentMap.get(comment.parent_comment_id).replies.push(commentMap.get(comment.id));
      } else {
        // This is a top-level comment
        rootComments.push(commentMap.get(comment.id));
      }
    });
    
    return rootComments.slice(offset, offset + limit);
  } catch (error) {
    console.error('Error getting threaded comments:', error);
    return [];
  }
};

// Subscribe to comments for a specific post
export const subscribeToPostComments = (postId, callback) => {
  const subscription = supabase
    .channel(`comments:post:${postId}`)
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'comments',
      filter: `post_id=eq.${postId}`,
    }, callback)
    .subscribe();

  return () => supabase.removeChannel(subscription);
};

// Subscribe to replies for a specific comment
export const subscribeToCommentReplies = (parentCommentId, callback) => {
  const subscription = supabase
    .channel(`replies:comment:${parentCommentId}`)
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'comments',
      filter: `parent_comment_id=eq.${parentCommentId}`,
    }, callback)
    .subscribe();

  return () => supabase.removeChannel(subscription);
};

// Subscribe to comments on user's posts (for notifications)
export const subscribeToUserPostComments = (userId, callback) => {
  const subscription = supabase
    .channel(`user_post_comments:${userId}`)
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'comments',
    }, async (payload) => {
      // Check if this comment is on one of the user's posts
      const { data: post } = await supabase
        .from('posts')
        .select('user_id')
        .eq('id', payload.new.post_id)
        .single();
      
      if (post && post.user_id === userId && payload.new.user_id !== userId) {
        callback(payload);
      }
    })
    .subscribe();

  return () => supabase.removeChannel(subscription);
};

// Get comment statistics for user
export const getUserCommentStats = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('comments')
      .select('created_at, comment_depth')
      .eq('user_id', userId)
      .eq('is_deleted', false);

    if (error) throw error;

    const stats = {
      total: data.length,
      thisMonth: 0,
      depthCounts: {
        0: 0, // Top-level comments
        1: 0, // First-level replies
        2: 0, // Second-level replies
        3: 0, // Third-level replies
      }
    };

    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    data.forEach(comment => {
      const commentDate = new Date(comment.created_at);
      if (commentDate.getMonth() === currentMonth && commentDate.getFullYear() === currentYear) {
        stats.thisMonth++;
      }
      
      const depth = comment.comment_depth || 0;
      if (stats.depthCounts.hasOwnProperty(depth)) {
        stats.depthCounts[depth]++;
      }
    });

    return stats;
  } catch (error) {
    console.error('Error getting user comment stats:', error);
    return {
      total: 0,
      thisMonth: 0,
      depthCounts: { 0: 0, 1: 0, 2: 0, 3: 0 }
    };
  }
};

// Get comment count for a specific post
export const getPostCommentCount = async (postId) => {
  try {
    const { count, error } = await supabase
      .from('comments')
      .select('*', { count: 'exact', head: true })
      .eq('post_id', postId)
      .eq('is_deleted', false);
    
    if (error) throw error;
    return count || 0;
  } catch (error) {
    console.error('Error getting post comment count:', error);
    return 0;
  }
};

// Get recent activity on user's comments (replies to their comments)
export const getCommentActivity = async (userId, options = {}) => {
  try {
    const { limit = 20, offset = 0 } = options;

    // Get comments that are replies to the user's comments
    const { data, error } = await supabase
      .from('comments')
      .select(`
        *,
        author:users!comments_user_id_fkey(
          id,
          auth_id,
          name,
          email,
          picture
        ),
        parent_comment:comments!parent_comment_id(
          id,
          user_id,
          content
        ),
        post:posts(id, title),
        reactions_count:reactions(count)
      `)
      .not('parent_comment_id', 'is', null)
      .eq('parent_comment.user_id', userId)
      .eq('is_deleted', false)
      .neq('user_id', userId) // Exclude user's own replies
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error getting comment activity:', error);
    return [];
  }
};

// Get comment counts for multiple posts (batch operation - more efficient)
export const getBatchPostCommentCounts = async (postIds) => {
  try {
    if (!postIds || postIds.length === 0) return {};

    const { data, error } = await supabase
      .from('comments')
      .select('post_id')
      .in('post_id', postIds)
      .eq('is_deleted', false);
    
    if (error) throw error;
    
    // Count comments for each post
    const commentCounts = {};
    postIds.forEach(postId => {
      commentCounts[postId] = 0;
    });
    
    (data || []).forEach(comment => {
      commentCounts[comment.post_id] = (commentCounts[comment.post_id] || 0) + 1;
    });
    
    return commentCounts;
  } catch (error) {
    console.error('Error getting batch comment counts:', error);
    return {};
  }
};