// services/supabase/postService.js
import { supabase } from './config';

// Helper function to sanitize user input
const sanitizePostData = (postData) => {
  return {
    ...postData,
    title: postData.title?.trim(),
    content: postData.content?.trim(),
    post_type: postData.post_type || 'text',
    visibility: postData.visibility || 'public',
  };
};

// Get posts for feed with visibility rules
export const getPostsFeed = async (currentUserId, options = {}) => {
  try {
    const { 
      limit = 20, 
      offset = 0, 
      visibility = 'all',
      postType = 'all',
      userId = null 
    } = options;

    let query = supabase
      .from('posts')
      .select(`
        *,
        author:users!posts_user_id_fkey(
          id,
          auth_id,
          name,
          email,
          picture
        ),
        pet:pets(id, name, species, image_url),
        comments_count:comments(count),
        reactions_count:reactions(count)
      `)
      .eq('is_deleted', false)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // Filter by specific user if provided
    if (userId) {
      query = query.eq('user_id', userId);
    }

    // Filter by post type
    if (postType !== 'all') {
      query = query.eq('post_type', postType);
    }

    // Handle visibility filtering
    if (!userId || userId === currentUserId) {
      // Own posts or viewing specific user - show based on visibility filter
      if (visibility !== 'all') {
        query = query.eq('visibility', visibility);
      }
    } else {
      // Viewing someone else's posts - only show public and connections posts
      query = query.in('visibility', ['public', 'connections']);
    }

    const { data, error } = await query;
    
    if (error) throw error;

    // If viewing others' posts with 'connections' visibility, 
    // need to verify actual connection status
    if (userId && userId !== currentUserId) {
      // TODO: Import and use connection service to filter 'connections' posts
      // For now, return all public posts
      return (data || []).filter(post => post.visibility === 'public');
    }

    return data || [];
  } catch (error) {
    console.error('Error getting posts feed:', error);
    return [];
  }
};

// Get a single post by ID with visibility check
export const getPostById = async (postId, currentUserId) => {
  try {
    const { data, error } = await supabase
      .from('posts')
      .select(`
        *,
        author:users!posts_user_id_fkey(
          id,
          auth_id,
          name,
          email,
          picture
        ),
        pet:pets(id, name, species, image_url),
        comments_count:comments(count),
        reactions_count:reactions(count)
      `)
      .eq('id', postId)
      .eq('is_deleted', false)
      .single();
    
    if (error) throw error;
    
    // Check visibility permissions
    if (data.user_id !== currentUserId) {
      if (data.visibility === 'private') {
        return null; // Not authorized
      }
      if (data.visibility === 'connections') {
        // TODO: Check if users are connected using areUsersConnected
        // For now, deny access
        return null;
      }
    }
    
    return data;
  } catch (error) {
    console.error('Error getting post by ID:', error);
    return null;
  }
};

