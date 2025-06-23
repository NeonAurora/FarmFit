// app/(main)/(screens)/postViewScreen.jsx
import React, { useState, useCallback } from 'react';
import { ScrollView, StyleSheet, View, TouchableOpacity, Image, Alert, Linking } from 'react-native';
import { 
  Card, 
  Text, 
  Avatar, 
  Button, 
  Chip,
  IconButton,
  ActivityIndicator,
  TextInput,
  Divider,
  List
} from 'react-native-paper';
import { useFocusEffect } from '@react-navigation/native';
import { ThemedView } from '@/components/themes/ThemedView';
import { ThemedText } from '@/components/themes/ThemedText';
import { useColorScheme } from '@/hooks/useColorScheme.native';
import { useAuth } from '@/contexts/AuthContext';
import { useLocalSearchParams, router } from 'expo-router';
import { usePost } from '@/hooks/usePost';
import { useComments, useCommentForm } from '@/hooks/useComments';
import { deletePost } from '@/services/supabase/postService';
import { createComment, updateComment, deleteComment } from '@/services/supabase/commentService';
import { deleteImage } from '@/services/supabase';

const POST_TYPE_EMOJIS = {
  text: '📝',
  image: '📸',
  video: '🎥',
  article: '📰',
  journal: '📔',
  mixed: '🎭'
};

const POST_TYPE_COLORS = {
  text: '#2196F3',
  image: '#4CAF50',
  video: '#FF5722',
  article: '#9C27B0',
  journal: '#FF9800',
  mixed: '#607D8B'
};

