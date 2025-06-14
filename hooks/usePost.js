// hooks/usePost.js
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getPostById } from '@/services/supabase/postService';

export function usePost(postId) {
  const { user } = useAuth();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Add a refetch function
  const refetch = useCallback(async () => {
    if (!user?.sub || !postId) return;
    
    try {
      setError(null);
      const data = await getPostById(postId, user.sub);
      setPost(data);
    } catch (err) {
      console.error('Error refetching post:', err);
      setError('Failed to load post data');
    }
  }, [postId, user?.sub]);

  // Update post data
  const updatePost = useCallback((updatedData) => {
    setPost(prev => prev ? { ...prev, ...updatedData } : null);
  }, []);

  // Mark post as deleted
  const markAsDeleted = useCallback(() => {
    setPost(null);
    setError('This post has been deleted');
  }, []);

  useEffect(() => {
    if (!user?.sub || !postId) {
      setPost(null);
      setLoading(false);
      return;
    }
    
    setLoading(true);
    
    const fetchPost = async () => {
      try {
        const data = await getPostById(postId, user.sub);
        setPost(data);
        setError(null);
        
        if (!data) {
          setError('Post not found or you do not have permission to view it');
        }
      } catch (err) {
        console.error('Error fetching post:', err);
        setError('Failed to load post data');
      } finally {
        setLoading(false);
      }
    };
    
    fetchPost();
  }, [postId, user?.sub]);
  
  return { 
    post, 
    loading, 
    error, 
    refetch,
    updatePost,
    markAsDeleted
  };
}