// Create a new post
export const createPost = async (postData) => {
  try {
    const sanitizedData = sanitizePostData(postData);
    
    // Validate required fields
    if (!sanitizedData.title || !sanitizedData.user_id) {
      throw new Error('Title and user_id are required');
    }

    // Ensure content or media_url is provided
    if (!sanitizedData.content && !sanitizedData.media_url) {
      throw new Error('Either content or media_url must be provided');
    }

    const dataToInsert = {
      ...sanitizedData,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('posts')
      .insert(dataToInsert)
      .select(`
        *,
        author:users!posts_user_id_fkey(
          id,
          auth_id,
          name,
          email,
          picture
        ),
        pet:pets(id, name, species, image_url)
      `)
      .single();
    
    if (error) {
      console.error('Detailed Supabase error:', error);
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error('Error creating post:', error);
    throw error;
  }
};

// Update a post
export const updatePost = async (postId, userId, updateData) => {
  try {
    const sanitizedData = sanitizePostData(updateData);
    
    // First get current edit_count
    const { data: currentPost, error: fetchError } = await supabase
      .from('posts')
      .select('edit_count')
      .eq('id', postId)
      .eq('user_id', userId)
      .eq('is_deleted', false)
      .single();

    if (fetchError) {
      console.error('Error fetching current post:', fetchError);
      throw fetchError;
    }

    const dataToUpdate = {
      ...sanitizedData,
      updated_at: new Date().toISOString(),
      is_edited: true,
      edit_count: (currentPost.edit_count || 0) + 1,
    };

    const { data, error } = await supabase
      .from('posts')
      .update(dataToUpdate)
      .eq('id', postId)
      .eq('user_id', userId) // Ensure only author can update
      .eq('is_deleted', false)
      .select(`
        *,
        author:users!posts_user_id_fkey(
          id,
          auth_id,
          name,
          email,
          picture
        ),
        pet:pets(id, name, species, image_url)
      `)
      .single();
    
    if (error) {
      console.error('Detailed Supabase error:', error);
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error('Error updating post:', error);
    throw error;
  }
};

// Soft delete a post
export const deletePost = async (postId, userId) => {
  try {
    const { error } = await supabase
      .from('posts')
      .update({ 
        is_deleted: true,
        updated_at: new Date().toISOString()
      })
      .eq('id', postId)
      .eq('user_id', userId) // Ensure only author can delete
      .eq('is_deleted', false);
    
    if (error) {
      console.error('Detailed Supabase error:', error);
      throw error;
    }
    
    return true;
  } catch (error) {
    console.error('Error deleting post:', error);
    throw error;
  }
};

// Get posts by specific user
export const getUserPosts = async (userId, currentUserId, options = {}) => {
  return getPostsFeed(currentUserId, { ...options, userId });
};

// Get posts about a specific pet
export const getPostsByPet = async (petId, currentUserId, options = {}) => {
  try {
    const { limit = 20, offset = 0 } = options;

    const { data, error } = await supabase
      .from('posts')
      .select(`
        *,
        author:users!posts_user_id_fkey(
          id,
          auth_id,
          name,
          email,
          picture
        ),
        pet:pets(id, name, species, image_url),
        comments_count:comments(count),
        reactions_count:reactions(count)
      `)
      .eq('pet_id', petId)
      .eq('is_deleted', false)
      .in('visibility', ['public']) // Only public posts for pet feeds
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error getting posts by pet:', error);
    return [];
  }
};

// Search posts
export const searchPosts = async (query, currentUserId, options = {}) => {
  try {
    if (!query || query.trim().length < 2) {
      return [];
    }

    const { limit = 20, offset = 0 } = options;
    const searchTerm = query.trim();

    const { data, error } = await supabase
      .from('posts')
      .select(`
        *,
        author:users!posts_user_id_fkey(
          id,
          auth_id,
          name,
          email,
          picture
        ),
        pet:pets(id, name, species, image_url),
        comments_count:comments(count),
        reactions_count:reactions(count)
      `)
      .eq('is_deleted', false)
      .eq('visibility', 'public') // Only search public posts
      .or(`title.ilike.%${searchTerm}%,content.ilike.%${searchTerm}%`)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error searching posts:', error);
    return [];
  }
};

// Get posts feed for connected users only
export const getConnectionsFeed = async (currentUserId, options = {}) => {
  try {
    // TODO: Import areUsersConnected from connectionService
    // For now, return empty array - implement when connection checking is ready
    return [];
    
    /* Future implementation:
    const { limit = 20, offset = 0 } = options;
    
    // First get user's connections
    const connections = await getUserConnections(currentUserId);
    const connectedUserIds = connections.map(conn => conn.connection_id);
    
    if (connectedUserIds.length === 0) {
      return [];
    }
    
    const { data, error } = await supabase
      .from('posts')
      .select(`
        *,
        author:users!posts_user_id_fkey(
          id,
          auth_id,
          name,
          email,
          picture
        ),
        pet:pets(id, name, species, image_url),
        comments_count:comments(count),
        reactions_count:reactions(count)
      `)
      .in('user_id', connectedUserIds)
      .eq('is_deleted', false)
      .in('visibility', ['public', 'connections'])
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);
    
    if (error) throw error;
    return data || [];
    */
  } catch (error) {
    console.error('Error getting connections feed:', error);
    return [];
  }
};

// Subscribe to posts changes
export const subscribeToPosts = (callback) => {
  const subscription = supabase
    .channel('public:posts')
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'posts',
    }, callback)
    .subscribe();

  return () => supabase.removeChannel(subscription);
};

// Subscribe to specific user's posts
export const subscribeToUserPosts = (userId, callback) => {
  const subscription = supabase
    .channel(`posts:user:${userId}`)
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'posts',
      filter: `user_id=eq.${userId}`,
    }, callback)
    .subscribe();

  return () => supabase.removeChannel(subscription);
};

