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
  Surface
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

// Import theme colors
import { Colors, BrandColors, PostTypeColors } from '@/constants/Colors';
import { useThemeColor, useCardColors, useChipColors, useAvatarColors } from '@/hooks/useThemeColor';

const POST_TYPE_EMOJIS = {
  text: '📝',
  image: '📸',
  video: '🎥',
  article: '📰',
  journal: '📔',
  mixed: '🎭'
};

export default function PostViewScreen() {
  const { postId } = useLocalSearchParams();
  const { colorScheme, isDark } = useColorScheme();
  const { user } = useAuth();
  
  // Theme-aware colors
  const colors = Colors[colorScheme];
  const cardColors = useCardColors();
  const chipColors = useChipColors();
  const avatarColors = useAvatarColors();
  
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

  // Create dynamic styles
  const styles = createStyles(colors, cardColors, chipColors, avatarColors, isDark);

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
        Alert.alert('Video', 'Video playback feature coming soon!');
      } else {
        Alert.alert('Image', 'Full-screen image viewer coming soon!');
      }
    }
  };

  const handleSharePost = () => {
    const shareText = `Check out this post: "${post?.title}" by ${post?.author?.name}`;
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
      <Surface key={comment.id} style={[styles.commentContainer, isReply && styles.replyContainer]}>
        <View style={styles.commentHeader}>
          <TouchableOpacity 
            style={styles.commentAuthor}
            onPress={() => !isOwnComment && handleUserPress(comment.author?.id)}
            activeOpacity={0.7}
          >
            {comment.author?.picture ? (
              <Avatar.Image size={36} source={{ uri: comment.author.picture }} />
            ) : (
              <Avatar.Text 
                size={36} 
                label={(comment.author?.name?.charAt(0) || 'U').toUpperCase()}
                style={styles.commentAvatar}
              />
            )}
            <View style={styles.commentAuthorInfo}>
              <Text variant="labelLarge" style={styles.commentAuthorName}>
                {comment.author?.name || 'Anonymous User'}
                {isOwnComment && ' (You)'}
              </Text>
              <Text variant="bodySmall" style={styles.commentDate}>
                {commentDate}
                {comment.is_edited && ' • Edited'}
              </Text>
            </View>
          </TouchableOpacity>

          {isOwnComment && (
            <View style={styles.commentActions}>
              <IconButton
                icon="pencil"
                size={20}
                iconColor={colors.textSecondary}
                onPress={() => handleEditComment(comment)}
                style={styles.actionButton}
              />
              <IconButton
                icon="delete"
                size={20}
                iconColor={BrandColors.error}
                onPress={() => handleDeleteComment(comment)}
                style={styles.actionButton}
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
                dense
              />
              <View style={styles.editCommentActions}>
                <Button mode="text" onPress={() => setEditingComment(null)} compact>
                  Cancel
                </Button>
                <Button 
                  mode="contained" 
                  onPress={handleSaveEditComment}
                  disabled={!editCommentContent.trim()}
                  compact
                  style={styles.saveButton}
                >
                  Save
                </Button>
              </View>
            </View>
          ) : (
            <>
              <Text variant="bodyMedium" style={styles.commentText}>
                {comment.content}
              </Text>
              {!isReply && (
                <Button 
                  mode="text" 
                  compact
                  onPress={() => handleReplyToComment(comment)}
                  style={styles.replyButton}
                  labelStyle={styles.replyButtonLabel}
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
      </Surface>
    );
  };

  // Loading state
  if (postLoading) {
    return (
      <ThemedView style={styles.centerContainer}>
        <ActivityIndicator size="large" color={BrandColors.primary} />
        <Text variant="bodyMedium" style={styles.centerText}>Loading post...</Text>
      </ThemedView>
    );
  }

  // Error state
  if (postError || !post) {
    return (
      <ThemedView style={styles.centerContainer}>
        <Avatar.Icon size={64} icon="post-off" style={styles.errorIcon} />
        <Text variant="headlineSmall" style={styles.centerTitle}>
          {postError || 'Post Not Found'}
        </Text>
        <Text variant="bodyMedium" style={styles.centerText}>
          This post is not available or you don't have permission to view it.
        </Text>
        <Button 
          mode="contained" 
          onPress={() => router.back()} 
          style={styles.actionButton}
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
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Post Content */}
        <Card style={styles.postCard} mode="contained">
          <Card.Content style={styles.cardContent}>
            {/* Post Header */}
            <View style={styles.postHeader}>
              <TouchableOpacity 
                style={styles.authorSection}
                onPress={() => !isOwnPost && handleUserPress(post.author?.id)}
                activeOpacity={0.7}
              >
                {post.author?.picture ? (
                  <Avatar.Image size={48} source={{ uri: post.author.picture }} />
                ) : (
                  <Avatar.Text 
                    size={48} 
                    label={(post.author?.name?.charAt(0) || 'U').toUpperCase()}
                    style={styles.authorAvatar}
                  />
                )}
                <View style={styles.authorInfo}>
                  <Text variant="titleMedium" style={styles.authorName}>
                    {post.author?.name || 'Anonymous User'}
                    {isOwnPost && ' (You)'}
                  </Text>
                  <Text variant="bodySmall" style={styles.postDateText}>
                    {postDate}
                  </Text>
                  {post.is_edited && (
                    <Text variant="bodySmall" style={styles.editedText}>
                      Edited
                    </Text>
                  )}
                </View>
              </TouchableOpacity>

              <Chip 
                icon={() => <Text style={styles.chipEmoji}>{POST_TYPE_EMOJIS[post.post_type] || '📝'}</Text>}
                style={[
                  styles.postTypeChip, 
                  { 
                    backgroundColor: (PostTypeColors[post.post_type] || BrandColors.primary) + '15'
                  }
                ]}
                textStyle={[styles.chipText, { color: PostTypeColors[post.post_type] || BrandColors.primary }]}
                compact
              >
                {post.post_type}
              </Chip>
            </View>

            {/* Post Content */}
            <View style={styles.postContent}>
              <Text variant="headlineSmall" style={styles.postTitle}>
                {post.title}
              </Text>
              
              {post.content && (
                <Text variant="bodyLarge" style={styles.postText}>
                  {post.content}
                </Text>
              )}

              {/* Media Display */}
              {post.media_url && (
                <TouchableOpacity onPress={handleMediaPress} style={styles.mediaContainer} activeOpacity={0.8}>
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
                          size={48} 
                          iconColor="rgba(255,255,255,0.9)"
                          style={styles.playButton}
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
                  activeOpacity={0.7}
                >
                  {post.pet.image_url ? (
                    <Avatar.Image size={40} source={{ uri: post.pet.image_url }} />
                  ) : (
                    <Avatar.Icon 
                      size={40} 
                      icon="paw" 
                      style={styles.petAvatar}
                    />
                  )}
                  <View style={styles.petInfo}>
                    <Text variant="labelSmall" style={styles.petLabel}>About</Text>
                    <Text variant="titleSmall" style={styles.petName}>{post.pet.name}</Text>
                    <Text variant="bodySmall" style={styles.petSpecies}>{post.pet.species}</Text>
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
                compact
              >
                {post.visibility}
              </Chip>

              <View style={styles.actionButtons}>
                <Button 
                  mode="text" 
                  compact
                  onPress={handleSharePost}
                  icon="share-variant"
                  labelStyle={styles.actionButtonLabel}
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
                      labelStyle={styles.actionButtonLabel}
                    >
                      Edit
                    </Button>
                    <Button 
                      mode="text" 
                      compact
                      onPress={handleDeletePost}
                      icon="delete"
                      labelStyle={[styles.actionButtonLabel, { color: BrandColors.error }]}
                    >
                      Delete
                    </Button>
                  </>
                )}
              </View>
            </View>
          </Card.Content>
        </Card>

        {/* Comments Section */}
        <View style={styles.commentsSection}>
          <Text variant="titleLarge" style={styles.commentsTitle}>
            Comments ({comments.length})
          </Text>

          {/* New Comment Form */}
          <Card style={styles.commentCard} mode="contained">
            <Card.Content style={styles.commentFormContent}>
              {replyingTo && (
                <Surface style={styles.replyingToContainer}>
                  <Text variant="labelMedium" style={styles.replyingToText}>
                    Replying to {replyingTo.author?.name || 'User'}
                  </Text>
                  <IconButton
                    icon="close"
                    size={20}
                    onPress={() => {
                      setReplyingTo(null);
                      resetCommentForm();
                    }}
                    style={styles.closeReplyButton}
                  />
                </Surface>
              )}
              
              <TextInput
                value={newCommentContent}
                onChangeText={setNewCommentContent}
                style={styles.commentInput}
                mode="outlined"
                multiline
                placeholder={replyingTo ? "Write a reply..." : "Write a comment..."}
                disabled={submittingComment}
                dense
              />
              
              {commentError && (
                <Text variant="bodySmall" style={styles.errorText}>
                  {commentError}
                </Text>
              )}
              
              <View style={styles.formActions}>
                {replyingTo && (
                  <Button 
                    mode="text" 
                    onPress={() => {
                      setReplyingTo(null);
                      resetCommentForm();
                    }}
                    compact
                  >
                    Cancel
                  </Button>
                )}
                <Button 
                  mode="contained" 
                  onPress={handleSubmitComment}
                  disabled={!canSubmitComment}
                  loading={submittingComment}
                  compact
                  style={styles.submitButton}
                >
                  {replyingTo ? 'Reply' : 'Comment'}
                </Button>
              </View>
            </Card.Content>
          </Card>

          {/* Comments List */}
          {commentsLoading ? (
            <View style={styles.centerContainer}>
              <ActivityIndicator size="small" color={BrandColors.primary} />
              <Text variant="bodyMedium" style={styles.centerText}>Loading comments...</Text>
            </View>
          ) : commentsError ? (
            <View style={styles.centerContainer}>
              <Text variant="bodyMedium" style={styles.errorText}>Failed to load comments</Text>
              <Button mode="text" onPress={refetchComments} compact>Retry</Button>
            </View>
          ) : comments.length === 0 ? (
            <View style={styles.centerContainer}>
              <Text variant="bodyMedium" style={styles.centerText}>
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

// Dynamic styles function
function createStyles(colors, cardColors, chipColors, avatarColors, isDark) {
  return StyleSheet.create({
    container: {
      flex: 1,
    },
    scrollContent: {
      paddingBottom: 24,
    },
    centerContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
    },
    centerText: {
      marginTop: 8,
      color: colors.textSecondary,
      textAlign: 'center',
    },
    centerTitle: {
      marginTop: 12,
      marginBottom: 8,
      color: colors.text,
      textAlign: 'center',
    },
    errorIcon: {
      backgroundColor: colors.surfaceSecondary,
    },
    errorText: {
      color: BrandColors.error,
      textAlign: 'center',
    },

    // Post Card Styles
    postCard: {
      margin: 12,
      marginBottom: 8,
      backgroundColor: cardColors.background,
    },
    cardContent: {
      padding: 16,
    },
    postHeader: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      marginBottom: 12,
    },
    authorSection: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
      marginRight: 12,
    },
    authorAvatar: {
      backgroundColor: avatarColors.background,
    },
    authorInfo: {
      marginLeft: 12,
      flex: 1,
    },
    authorName: {
      color: colors.text,
      marginBottom: 2,
    },
    postDateText: {
      color: colors.textSecondary,
    },
    editedText: {
      color: colors.textMuted,
      fontStyle: 'italic',
    },
    postTypeChip: {
      height: 32,
    },
    chipEmoji: {
      fontSize: 14,
    },
    chipText: {
      fontSize: 12,
      textTransform: 'capitalize',
    },

    // Post Content Styles
    postContent: {
      marginBottom: 12,
    },
    postTitle: {
      color: colors.text,
      marginBottom: 8,
      lineHeight: 28,
    },
    postText: {
      color: colors.textSecondary,
      lineHeight: 24,
      marginBottom: 12,
    },
    mediaContainer: {
      marginVertical: 12,
      borderRadius: 8,
      overflow: 'hidden',
    },
    mediaImage: {
      width: '100%',
      height: 240,
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
    playButton: {
      backgroundColor: 'rgba(0,0,0,0.4)',
    },

    // Pet Container Styles
    petContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surfaceSecondary,
      padding: 12,
      borderRadius: 8,
      marginTop: 8,
    },
    petAvatar: {
      backgroundColor: avatarColors.background,
    },
    petInfo: {
      marginLeft: 12,
    },
    petLabel: {
      color: colors.textMuted,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    petName: {
      color: colors.text,
      marginTop: 2,
    },
    petSpecies: {
      color: colors.textSecondary,
      marginTop: 1,
    },

    // Post Footer Styles
    postFooter: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: 8,
    },
    visibilityChip: {
      height: 28,
      backgroundColor: colors.surfaceSecondary,
    },
    visibilityText: {
      fontSize: 11,
      textTransform: 'capitalize',
      color: colors.textSecondary,
    },
    actionButtons: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    actionButtonLabel: {
      fontSize: 12,
      color: colors.textSecondary,
    },

    // Comments Section Styles
    commentsSection: {
      margin: 12,
      marginTop: 8,
    },
    commentsTitle: {
      color: colors.text,
      marginBottom: 12,
    },
    commentCard: {
      marginBottom: 12,
      backgroundColor: cardColors.background,
    },
    commentFormContent: {
      padding: 12,
    },
    replyingToContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 8,
      padding: 8,
      backgroundColor: colors.primary + '15',
      borderRadius: 6,
    },
    replyingToText: {
      color: colors.primary,
    },
    closeReplyButton: {
      margin: 0,
    },
    commentInput: {
      marginBottom: 8,
      backgroundColor: 'transparent',
    },
    formActions: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      alignItems: 'center',
      gap: 8,
    },
    submitButton: {
      minWidth: 80,
    },

    // Comments List Styles
    commentsList: {
      gap: 8,
    },
    commentContainer: {
      padding: 12,
      backgroundColor: colors.surfaceSecondary,
      borderRadius: 8,
      marginBottom: 8,
    },
    replyContainer: {
      marginLeft: 16,
      marginTop: 8,
      borderLeftWidth: 2,
      borderLeftColor: colors.border,
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
    commentAvatar: {
      backgroundColor: avatarColors.background,
    },
    commentAuthorInfo: {
      marginLeft: 8,
      flex: 1,
    },
    commentAuthorName: {
      color: colors.text,
    },
    commentDate: {
      color: colors.textSecondary,
      marginTop: 1,
    },
    commentActions: {
      flexDirection: 'row',
    },
    commentContent: {
      marginLeft: 44,
    },
    commentText: {
      color: colors.text,
      lineHeight: 20,
      marginBottom: 4,
    },
    replyButton: {
      alignSelf: 'flex-start',
      marginTop: 4,
    },
    replyButtonLabel: {
      fontSize: 12,
      color: colors.textSecondary,
    },

    // Edit Comment Styles
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
      gap: 8,
    },
    saveButton: {
      minWidth: 60,
    },
    repliesContainer: {
      marginTop: 8,
    },
    actionButton: {
      margin: 0,
      minWidth: 48,
      minHeight: 48,
    },
  });
}