export default function PostViewScreen() {
  const { postId } = useLocalSearchParams();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { user } = useAuth();
  
  const [showAllComments, setShowAllComments] = useState(false);
  const [replyingTo, setReplyingTo] = useState(null);
  const [editingComment, setEditingComment] = useState(null);
  const [editCommentContent, setEditCommentContent] = useState('');

  // Use post hook for main post data
  const { post, loading: postLoading, error: postError, refetch: refetchPost } = usePost(postId);
  
  // Use comments hook for comments
  const { 
    comments, 
    loading: commentsLoading, 
    error: commentsError,
    refetch: refetchComments,
    addComment,
    updateComment: updateCommentInList,
    removeComment
  } = useComments(postId);

  // Use comment form hook for new comments
  const {
    content: newCommentContent,
    setContent: setNewCommentContent,
    submitting: submittingComment,
    error: commentError,
    resetForm: resetCommentForm,
    submitComment,
    canSubmit: canSubmitComment
  } = useCommentForm(postId, replyingTo?.id);

  // Refresh when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      refetchPost();
      refetchComments();
    }, [refetchPost, refetchComments])
  );

  const isOwnPost = post?.user_id === user?.sub;

  const handleEditPost = () => {
    router.push({
      pathname: '/createPostScreen',
      params: { postId }
    });
  };

  const handleDeletePost = async () => {
    Alert.alert(
      'Confirm Deletion',
      `Are you sure you want to delete "${post?.title}"?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              // Delete media from storage if exists
              if (post.media_url) {
                await deleteImage(post.media_url);
              }
              
              // Delete post record
              const result = await deletePost(postId, user.sub);
              
              if (result) {
                Alert.alert('Success', 'Post deleted successfully');
                router.push('/postFeedScreen');
              } else {
                throw new Error('Failed to delete post');
              }
            } catch (error) {
              console.error('Error deleting post:', error);
              Alert.alert('Error', 'Failed to delete post');
            }
          },
        },
      ]
    );
  };

  const handleUserPress = (userId) => {
    router.push({
      pathname: '/userProfileScreen',
      params: { userId }
    });
  };

  const handlePetPress = (petId) => {
    router.push({
      pathname: '/petProfileScreen',
      params: { petId }
    });
  };

  const handleMediaPress = () => {
    if (post?.media_url) {
      if (post.post_type === 'video') {
        // For videos, you might want to open in a video player
        // For now, just show an alert
        Alert.alert('Video', 'Video playback feature coming soon!');
      } else {
        // For images, you could implement a full-screen image viewer
        Alert.alert('Image', 'Full-screen image viewer coming soon!');
      }
    }
  };

  const handleSharePost = () => {
    const shareText = `Check out this post: "${post?.title}" by ${post?.author?.name}`;
    // Implement sharing functionality
    Alert.alert('Share', 'Sharing functionality coming soon!');
  };

  const handleSubmitComment = async () => {
    const result = await submitComment({ createComment });
    if (result) {
      addComment(result);
      setReplyingTo(null);
    }
  };

  const handleReplyToComment = (comment) => {
    setReplyingTo(comment);
    setNewCommentContent(`@${comment.author?.name || 'User'} `);
  };

  const handleEditComment = (comment) => {
    setEditingComment(comment);
    setEditCommentContent(comment.content);
  };

  const handleSaveEditComment = async () => {
    if (!editCommentContent.trim() || !editingComment) return;

    try {
      const result = await updateComment(editingComment.id, user.sub, {
        content: editCommentContent.trim()
      });
      
      if (result) {
        updateCommentInList(editingComment.id, result);
        setEditingComment(null);
        setEditCommentContent('');
      }
    } catch (error) {
      console.error('Error updating comment:', error);
      Alert.alert('Error', 'Failed to update comment');
    }
  };

  const handleDeleteComment = async (comment) => {
    Alert.alert(
      'Delete Comment',
      'Are you sure you want to delete this comment?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const result = await deleteComment(comment.id, user.sub);
              if (result) {
                removeComment(comment.id);
              }
            } catch (error) {
              console.error('Error deleting comment:', error);
              Alert.alert('Error', 'Failed to delete comment');
            }
          },
        },
      ]
    );
  };

  const renderComment = (comment, isReply = false) => {
    const isOwnComment = comment.user_id === user?.sub;
    const commentDate = new Date(comment.created_at).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    return (
      <View key={comment.id} style={[styles.commentContainer, isReply && styles.replyContainer]}>
        <View style={styles.commentHeader}>
          <TouchableOpacity 
            style={styles.commentAuthor}
            onPress={() => !isOwnComment && handleUserPress(comment.author?.id)}
          >
            {comment.author?.picture ? (
              <Avatar.Image size={32} source={{ uri: comment.author.picture }} />
            ) : (
              <Avatar.Text 
                size={32} 
                label={(comment.author?.name?.charAt(0) || 'U').toUpperCase()}
                backgroundColor={isDark ? '#444' : '#e0e0e0'}
                color={isDark ? '#fff' : '#666'}
              />
            )}
            <View style={styles.commentAuthorInfo}>
              <Text style={styles.commentAuthorName}>
                {comment.author?.name || 'Anonymous User'}
                {isOwnComment && ' (You)'}
              </Text>
              <Text style={styles.commentDate}>
                {commentDate}
                {comment.is_edited && ' • Edited'}
              </Text>
            </View>
          </TouchableOpacity>

          {isOwnComment && (
            <View style={styles.commentActions}>
              <IconButton
                icon="pencil"
                size={16}
                onPress={() => handleEditComment(comment)}
              />
              <IconButton
                icon="delete"
                size={16}
                onPress={() => handleDeleteComment(comment)}
                iconColor="#E74C3C"
              />
            </View>
          )}
        </View>

        <View style={styles.commentContent}>
          {editingComment?.id === comment.id ? (
            <View style={styles.editCommentContainer}>
              <TextInput
                value={editCommentContent}
                onChangeText={setEditCommentContent}
                style={styles.editCommentInput}
                mode="outlined"
                multiline
                placeholder="Edit your comment..."
              />
              <View style={styles.editCommentActions}>
                <Button mode="text" onPress={() => setEditingComment(null)}>
                  Cancel
                </Button>
                <Button 
                  mode="contained" 
                  onPress={handleSaveEditComment}
                  disabled={!editCommentContent.trim()}
                >
                  Save
                </Button>
              </View>
            </View>
          ) : (
            <>
              <Text style={styles.commentText}>{comment.content}</Text>
              {!isReply && (
                <Button 
                  mode="text" 
                  compact
                  onPress={() => handleReplyToComment(comment)}
                  style={styles.replyButton}
                >
                  Reply
                </Button>
              )}
            </>
          )}
        </View>

        {/* Render replies */}
        {!isReply && comment.replies && comment.replies.length > 0 && (
          <View style={styles.repliesContainer}>
            {comment.replies.map(reply => renderComment(reply, true))}
          </View>
        )}
      </View>
    );
  };

  // Loading state
  if (postLoading) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0a7ea4" />
        <ThemedText style={styles.loadingText}>Loading post...</ThemedText>
      </ThemedView>
    );
  }

  // Error state
  if (postError || !post) {
    return (
      <ThemedView style={styles.errorContainer}>
        <Avatar.Icon size={80} icon="post-off" backgroundColor="#e0e0e0" />
        <ThemedText type="title" style={styles.errorTitle}>
          {postError || 'Post Not Found'}
        </ThemedText>
        <ThemedText style={styles.errorText}>
          This post is not available or you don't have permission to view it.
        </ThemedText>
        <Button 
          mode="contained" 
          onPress={() => router.back()} 
          style={styles.backButton}
        >
          Go Back
        </Button>
      </ThemedView>
    );
  }

  const postDate = new Date(post.created_at).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Post Content */}
        <Card style={styles.postCard}>
          <Card.Content style={styles.postContent}>
            {/* Post Header */}
            <View style={styles.postHeader}>
              <TouchableOpacity 
                style={styles.authorInfo}
                onPress={() => !isOwnPost && handleUserPress(post.author?.id)}
              >
                {post.author?.picture ? (
                  <Avatar.Image size={50} source={{ uri: post.author.picture }} />
                ) : (
                  <Avatar.Text 
                    size={50} 
                    label={(post.author?.name?.charAt(0) || 'U').toUpperCase()}
                    backgroundColor={isDark ? '#444' : '#e0e0e0'}
                    color={isDark ? '#fff' : '#666'}
                  />
                )}
                <View style={styles.authorDetails}>
                  <Text style={styles.authorName}>
                    {post.author?.name || 'Anonymous User'}
                    {isOwnPost && ' (You)'}
                  </Text>
                  <Text style={styles.postDate}>{postDate}</Text>
                  {post.is_edited && (
                    <Text style={styles.editedIndicator}>Edited</Text>
                  )}
                </View>
              </TouchableOpacity>

              <View style={styles.postMeta}>
                <Chip 
                  icon={() => <Text>{POST_TYPE_EMOJIS[post.post_type] || '📝'}</Text>}
                  style={[
                    styles.postTypeChip, 
                    { backgroundColor: (POST_TYPE_COLORS[post.post_type] || '#2196F3') + '20' }
                  ]}
                  textStyle={styles.postTypeText}
                >
                  {post.post_type}
                </Chip>
              </View>
            </View>

            {/* Post Title and Content */}
            <View style={styles.postMainContent}>
              <Text style={styles.postTitle}>{post.title}</Text>
              
              {post.content && (
                <Text style={styles.postText}>{post.content}</Text>
              )}

              {/* Media Display */}
              {post.media_url && (
                <TouchableOpacity onPress={handleMediaPress} style={styles.mediaContainer}>
                  {post.post_type === 'image' || post.post_type === 'mixed' ? (
                    <Image 
                      source={{ uri: post.media_url }} 
                      style={styles.mediaImage}
                      resizeMode="cover"
                    />
                  ) : post.post_type === 'video' ? (
                    <View style={styles.videoContainer}>
                      <Image 
                        source={{ uri: post.media_url }} 
                        style={styles.mediaImage}
                        resizeMode="cover"
                      />
                      <View style={styles.videoOverlay}>
                        <IconButton 
                          icon="play-circle" 
                          size={60} 
                          iconColor="#fff"
                        />
                      </View>
                    </View>
                  ) : null}
                </TouchableOpacity>
              )}

              {/* Pet Information */}
              {post.pet && (
                <TouchableOpacity 
                  style={styles.petContainer}
                  onPress={() => handlePetPress(post.pet.id)}
                >
                  {post.pet.image_url ? (
                    <Avatar.Image size={40} source={{ uri: post.pet.image_url }} />
                  ) : (
                    <Avatar.Icon size={40} icon="paw" backgroundColor="#e0e0e0" />
                  )}
                  <View style={styles.petInfo}>
                    <Text style={styles.petLabel}>About</Text>
                    <Text style={styles.petName}>{post.pet.name}</Text>
                    <Text style={styles.petSpecies}>{post.pet.species}</Text>
                  </View>
                </TouchableOpacity>
              )}
            </View>

            {/* Post Footer */}
            <View style={styles.postFooter}>
              <Chip 
                icon={
                  post.visibility === 'public' ? 'earth' :
                  post.visibility === 'connections' ? 'account-group' : 'lock'
                }
                style={styles.visibilityChip}
                textStyle={styles.visibilityText}
              >
                {post.visibility}
              </Chip>

              <View style={styles.postActions}>
                <Button 
                  mode="text" 
                  compact
                  onPress={handleSharePost}
                  icon="share"
                >
                  Share
                </Button>
                
                {isOwnPost && (
                  <>
                    <Button 
                      mode="text" 
                      compact
                      onPress={handleEditPost}
                      icon="pencil"
                    >
                      Edit
                    </Button>
                    <Button 
                      mode="text" 
                      compact
                      onPress={handleDeletePost}
                      icon="delete"
                      textColor="#E74C3C"
                    >
                      Delete
                    </Button>
                  </>
                )}
              </View>
            </View>
          </Card.Content>
        </Card>

        <Divider style={styles.sectionDivider} />

        {/* Comments Section */}
        <View style={styles.commentsSection}>
          <Text style={styles.commentsTitle}>
            💬 Comments ({comments.length})
          </Text>

          {/* New Comment Form */}
          <Card style={styles.newCommentCard}>
            <Card.Content>
              {replyingTo && (
                <View style={styles.replyingToContainer}>
                  <Text style={styles.replyingToText}>
                    Replying to {replyingTo.author?.name || 'User'}
                  </Text>
                  <IconButton
                    icon="close"
                    size={16}
                    onPress={() => {
                      setReplyingTo(null);
                      resetCommentForm();
                    }}
                  />
                </View>
              )}
              
              <TextInput
                value={newCommentContent}
                onChangeText={setNewCommentContent}
                style={styles.commentInput}
                mode="outlined"
                multiline
                placeholder={replyingTo ? "Write a reply..." : "Write a comment..."}
                disabled={submittingComment}
              />
              
              {commentError && (
                <Text style={styles.commentError}>{commentError}</Text>
              )}
              
              <View style={styles.commentFormActions}>
                {replyingTo && (
                  <Button 
                    mode="text" 
                    onPress={() => {
                      setReplyingTo(null);
                      resetCommentForm();
                    }}
                  >
                    Cancel
                  </Button>
                )}
                <Button 
                  mode="contained" 
                  onPress={handleSubmitComment}
                  disabled={!canSubmitComment}
                  loading={submittingComment}
                  style={styles.submitCommentButton}
                >
                  {replyingTo ? 'Reply' : 'Comment'}
                </Button>
              </View>
            </Card.Content>
          </Card>

          {/* Comments List */}
          {commentsLoading ? (
            <View style={styles.commentsLoading}>
              <ActivityIndicator size="small" color="#0a7ea4" />
              <Text style={styles.commentsLoadingText}>Loading comments...</Text>
            </View>
          ) : commentsError ? (
            <View style={styles.commentsError}>
              <Text style={styles.commentsErrorText}>Failed to load comments</Text>
              <Button mode="text" onPress={refetchComments}>Retry</Button>
            </View>
          ) : comments.length === 0 ? (
            <View style={styles.noComments}>
              <Text style={styles.noCommentsText}>
                No comments yet. Be the first to comment!
              </Text>
            </View>
          ) : (
            <View style={styles.commentsList}>
              {comments.map(comment => renderComment(comment))}
            </View>
          )}
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorTitle: {
    marginTop: 16,
    marginBottom: 8,
  },
  errorText: {
    textAlign: 'center',
    opacity: 0.7,
    marginBottom: 16,
  },
  backButton: {
    marginTop: 8,
  },
  postCard: {
    margin: 16,
    marginBottom: 8,
  },
  postContent: {
    padding: 20,
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  authorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  authorDetails: {
    marginLeft: 12,
    flex: 1,
  },
  authorName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  postDate: {
    fontSize: 12,
    opacity: 0.6,
  },
  editedIndicator: {
    fontSize: 12,
    opacity: 0.6,
    fontStyle: 'italic',
  },
  postMeta: {
    marginLeft: 8,
  },
  postTypeChip: {
    height: 32,
  },
  postTypeText: {
    fontSize: 12,
    textTransform: 'capitalize',
  },
  postMainContent: {
    marginBottom: 16,
  },
  postTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 12,
    lineHeight: 28,
  },
  postText: {
    fontSize: 16,
    lineHeight: 24,
    opacity: 0.8,
    marginBottom: 16,
  },
  mediaContainer: {
    marginVertical: 16,
    borderRadius: 12,
    overflow: 'hidden',
  },
  mediaImage: {
    width: '100%',
    height: 300,
  },
  videoContainer: {
    position: 'relative',
  },
  videoOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  petContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 12,
    marginTop: 12,
  },
  petInfo: {
    marginLeft: 12,
  },
  petLabel: {
    fontSize: 12,
    opacity: 0.6,
    textTransform: 'uppercase',
  },
  petName: {
    fontSize: 16,
    fontWeight: '600',
  },
  petSpecies: {
    fontSize: 14,
    opacity: 0.7,
  },
  postFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
  },
  visibilityChip: {
    height: 30,
  },
  visibilityText: {
    fontSize: 11,
    textTransform: 'capitalize',
  },
  postActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionDivider: {
    marginHorizontal: 16,
    marginVertical: 8,
  },
  commentsSection: {
    margin: 16,
    marginTop: 8,
  },
  commentsTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  newCommentCard: {
    marginBottom: 16,
  },
  replyingToContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
    padding: 8,
    backgroundColor: '#e3f2fd',
    borderRadius: 8,
  },
  replyingToText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1976d2',
  },
  commentInput: {
    marginBottom: 12,
    backgroundColor: 'transparent',
  },
  commentError: {
    color: '#E74C3C',
    fontSize: 12,
    marginBottom: 8,
  },
  commentFormActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  submitCommentButton: {
    marginLeft: 8,
  },
  commentsLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  commentsLoadingText: {
    marginLeft: 8,
  },
  commentsError: {
    alignItems: 'center',
    padding: 20,
  },
  commentsErrorText: {
    marginBottom: 8,
    color: '#E74C3C',
  },
  noComments: {
    alignItems: 'center',
    padding: 20,
  },
  noCommentsText: {
    opacity: 0.6,
    textAlign: 'center',
  },
  commentsList: {
    marginTop: 8,
  },
  commentContainer: {
    marginBottom: 16,
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
  },
  replyContainer: {
    marginLeft: 20,
    marginTop: 8,
    borderLeftWidth: 2,
    borderLeftColor: '#e0e0e0',
    paddingLeft: 12,
  },
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  commentAuthor: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  commentAuthorInfo: {
    marginLeft: 8,
    flex: 1,
  },
  commentAuthorName: {
    fontSize: 14,
    fontWeight: '600',
  },
  commentDate: {
    fontSize: 12,
    opacity: 0.6,
  },
  commentActions: {
    flexDirection: 'row',
  },
  commentContent: {
    marginLeft: 40,
  },
  commentText: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
  replyButton: {
    alignSelf: 'flex-start',
  },
  editCommentContainer: {
    marginBottom: 8,
  },
  editCommentInput: {
    marginBottom: 8,
    backgroundColor: 'transparent',
  },
  editCommentActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  repliesContainer: {
    marginTop: 8,
  },
});