// Get post statistics for user
export const getUserPostStats = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('posts')
      .select('post_type, created_at, visibility')
      .eq('user_id', userId)
      .eq('is_deleted', false);

    if (error) throw error;

    const stats = {
      total: data.length,
      thisMonth: 0,
      typeCounts: {
        text: 0,
        image: 0,
        video: 0,
        article: 0,
        journal: 0,
        mixed: 0
      },
      visibilityCounts: {
        public: 0,
        connections: 0,
        private: 0
      }
    };

    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    data.forEach(post => {
      const postDate = new Date(post.created_at);
      if (postDate.getMonth() === currentMonth && postDate.getFullYear() === currentYear) {
        stats.thisMonth++;
      }
      
      if (post.post_type) {
        stats.typeCounts[post.post_type]++;
      }
      
      if (post.visibility) {
        stats.visibilityCounts[post.visibility]++;
      }
    });

    return stats;
  } catch (error) {
    console.error('Error getting user post stats:', error);
    return {
      total: 0,
      thisMonth: 0,
      typeCounts: { text: 0, image: 0, video: 0, article: 0, journal: 0, mixed: 0 },
      visibilityCounts: { public: 0, connections: 0, private: 0 }
    };
  }
};

// Check if user can view post based on visibility and connections
export const canUserViewPost = async (post, viewerUserId) => {
  try {
    // Owner can always view their own posts
    if (post.user_id === viewerUserId) {
      return true;
    }
    
    // Public posts are viewable by everyone
    if (post.visibility === 'public') {
      return true;
    }
    
    // Private posts only viewable by owner
    if (post.visibility === 'private') {
      return false;
    }
    
    // Connections posts - check if users are connected
    if (post.visibility === 'connections') {
      // TODO: Import and use areUsersConnected from connectionService
      // For now, return false - implement when connection checking is ready
      return false;
    }
    
    return false;
  } catch (error) {
    console.error('Error checking post visibility:', error);
    return false;
  }
};

// Get trending posts (based on recent engagement)
export const getTrendingPosts = async (currentUserId, options = {}) => {
  try {
    const { limit = 10, hoursBack = 24 } = options;
    const cutoffTime = new Date(Date.now() - hoursBack * 60 * 60 * 1000).toISOString();
    
    const { data, error } = await supabase
      .from('posts')
      .select(`
        *,
        author:users!posts_user_id_fkey(
          id,
          auth_id,
          name,
          email,
          picture
        ),
        pet:pets(id, name, species, image_url),
        comments_count:comments(count),
        reactions_count:reactions(count)
      `)
      .eq('is_deleted', false)
      .eq('visibility', 'public')
      .gte('created_at', cutoffTime)
      .order('created_at', { ascending: false })
      .limit(limit * 3); // Get more to sort by engagement
    
    if (error) throw error;
    
    // Sort by engagement (comments + reactions)
    const sortedData = (data || []).sort((a, b) => {
      const engagementA = (a.comments_count?.[0]?.count || 0) + (a.reactions_count?.[0]?.count || 0);
      const engagementB = (b.comments_count?.[0]?.count || 0) + (b.reactions_count?.[0]?.count || 0);
      return engagementB - engagementA;
    });
    
    return sortedData.slice(0, limit);
  } catch (error) {
    console.error('Error getting trending posts:', error);
    return [];
  }
};