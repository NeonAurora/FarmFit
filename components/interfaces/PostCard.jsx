// components/interfaces/PostCard.jsx
import React from 'react';
import { View, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { 
  Card, 
  Text, 
  Avatar, 
  Chip,
  Button,
  IconButton
} from 'react-native-paper';
import { ThemedText } from '@/components/ThemedText';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useAuth } from '@/contexts/AuthContext';

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

export default function PostCard({ 
  post, 
  onPress,
  onUserPress,
  onPetPress,
  variant = 'default', // 'default', 'compact', 'detailed'
  showAuthor = true,
  showInteractions = true,
  contentLines = 4,
  style
}) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { user } = useAuth();
  
  if (!post) return null;

  const isOwnPost = post.user_id === user?.sub;
  const author = post.author || {};

  const postDate = new Date(post.created_at).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    ...(variant === 'detailed' && { 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  });

  const handlePostPress = () => {
    onPress?.(post.id);
  };

  const handleUserPress = () => {
    if (!isOwnPost && author.id) {
      onUserPress?.(author.id);
    }
  };

  const handlePetPress = () => {
    if (post.pet?.id) {
      onPetPress?.(post.pet.id);
    }
  };

  const handleMediaPress = () => {
    // Handle media interaction
    onPress?.(post.id);
  };

  const renderAuthorInfo = () => {
    if (!showAuthor) return null;

    return (
      <TouchableOpacity 
        style={styles.authorInfo}
        onPress={handleUserPress}
        disabled={isOwnPost}
      >
        {author.picture ? (
          <Avatar.Image 
            size={variant === 'compact' ? 35 : 45} 
            source={{ uri: author.picture }} 
          />
        ) : (
          <Avatar.Text 
            size={variant === 'compact' ? 35 : 45}
            label={(author.name?.charAt(0) || author.email?.charAt(0) || 'U').toUpperCase()}
            backgroundColor={isDark ? '#444' : '#e0e0e0'}
            color={isDark ? '#fff' : '#666'}
          />
        )}
        <View style={styles.authorDetails}>
          <Text style={[
            styles.authorName,
            variant === 'compact' && styles.authorNameCompact
          ]}>
            {author.name || 'Anonymous User'}
            {isOwnPost && ' (You)'}
          </Text>
          <View style={styles.postMeta}>
            <Text style={[
              styles.postDate,
              variant === 'compact' && styles.postDateCompact
            ]}>
              {postDate}
            </Text>
            {post.is_edited && (
              <Text style={styles.editedIndicator}> • Edited</Text>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderPostType = () => (
    <Chip 
      icon={() => <Text>{POST_TYPE_EMOJIS[post.post_type] || '📝'}</Text>}
      style={[
        styles.postTypeChip,
        variant === 'compact' && styles.postTypeChipCompact,
        { backgroundColor: (POST_TYPE_COLORS[post.post_type] || '#2196F3') + '20' }
      ]}
      textStyle={[
        styles.postTypeText,
        variant === 'compact' && styles.postTypeTextCompact
      ]}
    >
      {post.post_type}
    </Chip>
  );

  const renderMedia = () => {
    if (!post.media_url) return null;

    return (
      <TouchableOpacity onPress={handleMediaPress} style={styles.mediaContainer}>
        {post.post_type === 'image' || post.post_type === 'mixed' ? (
          <Image 
            source={{ uri: post.media_url }} 
            style={[
              styles.mediaImage,
              variant === 'compact' && styles.mediaImageCompact
            ]}
            resizeMode="cover"
          />
        ) : post.post_type === 'video' ? (
          <View style={[
            styles.videoContainer,
            variant === 'compact' && styles.videoContainerCompact
          ]}>
            <Image 
              source={{ uri: post.media_url }} 
              style={[
                styles.mediaImage,
                variant === 'compact' && styles.mediaImageCompact
              ]}
              resizeMode="cover"
            />
            <View style={styles.videoOverlay}>
              <IconButton 
                icon="play-circle" 
                size={variant === 'compact' ? 30 : 50} 
                iconColor="#fff"
              />
            </View>
          </View>
        ) : null}
      </TouchableOpacity>
    );
  };

  const renderPetInfo = () => {
    if (!post.pet) return null;

    return (
      <TouchableOpacity 
        style={[
          styles.petContainer,
          variant === 'compact' && styles.petContainerCompact
        ]}
        onPress={handlePetPress}
      >
        {post.pet.image_url ? (
          <Avatar.Image 
            size={variant === 'compact' ? 24 : 30} 
            source={{ uri: post.pet.image_url }} 
          />
        ) : (
          <Avatar.Icon 
            size={variant === 'compact' ? 24 : 30} 
            icon="paw" 
            backgroundColor="#e0e0e0" 
          />
        )}
        <View style={styles.petInfo}>
          <Text style={[
            styles.petLabel,
            variant === 'compact' && styles.petLabelCompact
          ]}>
            About
          </Text>
          <Text style={[
            styles.petName,
            variant === 'compact' && styles.petNameCompact
          ]}>
            {post.pet.name}
          </Text>
          {variant !== 'compact' && post.pet.species && (
            <Text style={styles.petSpecies}>{post.pet.species}</Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const renderFooter = () => {
    if (!showInteractions && variant !== 'detailed') return null;

    return (
      <View style={styles.postFooter}>
        <View style={styles.visibilityContainer}>
          <Chip 
            icon={
              post.visibility === 'public' ? 'earth' :
              post.visibility === 'connections' ? 'account-group' : 'lock'
            }
            style={[
              styles.visibilityChip,
              variant === 'compact' && styles.visibilityChipCompact
            ]}
            textStyle={[
              styles.visibilityText,
              variant === 'compact' && styles.visibilityTextCompact
            ]}
          >
            {post.visibility}
          </Chip>
        </View>

        {showInteractions && (
          <View style={styles.interactionContainer}>
            <Button 
              mode="text" 
              compact
              onPress={handlePostPress}
              style={styles.interactionButton}
              labelStyle={variant === 'compact' && styles.interactionButtonLabelCompact}
            >
              💬 {post._count?.count || 0}
            </Button>
          </View>
        )}
      </View>
    );
  };

  return (
    <TouchableOpacity onPress={handlePostPress} style={style}>
      <Card style={[
        styles.postCard, 
        isDark && styles.postCardDark,
        variant === 'compact' && styles.postCardCompact
      ]}>
        <Card.Content style={[
          styles.cardContent,
          variant === 'compact' && styles.cardContentCompact
        ]}>
          {/* Header */}
          <View style={styles.postHeader}>
            {renderAuthorInfo()}
            <View style={styles.postTypeContainer}>
              {renderPostType()}
            </View>
          </View>

          {/* Content */}
          <View style={styles.postContent}>
            <Text style={[
              styles.postTitle,
              variant === 'compact' && styles.postTitleCompact
            ]} numberOfLines={variant === 'compact' ? 2 : 3}>
              {post.title}
            </Text>
            
            {post.content && (
              <Text 
                style={[
                  styles.postText,
                  variant === 'compact' && styles.postTextCompact
                ]} 
                numberOfLines={variant === 'compact' ? 2 : contentLines}
              >
                {post.content}
              </Text>
            )}

            {renderMedia()}
            {renderPetInfo()}
          </View>

          {/* Footer */}
          {renderFooter()}
        </Card.Content>
      </Card>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  postCard: {
    marginBottom: 16,
    elevation: 2,
  },
  postCardDark: {
    backgroundColor: '#333',
  },
  postCardCompact: {
    marginBottom: 12,
  },
  cardContent: {
    padding: 16,
  },
  cardContentCompact: {
    padding: 12,
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
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
  },
  authorNameCompact: {
    fontSize: 14,
  },
  postMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  postDate: {
    fontSize: 12,
    opacity: 0.6,
  },
  postDateCompact: {
    fontSize: 11,
  },
  editedIndicator: {
    fontSize: 12,
    opacity: 0.6,
    fontStyle: 'italic',
  },
  postTypeContainer: {
    marginLeft: 8,
  },
  postTypeChip: {
    height: 30,
  },
  postTypeChipCompact: {
    height: 26,
  },
  postTypeText: {
    fontSize: 11,
    textTransform: 'capitalize',
  },
  postTypeTextCompact: {
    fontSize: 10,
  },
  postContent: {
    marginBottom: 12,
  },
  postTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
    lineHeight: 24,
  },
  postTitleCompact: {
    fontSize: 16,
    marginBottom: 6,
    lineHeight: 22,
  },
  postText: {
    fontSize: 14,
    lineHeight: 20,
    opacity: 0.8,
    marginBottom: 8,
  },
  postTextCompact: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 6,
  },
  mediaContainer: {
    marginVertical: 8,
    borderRadius: 8,
    overflow: 'hidden',
  },
  mediaImage: {
    width: '100%',
    height: 200,
  },
  mediaImageCompact: {
    height: 120,
  },
  videoContainer: {
    position: 'relative',
  },
  videoContainerCompact: {
    // Specific compact video styles if needed
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
    padding: 8,
    borderRadius: 8,
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  petContainerCompact: {
    padding: 6,
    marginTop: 6,
  },
  petInfo: {
    marginLeft: 8,
  },
  petLabel: {
    fontSize: 10,
    opacity: 0.6,
    textTransform: 'uppercase',
  },
  petLabelCompact: {
    fontSize: 9,
  },
  petName: {
    fontSize: 14,
    fontWeight: '500',
  },
  petNameCompact: {
    fontSize: 12,
  },
  petSpecies: {
    fontSize: 12,
    opacity: 0.7,
  },
  postFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  visibilityContainer: {
    flex: 1,
  },
  visibilityChip: {
    height: 28,
    alignSelf: 'flex-start',
  },
  visibilityChipCompact: {
    height: 24,
  },
  visibilityText: {
    fontSize: 10,
    textTransform: 'capitalize',
  },
  visibilityTextCompact: {
    fontSize: 9,
  },
  interactionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  interactionButton: {
    minWidth: 0,
  },
  interactionButtonLabelCompact: {
    fontSize: 12,
  },
});