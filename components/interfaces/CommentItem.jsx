// components/interfaces/CommentItem.jsx
import React, { useState } from 'react';
import { View, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { 
  Text, 
  Avatar, 
  Button,
  IconButton,
  TextInput
} from 'react-native-paper';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useAuth } from '@/contexts/AuthContext';

export default function CommentItem({ 
  comment,
  onUserPress,
  onReply,
  onEdit,
  onDelete,
  isReply = false,
  depth = 0,
  maxDepth = 3,
  style
}) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { user } = useAuth();
  
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!comment) return null;

  const isOwnComment = comment.user_id === user?.sub;
  const author = comment.author || {};
  const canReply = depth < maxDepth && !isReply;

  const commentDate = new Date(comment.created_at).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  const handleUserPress = () => {
    if (!isOwnComment && author.id) {
      onUserPress?.(author.id);
    }
  };

  const handleReply = () => {
    if (canReply) {
      onReply?.(comment);
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
    setEditContent(comment.content);
  };

  const handleSaveEdit = async () => {
    if (!editContent.trim()) return;

    setIsSubmitting(true);
    try {
      await onEdit?.(comment.id, editContent.trim());
      setIsEditing(false);
    } catch (error) {
      Alert.alert('Error', 'Failed to update comment');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditContent(comment.content);
  };

  const handleDelete = () => {
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
          onPress: () => onDelete?.(comment),
        },
      ]
    );
  };

  const renderHeader = () => (
    <View style={styles.commentHeader}>
      <TouchableOpacity 
        style={styles.commentAuthor}
        onPress={handleUserPress}
        disabled={isOwnComment}
      >
        {author.picture ? (
          <Avatar.Image size={32} source={{ uri: author.picture }} />
        ) : (
          <Avatar.Text 
            size={32} 
            label={(author.name?.charAt(0) || 'U').toUpperCase()}
            backgroundColor={isDark ? '#444' : '#e0e0e0'}
            color={isDark ? '#fff' : '#666'}
          />
        )}
        <View style={styles.commentAuthorInfo}>
          <Text style={styles.commentAuthorName}>
            {author.name || 'Anonymous User'}
            {isOwnComment && ' (You)'}
          </Text>
          <Text style={styles.commentDate}>
            {commentDate}
            {comment.is_edited && ' • Edited'}
          </Text>
        </View>
      </TouchableOpacity>

      {isOwnComment && !isEditing && (
        <View style={styles.commentActions}>
          <IconButton
            icon="pencil"
            size={16}
            onPress={handleEdit}
            style={styles.actionButton}
          />
          <IconButton
            icon="delete"
            size={16}
            onPress={handleDelete}
            iconColor="#E74C3C"
            style={styles.actionButton}
          />
        </View>
      )}
    </View>
  );

  const renderContent = () => {
    if (isEditing) {
      return (
        <View style={styles.editContainer}>
          <TextInput
            value={editContent}
            onChangeText={setEditContent}
            style={styles.editInput}
            mode="outlined"
            multiline
            placeholder="Edit your comment..."
            disabled={isSubmitting}
          />
          <View style={styles.editActions}>
            <Button 
              mode="text" 
              onPress={handleCancelEdit}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button 
              mode="contained" 
              onPress={handleSaveEdit}
              disabled={!editContent.trim() || isSubmitting}
              loading={isSubmitting}
              style={styles.saveButton}
            >
              Save
            </Button>
          </View>
        </View>
      );
    }

    // Handle deleted comments
    if (comment.is_deleted) {
      return (
        <Text style={styles.deletedComment}>
          [Comment deleted]
        </Text>
      );
    }

    return (
      <>
        <Text style={styles.commentText}>{comment.content}</Text>
        {canReply && (
          <Button 
            mode="text" 
            compact
            onPress={handleReply}
            style={styles.replyButton}
            labelStyle={styles.replyButtonLabel}
          >
            Reply
          </Button>
        )}
      </>
    );
  };

  const renderReplies = () => {
    if (isReply || !comment.replies || comment.replies.length === 0) {
      return null;
    }

    return (
      <View style={styles.repliesContainer}>
        {comment.replies.map(reply => (
          <CommentItem
            key={reply.id}
            comment={reply}
            onUserPress={onUserPress}
            onReply={onReply}
            onEdit={onEdit}
            onDelete={onDelete}
            isReply={true}
            depth={depth + 1}
            maxDepth={maxDepth}
          />
        ))}
      </View>
    );
  };

  return (
    <View style={[
      styles.commentContainer,
      isReply && styles.replyContainer,
      isDark && styles.commentContainerDark,
      style
    ]}>
      {renderHeader()}
      
      <View style={[
        styles.commentContent,
        isReply && styles.replyContent
      ]}>
        {renderContent()}
      </View>

      {renderReplies()}
    </View>
  );
}

const styles = StyleSheet.create({
  commentContainer: {
    marginBottom: 16,
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
  },
  commentContainerDark: {
    backgroundColor: '#333',
  },
  replyContainer: {
    marginLeft: 20,
    marginTop: 8,
    marginBottom: 8,
    borderLeftWidth: 2,
    borderLeftColor: '#e0e0e0',
    paddingLeft: 12,
    backgroundColor: '#f0f0f0',
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
  actionButton: {
    margin: 0,
  },
  commentContent: {
    marginLeft: 40,
  },
  replyContent: {
    marginLeft: 20,
  },
  commentText: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
  deletedComment: {
    fontSize: 14,
    fontStyle: 'italic',
    opacity: 0.5,
    marginBottom: 8,
  },
  replyButton: {
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  replyButtonLabel: {
    fontSize: 12,
  },
  editContainer: {
    marginBottom: 8,
  },
  editInput: {
    marginBottom: 8,
    backgroundColor: 'transparent',
  },
  editActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  saveButton: {
    backgroundColor: '#0a7ea4',
  },
  repliesContainer: {
    marginTop: 8,
  },
});