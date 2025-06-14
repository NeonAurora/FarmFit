// hooks/useComments.js
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { 
  getPostComments, 
  getCommentReplies,
  subscribeToPostComments,
  subscribeToCommentReplies 
} from '@/services/supabase/commentService';

export function useComments(postId, options = {}) {
  const { user } = useAuth();
  const {
    limit = 50,
    autoRefresh = true,
    parentCommentId = null // For getting replies to a specific comment
  } = options;

  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  // Create a refetch function that can be called manually
  const refetch = useCallback(async (resetOffset = true) => {
    if (!postId && !parentCommentId) return;
    
    try {
      setError(null);
      const currentOffset = resetOffset ? 0 : offset;
      
      let data = [];
      const fetchOptions = { limit, offset: currentOffset };

      if (parentCommentId) {
        // Fetching replies to a specific comment
        data = await getCommentReplies(parentCommentId, fetchOptions);
      } else {
        // Fetching comments for a post
        data = await getPostComments(postId, fetchOptions);
      }

      if (resetOffset) {
        setComments(data);
        setOffset(data.length);
      } else {
        setComments(prev => [...prev, ...data]);
        setOffset(prev => prev + data.length);
      }

      // Check if there are more comments to load
      setHasMore(data.length === limit);
      
    } catch (err) {
      console.error('Error refetching comments:', err);
      setError('Failed to load comments');
    }
  }, [postId, parentCommentId, limit, offset]);

  // Load more comments (pagination)
  const loadMore = useCallback(async () => {
    if (!hasMore || loading) return;
    
    setLoading(true);
    await refetch(false);
    setLoading(false);
  }, [hasMore, loading, refetch]);

  // Refresh comments (pull to refresh)
  const refresh = useCallback(async () => {
    setRefreshing(true);
    await refetch(true);
    setRefreshing(false);
  }, [refetch]);

  // Add a new comment optimistically
  const addComment = useCallback((newComment) => {
    if (parentCommentId) {
      // Adding a reply
      setComments(prev => [...prev, newComment]);
    } else {
      // Adding a top-level comment
      if (newComment.parent_comment_id) {
        // This is a reply, add it to the appropriate parent's replies
        setComments(prev => 
          prev.map(comment => 
            comment.id === newComment.parent_comment_id
              ? { 
                  ...comment, 
                  replies: [...(comment.replies || []), newComment] 
                }
              : comment
          )
        );
      } else {
        // This is a new top-level comment
        setComments(prev => [...prev, { ...newComment, replies: [] }]);
      }
    }
  }, [parentCommentId]);

  // Update a comment in the list
  const updateComment = useCallback((commentId, updatedComment) => {
    setComments(prev => 
      prev.map(comment => {
        if (comment.id === commentId) {
          return { ...comment, ...updatedComment };
        }
        // Check replies too
        if (comment.replies) {
          const updatedReplies = comment.replies.map(reply => 
            reply.id === commentId ? { ...reply, ...updatedComment } : reply
          );
          return { ...comment, replies: updatedReplies };
        }
        return comment;
      })
    );
  }, []);

  // Remove a comment from the list
  const removeComment = useCallback((commentId) => {
    setComments(prev => 
      prev.map(comment => {
        if (comment.id === commentId) {
          // Mark as deleted instead of removing to maintain thread structure
          return { ...comment, is_deleted: true, content: '[Comment deleted]' };
        }
        // Check replies too
        if (comment.replies) {
          const updatedReplies = comment.replies.map(reply => 
            reply.id === commentId 
              ? { ...reply, is_deleted: true, content: '[Comment deleted]' }
              : reply
          );
          return { ...comment, replies: updatedReplies };
        }
        return comment;
      })
    );
  }, []);

  // Add a reply to a specific comment
  const addReply = useCallback((parentCommentId, newReply) => {
    setComments(prev => 
      prev.map(comment => 
        comment.id === parentCommentId
          ? { 
              ...comment, 
              replies: [...(comment.replies || []), newReply] 
            }
          : comment
      )
    );
  }, []);

  // Get comment count (including replies)
  const getCommentCount = useCallback(() => {
    return comments.reduce((total, comment) => {
      const repliesCount = comment.replies ? comment.replies.length : 0;
      return total + 1 + repliesCount;
    }, 0);
  }, [comments]);

  // Initial fetch
  useEffect(() => {
    if (!postId && !parentCommentId) {
      setComments([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    
    const fetchComments = async () => {
      try {
        await refetch(true);
      } catch (err) {
        console.error('Error fetching comments:', err);
        setError('Failed to load comments');
      } finally {
        setLoading(false);
      }
    };

    fetchComments();
  }, [postId, parentCommentId]);

  // Set up real-time subscriptions
  useEffect(() => {
    if (!autoRefresh) return;

    let unsubscribe;

    if (parentCommentId) {
      // Subscribe to replies for a specific comment
      unsubscribe = subscribeToCommentReplies(parentCommentId, (payload) => {
        if (payload.eventType === 'INSERT') {
          addComment({ ...payload.new, author: { name: 'User' } }); // Approximate author
        } else if (payload.eventType === 'UPDATE') {
          updateComment(payload.new.id, payload.new);
        } else if (payload.eventType === 'DELETE') {
          removeComment(payload.old.id);
        }
      });
    } else if (postId) {
      // Subscribe to comments for a post
      unsubscribe = subscribeToPostComments(postId, (payload) => {
        if (payload.eventType === 'INSERT') {
          addComment({ ...payload.new, author: { name: 'User' }, replies: [] });
        } else if (payload.eventType === 'UPDATE') {
          updateComment(payload.new.id, payload.new);
        } else if (payload.eventType === 'DELETE') {
          removeComment(payload.old.id);
        }
      });
    }

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [postId, parentCommentId, autoRefresh, addComment, updateComment, removeComment]);

  return { 
    comments, 
    loading, 
    error, 
    hasMore,
    refreshing,
    refetch: () => refetch(true), 
    loadMore,
    refresh,
    addComment,
    updateComment,
    removeComment,
    addReply,
    getCommentCount
  };
}

// Additional hook for managing comment creation/editing
export function useCommentForm(postId, parentCommentId = null) {
  const { user } = useAuth();
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const resetForm = useCallback(() => {
    setContent('');
    setError(null);
  }, []);

  const submitComment = useCallback(async (commentService) => {
    if (!content.trim() || !user?.sub) return null;

    setSubmitting(true);
    setError(null);

    try {
      const commentData = {
        post_id: postId,
        user_id: user.sub,
        content: content.trim(),
        parent_comment_id: parentCommentId,
      };

      const result = await commentService.createComment(commentData);
      
      if (result) {
        resetForm();
        return result;
      }
    } catch (err) {
      console.error('Error submitting comment:', err);
      setError('Failed to submit comment. Please try again.');
    } finally {
      setSubmitting(false);
    }

    return null;
  }, [content, user?.sub, postId, parentCommentId, resetForm]);

  return {
    content,
    setContent,
    submitting,
    error,
    resetForm,
    submitComment,
    canSubmit: content.trim().length > 0 && !submitting
  };
}