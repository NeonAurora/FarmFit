// app/(main)/(screens)/userPostsScreen.jsx
import React, { useState, useCallback } from 'react';
import { FlatList, StyleSheet, View, TouchableOpacity, Image } from 'react-native';
import { 
  Card, 
  Text, 
  Avatar, 
  ActivityIndicator, 
  FAB, 
  Searchbar, 
  IconButton, 
  Chip,
  SegmentedButtons,
  Button,
  Divider,
  Surface
} from 'react-native-paper';
import { useFocusEffect } from '@react-navigation/native';
import { ThemedView } from '@/components/themes/ThemedView';
import { ThemedText } from '@/components/themes/ThemedText';
import { useColorScheme } from '@/hooks/useColorScheme.native';
import { useAuth } from '@/contexts/AuthContext';
import { useLocalSearchParams, router } from 'expo-router';
import { usePosts } from '@/hooks/usePosts';
import { usePostStats } from '@/hooks/usePostStats';
import { getUserById } from '@/services/supabase/userService';

// Import theme colors
import { Colors, BrandColors, PostTypeColors } from '@/constants/Colors';
import { useThemeColor, useCardColors, useChipColors, useAvatarColors, useFabColors } from '@/hooks/useThemeColor';

const POST_TYPE_EMOJIS = {
  text: '📝',
  image: '📸',
  video: '🎥',
  article: '📰',
  journal: '📔',
  mixed: '🎭'
};

