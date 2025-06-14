// hooks/usePosts.js
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { 
  getPostsFeed, 
  getUserPosts, 
  getPostsByPet,
  searchPosts,
  subscribeToPosts,
  subscribeToUserPosts 
} from '@/services/supabase/postService';

export function usePosts(options = {}) {
  const { user } = useAuth();
  const {
    feedType = 'feed', // 'feed', 'user', 'pet', 'search'
    userId = null,
    petId = null,
    searchQuery = '',
    visibility = 'all',
    postType = 'all',
    limit = 20,
    autoRefresh = true
  } = options;

  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  // Create a refetch function that can be called manually
  const refetch = useCallback(async (resetOffset = true) => {
    if (!user?.sub) return;

    try {
      setError(null);
      const currentOffset = resetOffset ? 0 : offset;
      
      let data = [];
      const fetchOptions = { 
        limit, 
        offset: currentOffset, 
        visibility, 
        postType 
      };

      switch (feedType) {
        case 'user':
          data = await getUserPosts(userId || user.sub, user.sub, fetchOptions);
          break;
        case 'pet':
          if (petId) {
            data = await getPostsByPet(petId, user.sub, fetchOptions);
          }
          break;
        case 'search':
          if (searchQuery) {
            data = await searchPosts(searchQuery, user.sub, fetchOptions);
          }
          break;
        case 'feed':
        default:
          data = await getPostsFeed(user.sub, fetchOptions);
          break;
      }

      if (resetOffset) {
        setPosts(data);
        setOffset(data.length);
      } else {
        setPosts(prev => [...prev, ...data]);
        setOffset(prev => prev + data.length);
      }

      // Check if there are more posts to load
      setHasMore(data.length === limit);
      
    } catch (err) {
      console.error('Error refetching posts:', err);
      setError('Failed to load posts');
    }
  }, [user?.sub, feedType, userId, petId, searchQuery, visibility, postType, limit, offset]);

  // Load more posts (pagination)
  const loadMore = useCallback(async () => {
    if (!hasMore || loading) return;
    
    setLoading(true);
    await refetch(false);
    setLoading(false);
  }, [hasMore, loading, refetch]);

  // Refresh posts (pull to refresh)
  const refresh = useCallback(async () => {
    setRefreshing(true);
    await refetch(true);
    setRefreshing(false);
  }, [refetch]);

  // Add a new post optimistically
  const addPost = useCallback((newPost) => {
    setPosts(prev => [newPost, ...prev]);
  }, []);

  // Update a post in the list
  const updatePost = useCallback((postId, updatedPost) => {
    setPosts(prev => 
      prev.map(post => 
        post.id === postId ? { ...post, ...updatedPost } : post
      )
    );
  }, []);

  // Remove a post from the list
  const removePost = useCallback((postId) => {
    setPosts(prev => prev.filter(post => post.id !== postId));
  }, []);

  // Initial fetch
  useEffect(() => {
    if (!user?.sub) {
      setPosts([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    
    const fetchPosts = async () => {
      try {
        await refetch(true);
      } catch (err) {
        console.error('Error fetching posts:', err);
        setError('Failed to load posts');
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, [user?.sub, feedType, userId, petId, searchQuery, visibility, postType]);

  // Set up real-time subscriptions
  useEffect(() => {
    if (!user?.sub || !autoRefresh) return;

    let unsubscribe;

    if (feedType === 'user' && userId) {
      // Subscribe to specific user's posts
      unsubscribe = subscribeToUserPosts(userId, (payload) => {
        if (payload.eventType === 'INSERT') {
          // Only add if it matches current filters
          const newPost = payload.new;
          if (visibility === 'all' || newPost.visibility === visibility) {
            if (postType === 'all' || newPost.post_type === postType) {
              addPost({ ...newPost, author: user }); // Approximate author data
            }
          }
        } else if (payload.eventType === 'UPDATE') {
          updatePost(payload.new.id, payload.new);
        } else if (payload.eventType === 'DELETE') {
          removePost(payload.old.id);
        }
      });
    } else if (feedType === 'feed') {
      // Subscribe to general posts feed
      unsubscribe = subscribeToPosts((payload) => {
        if (payload.eventType === 'INSERT') {
          // Only add public posts to feed
          const newPost = payload.new;
          if (newPost.visibility === 'public') {
            // Don't add to feed automatically - let user refresh
            // This prevents spam and maintains order
          }
        } else if (payload.eventType === 'UPDATE') {
          updatePost(payload.new.id, payload.new);
        } else if (payload.eventType === 'DELETE') {
          removePost(payload.old.id);
        }
      });
    }

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [user?.sub, feedType, userId, autoRefresh, visibility, postType, addPost, updatePost, removePost]);

  return { 
    posts, 
    loading, 
    error, 
    hasMore,
    refreshing,
    refetch: () => refetch(true), 
    loadMore,
    refresh,
    addPost,
    updatePost,
    removePost
  };
}