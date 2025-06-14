// hooks/usePostStats.js
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getUserPostStats } from '@/services/supabase/postService';
import { getUserCommentStats } from '@/services/supabase/commentService';

export function usePostStats(userId = null) {
  const { user } = useAuth();
  const targetUserId = userId || user?.sub;
  
  const [postStats, setPostStats] = useState(null);
  const [commentStats, setCommentStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refetch = useCallback(async () => {
    if (!targetUserId) return;

    try {
      setError(null);
      const [posts, comments] = await Promise.all([
        getUserPostStats(targetUserId),
        getUserCommentStats(targetUserId)
      ]);
      
      setPostStats(posts);
      setCommentStats(comments);
    } catch (err) {
      console.error('Error fetching stats:', err);
      setError('Failed to load statistics');
    }
  }, [targetUserId]);

  useEffect(() => {
    if (!targetUserId) {
      setPostStats(null);
      setCommentStats(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    
    const fetchStats = async () => {
      try {
        await refetch();
      } catch (err) {
        console.error('Error fetching post stats:', err);
        setError('Failed to load statistics');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [targetUserId, refetch]);

  const combinedStats = {
    posts: postStats,
    comments: commentStats,
    totalActivity: (postStats?.total || 0) + (commentStats?.total || 0),
    thisMonthActivity: (postStats?.thisMonth || 0) + (commentStats?.thisMonth || 0)
  };

  return { 
    stats: combinedStats,
    postStats,
    commentStats,
    loading, 
    error, 
    refetch 
  };
}