export default function UserPostsScreen() {
  const { userId } = useLocalSearchParams();
  const { colorScheme, isDark } = useColorScheme();
  const { user: currentUser } = useAuth();
  
  // Theme-aware colors
  const colors = Colors[colorScheme];
  const cardColors = useCardColors();
  const chipColors = useChipColors();
  const avatarColors = useAvatarColors();
  const fabColors = useFabColors();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedPostType, setSelectedPostType] = useState('all');
  const [selectedVisibility, setSelectedVisibility] = useState('all');
  const [userProfile, setUserProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(true);

  const targetUserId = userId || currentUser?.sub;
  const isOwnProfile = targetUserId === currentUser?.sub;

  // Create dynamic styles
  const styles = createStyles(colors, cardColors, chipColors, avatarColors, fabColors, isDark);

  // Use the posts hook with user-specific filtering
  const { 
    posts, 
    loading, 
    error, 
    hasMore, 
    refreshing,
    loadMore, 
    refresh, 
    refetch 
  } = usePosts({
    feedType: 'user',
    userId: targetUserId,
    postType: selectedPostType,
    visibility: selectedVisibility,
    limit: 15
  });

  // Get user statistics
  const { 
    stats, 
    loading: statsLoading 
  } = usePostStats(targetUserId);

  // Fetch user profile data
  const fetchUserProfile = useCallback(async () => {
    if (!targetUserId) return;
    
    setProfileLoading(true);
    try {
      if (isOwnProfile) {
        // Use current user data
        setUserProfile({
          id: currentUser.sub,
          name: currentUser.name,
          email: currentUser.email,
          picture: currentUser.picture
        });
      } else {
        // Fetch other user's profile
        const profile = await getUserById(targetUserId);
        setUserProfile(profile);
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
    } finally {
      setProfileLoading(false);
    }
  }, [targetUserId, isOwnProfile, currentUser]);

  // Refresh when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      fetchUserProfile();
      if (posts.length === 0) {
        refetch();
      }
    }, [fetchUserProfile, refetch])
  );

  const handleCreatePost = () => {
    router.push("/createPostScreen");
  };

  const handlePostPress = (postId) => {
    router.push({
      pathname: '/postViewScreen',
      params: { postId }
    });
  };

  const handleUserProfilePress = () => {
    if (!isOwnProfile && userProfile) {
      router.push({
        pathname: '/userProfileScreen',
        params: { userId: userProfile.id }
      });
    } else if (isOwnProfile) {
      router.push('/profile');
    }
  };

  const handlePetPress = (petId) => {
    router.push({
      pathname: '/petProfileScreen',
      params: { petId }
    });
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedPostType('all');
    setSelectedVisibility('all');
    setShowFilters(false);
  };

  const getFilteredPosts = () => {
    if (!searchQuery) return posts;
    
    return posts.filter(post => 
      post.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      post.content?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  const postTypeButtons = [
    { value: 'all', label: 'All' },
    { value: 'text', label: '📝' },
    { value: 'image', label: '📸' },
    { value: 'video', label: '🎥' },
    { value: 'article', label: '📰' },
    { value: 'journal', label: '📔' }
  ];

  const visibilityButtons = isOwnProfile ? [
    { value: 'all', label: 'All' },
    { value: 'public', label: 'Public' },
    { value: 'connections', label: 'Friends' },
    { value: 'private', label: 'Private' }
  ] : [
    { value: 'all', label: 'All' },
    { value: 'public', label: 'Public' }
  ];

  const renderPostCard = ({ item }) => {
    const postDate = new Date(item.created_at).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    return (
      <TouchableOpacity 
        onPress={() => handlePostPress(item.id)}
        activeOpacity={0.7}
      >
        <Card style={styles.postCard} mode="contained">
          <Card.Content style={styles.cardContent}>
            {/* Post header with type and date */}
            <View style={styles.postHeader}>
              <View style={styles.postMeta}>
                <Chip 
                  icon={() => <Text style={styles.chipEmoji}>{POST_TYPE_EMOJIS[item.post_type] || '📝'}</Text>}
                  style={[
                    styles.postTypeChip, 
                    { 
                      backgroundColor: (PostTypeColors[item.post_type] || BrandColors.primary) + '15'
                    }
                  ]}
                  textStyle={[styles.chipText, { color: PostTypeColors[item.post_type] || BrandColors.primary }]}
                  compact
                >
                  {item.post_type}
                </Chip>
                <Text variant="bodySmall" style={styles.postDate}>{postDate}</Text>
              </View>

              <Chip 
                icon={
                  item.visibility === 'public' ? 'earth' :
                  item.visibility === 'connections' ? 'account-group' : 'lock'
                }
                style={styles.visibilityChip}
                textStyle={styles.visibilityText}
                compact
              >
                {item.visibility}
              </Chip>
            </View>

            {/* Post content */}
            <View style={styles.postContent}>
              <Text variant="titleMedium" style={styles.postTitle} numberOfLines={2}>
                {item.title}
              </Text>
              
              {item.content && (
                <Text 
                  variant="bodyMedium"
                  style={styles.postText} 
                  numberOfLines={3}
                >
                  {item.content}
                </Text>
              )}

              {/* Media preview */}
              {item.media_url && (
                <View style={styles.mediaContainer}>
                  {item.post_type === 'image' || item.post_type === 'mixed' ? (
                    <Image 
                      source={{ uri: item.media_url }} 
                      style={styles.mediaPreview}
                      resizeMode="cover"
                    />
                  ) : item.post_type === 'video' ? (
                    <View style={styles.videoPreview}>
                      <Surface style={styles.videoPreviewSurface}>
                        <IconButton 
                          icon="play-circle" 
                          size={32} 
                          iconColor="rgba(255,255,255,0.9)"
                        />
                      </Surface>
                    </View>
                  ) : null}
                </View>
              )}

              {/* Pet information */}
              {item.pet && (
                <TouchableOpacity 
                  style={styles.petContainer}
                  onPress={() => handlePetPress(item.pet.id)}
                  activeOpacity={0.7}
                >
                  {item.pet.image_url ? (
                    <Avatar.Image size={24} source={{ uri: item.pet.image_url }} />
                  ) : (
                    <Avatar.Icon 
                      size={24} 
                      icon="paw" 
                      style={styles.petAvatar}
                    />
                  )}
                  <Text variant="labelMedium" style={styles.petName}>{item.pet.name}</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Post footer */}
            <View style={styles.postFooter}>
              <Button 
                mode="text" 
                compact
                onPress={() => handlePostPress(item.id)}
                style={styles.interactionButton}
                labelStyle={styles.interactionLabel}
                icon="comment-outline"
              >
                {item._count?.count || 0}
              </Button>
              
              {item.is_edited && (
                <Text variant="bodySmall" style={styles.editedIndicator}>Edited</Text>
              )}
            </View>
          </Card.Content>
        </Card>
      </TouchableOpacity>
    );
  };

  const renderUserHeader = () => {
    if (profileLoading) {
      return (
        <View style={styles.headerLoading}>
          <ActivityIndicator size="small" color={BrandColors.primary} />
        </View>
      );
    }

    if (!userProfile) return null;

    return (
      <Card style={styles.userHeaderCard} mode="contained">
        <Card.Content style={styles.userHeaderContent}>
          <TouchableOpacity 
            style={styles.userSection}
            onPress={handleUserProfilePress}
            activeOpacity={0.7}
          >
            {userProfile.picture ? (
              <Avatar.Image size={56} source={{ uri: userProfile.picture }} />
            ) : (
              <Avatar.Text 
                size={56} 
                label={(userProfile.name?.charAt(0) || userProfile.email?.charAt(0) || 'U').toUpperCase()}
                style={styles.userAvatar}
              />
            )}
            <View style={styles.userInfo}>
              <Text variant="titleMedium" style={styles.userName}>
                {userProfile.name || 'Anonymous User'}
                {isOwnProfile && ' (You)'}
              </Text>
              <Text variant="bodySmall" style={styles.userEmail}>{userProfile.email}</Text>
            </View>
            {!isOwnProfile && (
              <IconButton 
                icon="chevron-right" 
                size={20} 
                iconColor={colors.textSecondary}
              />
            )}
          </TouchableOpacity>

          {/* User Stats */}
          {!statsLoading && stats && (
            <>
              <Divider style={styles.statsDivider} />
              <View style={styles.statsContainer}>
                <View style={styles.statItem}>
                  <Text variant="titleMedium" style={styles.statNumber}>{stats.posts?.total || 0}</Text>
                  <Text variant="bodySmall" style={styles.statLabel}>Posts</Text>
                </View>
                <View style={styles.statItem}>
                  <Text variant="titleMedium" style={styles.statNumber}>{stats.comments?.total || 0}</Text>
                  <Text variant="bodySmall" style={styles.statLabel}>Comments</Text>
                </View>
                <View style={styles.statItem}>
                  <Text variant="titleMedium" style={styles.statNumber}>{stats.posts?.thisMonth || 0}</Text>
                  <Text variant="bodySmall" style={styles.statLabel}>This Month</Text>
                </View>
                <View style={styles.statItem}>
                  <Text variant="titleMedium" style={styles.statNumber}>{stats.totalActivity || 0}</Text>
                  <Text variant="bodySmall" style={styles.statLabel}>Activity</Text>
                </View>
              </View>
            </>
          )}
        </Card.Content>
      </Card>
    );
  };

  const renderEmptyState = () => {
    const isFiltered = searchQuery || selectedPostType !== 'all' || selectedVisibility !== 'all';
    
    if (isFiltered) {
      return (
        <View style={styles.emptyContainer}>
          <Avatar.Icon 
            size={64} 
            icon="magnify" 
            style={styles.emptyIcon}
          />
          <Text variant="headlineSmall" style={styles.emptyTitle}>
            No Posts Found
          </Text>
          <Text variant="bodyMedium" style={styles.emptyText}>
            No posts match your current filters
          </Text>
          <Button 
            mode="outlined" 
            onPress={clearFilters} 
            style={styles.actionButton}
            icon="filter-off"
          >
            Clear Filters
          </Button>
        </View>
      );
    }

    return (
      <View style={styles.emptyContainer}>
        <Avatar.Icon 
          size={64} 
          icon="post" 
          style={styles.emptyIcon}
        />
        <Text variant="headlineSmall" style={styles.emptyTitle}>
          {isOwnProfile ? 'No Posts Yet' : 'No Public Posts'}
        </Text>
        <Text variant="bodyMedium" style={styles.emptyText}>
          {isOwnProfile 
            ? "You haven't shared any stories yet. Create your first post!" 
            : `${userProfile?.name || 'This user'} hasn't shared any public posts yet.`
          }
        </Text>
        {isOwnProfile && (
          <Button 
            mode="contained" 
            onPress={handleCreatePost}
            style={styles.createButton}
            icon="plus"
          >
            Create Your First Post
          </Button>
        )}
      </View>
    );
  };

  if (loading && posts.length === 0) {
    return (
      <ThemedView style={styles.centerContainer}>
        <ActivityIndicator size="large" color={BrandColors.primary} />
        <Text variant="bodyMedium" style={styles.centerText}>
          Loading {isOwnProfile ? 'your' : 'user'} posts...
        </Text>
      </ThemedView>
    );
  }

  if (error && posts.length === 0) {
    return (
      <ThemedView style={styles.centerContainer}>
        <Avatar.Icon 
          size={64} 
          icon="alert-circle" 
          style={styles.errorIcon}
        />
        <Text variant="headlineSmall" style={styles.centerTitle}>
          Error Loading Posts
        </Text>
        <Text variant="bodyMedium" style={styles.errorText}>{error}</Text>
        <Button 
          mode="contained" 
          onPress={refetch}
          style={styles.actionButton}
          icon="refresh"
        >
          Try Again
        </Button>
      </ThemedView>
    );
  }

  const filteredPosts = getFilteredPosts();

  return (
    <ThemedView style={styles.container}>
      {/* Search and Filter Header */}
      <Surface style={styles.searchContainer} elevation={1}>
        <Searchbar
          placeholder="Search posts..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchBar}
        />
        <IconButton
          icon="tune"
          size={24}
          onPress={() => setShowFilters(!showFilters)}
          style={styles.filterButton}
          iconColor={showFilters ? BrandColors.primary : colors.textSecondary}
        />
      </Surface>

      {/* Filters */}
      {showFilters && (
        <Surface style={styles.filtersContainer} elevation={1}>
          <Text variant="labelLarge" style={styles.filterLabel}>Post Type</Text>
          <SegmentedButtons
            value={selectedPostType}
            onValueChange={setSelectedPostType}
            buttons={postTypeButtons}
            style={styles.filterButtons}
          />
          
          <Text variant="labelLarge" style={styles.filterLabel}>Visibility</Text>
          <SegmentedButtons
            value={selectedVisibility}
            onValueChange={setSelectedVisibility}
            buttons={visibilityButtons}
            style={styles.filterButtons}
          />

          {(searchQuery || selectedPostType !== 'all' || selectedVisibility !== 'all') && (
            <Button 
              mode="text" 
              onPress={clearFilters} 
              style={styles.clearFiltersButton}
              icon="filter-off"
              compact
            >
              Clear All Filters
            </Button>
          )}
        </Surface>
      )}

      {/* Posts List */}
      <FlatList
        data={filteredPosts}
        renderItem={renderPostCard}
        keyExtractor={item => item.id.toString()}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={renderUserHeader}
        ListEmptyComponent={renderEmptyState}
        refreshing={refreshing}
        onRefresh={refresh}
        onEndReached={loadMore}
        onEndReachedThreshold={0.1}
        ListFooterComponent={() => 
          hasMore && posts.length > 0 ? (
            <View style={styles.loadMoreContainer}>
              <ActivityIndicator size="small" color={BrandColors.primary} />
              <Text variant="bodyMedium" style={styles.loadMoreText}>Loading more posts...</Text>
            </View>
          ) : null
        }
        showsVerticalScrollIndicator={false}
      />

      {/* Create Post FAB - Only for own profile */}
      {isOwnProfile && (
        <FAB
          icon="plus"
          style={styles.fab}
          onPress={handleCreatePost}
          label="Post"
          mode="elevated"
        />
      )}
    </ThemedView>
  );
}

// Dynamic styles function
function createStyles(colors, cardColors, chipColors, avatarColors, fabColors, isDark) {
  return StyleSheet.create({
    container: {
      flex: 1,
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
      marginBottom: 16,
    },

    // Search and Filters
    searchContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 12,
      paddingVertical: 8,
      backgroundColor: colors.surface,
    },
    searchBar: {
      flex: 1,
      backgroundColor: 'transparent',
    },
    filterButton: {
      marginLeft: 4,
    },
    filtersContainer: {
      padding: 12,
      backgroundColor: colors.surface,
    },
    filterLabel: {
      color: colors.text,
      marginBottom: 8,
      marginTop: 8,
    },
    filterButtons: {
      marginBottom: 8,
    },
    clearFiltersButton: {
      alignSelf: 'flex-start',
      marginTop: 8,
    },

    // User Header
    headerLoading: {
      padding: 16,
      alignItems: 'center',
    },
    userHeaderCard: {
      margin: 12,
      marginBottom: 8,
      backgroundColor: cardColors.background,
    },
    userHeaderContent: {
      padding: 16,
    },
    userSection: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    userAvatar: {
      backgroundColor: avatarColors.background,
    },
    userInfo: {
      marginLeft: 12,
      flex: 1,
    },
    userName: {
      color: colors.text,
      marginBottom: 2,
    },
    userEmail: {
      color: colors.textSecondary,
    },
    statsDivider: {
      marginVertical: 12,
      backgroundColor: colors.border,
    },
    statsContainer: {
      flexDirection: 'row',
      justifyContent: 'space-around',
    },
    statItem: {
      alignItems: 'center',
    },
    statNumber: {
      color: BrandColors.primary,
      fontWeight: 'bold',
    },
    statLabel: {
      color: colors.textSecondary,
      marginTop: 2,
    },

    // Post List
    listContent: {
      paddingHorizontal: 12,
      paddingBottom: 100,
    },
    postCard: {
      marginBottom: 8,
      backgroundColor: cardColors.background,
    },
    cardContent: {
      padding: 12,
    },
    postHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 8,
    },
    postMeta: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    postTypeChip: {
      marginRight: 8,
      height: 28,
    },
    chipEmoji: {
      fontSize: 12,
    },
    chipText: {
      fontSize: 11,
      textTransform: 'capitalize',
    },
    postDate: {
      color: colors.textSecondary,
    },
    visibilityChip: {
      height: 26,
      backgroundColor: colors.surfaceSecondary,
    },
    visibilityText: {
      fontSize: 10,
      textTransform: 'capitalize',
      color: colors.textSecondary,
    },

    // Post Content
    postContent: {
      marginBottom: 8,
    },
    postTitle: {
      color: colors.text,
      marginBottom: 4,
      lineHeight: 20,
    },
    postText: {
      color: colors.textSecondary,
      lineHeight: 18,
      marginBottom: 6,
    },
    mediaContainer: {
      marginVertical: 6,
      borderRadius: 6,
      overflow: 'hidden',
    },
    mediaPreview: {
      width: '100%',
      height: 120,
    },
    videoPreview: {
      width: '100%',
      height: 120,
      backgroundColor: colors.surfaceSecondary,
      justifyContent: 'center',
      alignItems: 'center',
    },
    videoPreviewSurface: {
      backgroundColor: 'rgba(0,0,0,0.4)',
      borderRadius: 20,
    },
    petContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surfaceSecondary,
      padding: 6,
      borderRadius: 6,
      marginTop: 6,
      alignSelf: 'flex-start',
    },
    petAvatar: {
      backgroundColor: avatarColors.background,
    },
    petName: {
      color: colors.text,
      marginLeft: 6,
    },

    // Post Footer
    postFooter: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: 4,
    },
    interactionButton: {
      minWidth: 0,
    },
    interactionLabel: {
      fontSize: 12,
      color: colors.textSecondary,
    },
    editedIndicator: {
      color: colors.textMuted,
      fontStyle: 'italic',
    },

    // Empty States
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
      marginTop: 40,
    },
    emptyIcon: {
      backgroundColor: colors.surfaceSecondary,
    },
    emptyTitle: {
      marginTop: 12,
      marginBottom: 8,
      color: colors.text,
      textAlign: 'center',
    },
    emptyText: {
      textAlign: 'center',
      color: colors.textSecondary,
      marginBottom: 16,
      lineHeight: 20,
    },
    actionButton: {
      marginTop: 8,
    },
    createButton: {
      marginTop: 8,
      backgroundColor: BrandColors.primary,
    },

    // Load More
    loadMoreContainer: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 16,
    },
    loadMoreText: {
      marginLeft: 8,
      color: colors.textSecondary,
    },

    // FAB
    fab: {
      position: 'absolute',
      margin: 16,
      right: 0,
      bottom: 0,
      backgroundColor: BrandColors.primary,
    },
  });
}