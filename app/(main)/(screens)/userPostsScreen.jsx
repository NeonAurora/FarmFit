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
  Divider
} from 'react-native-paper';
import { useFocusEffect } from '@react-navigation/native';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useAuth } from '@/contexts/AuthContext';
import { useLocalSearchParams, router } from 'expo-router';
import { usePosts } from '@/hooks/usePosts';
import { usePostStats } from '@/hooks/usePostStats';
import { getUserById } from '@/services/supabase/userService';

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

export default function UserPostsScreen() {
  const { userId } = useLocalSearchParams();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { user: currentUser } = useAuth();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedPostType, setSelectedPostType] = useState('all');
  const [selectedVisibility, setSelectedVisibility] = useState('all');
  const [userProfile, setUserProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(true);

  const targetUserId = userId || currentUser?.sub;
  const isOwnProfile = targetUserId === currentUser?.sub;

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
      <TouchableOpacity onPress={() => handlePostPress(item.id)}>
        <Card style={[styles.postCard, isDark && styles.postCardDark]}>
          <Card.Content style={styles.cardContent}>
            {/* Post header with type and date */}
            <View style={styles.postHeader}>
              <View style={styles.postMeta}>
                <Chip 
                  icon={() => <Text>{POST_TYPE_EMOJIS[item.post_type] || '📝'}</Text>}
                  style={[
                    styles.postTypeChip, 
                    { backgroundColor: (POST_TYPE_COLORS[item.post_type] || '#2196F3') + '20' }
                  ]}
                  textStyle={styles.postTypeText}
                >
                  {item.post_type}
                </Chip>
                <Text style={styles.postDate}>{postDate}</Text>
              </View>

              <View style={styles.visibilityContainer}>
                <Chip 
                  icon={
                    item.visibility === 'public' ? 'earth' :
                    item.visibility === 'connections' ? 'account-group' : 'lock'
                  }
                  style={styles.visibilityChip}
                  textStyle={styles.visibilityText}
                >
                  {item.visibility}
                </Chip>
              </View>
            </View>

            {/* Post content */}
            <View style={styles.postContent}>
              <Text style={styles.postTitle} numberOfLines={2}>
                {item.title}
              </Text>
              
              {item.content && (
                <Text 
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
                      <IconButton 
                        icon="play-circle" 
                        size={30} 
                        iconColor="#fff"
                      />
                    </View>
                  ) : null}
                </View>
              )}

              {/* Pet information */}
              {item.pet && (
                <TouchableOpacity 
                  style={styles.petContainer}
                  onPress={() => handlePetPress(item.pet.id)}
                >
                  {item.pet.image_url ? (
                    <Avatar.Image size={24} source={{ uri: item.pet.image_url }} />
                  ) : (
                    <Avatar.Icon size={24} icon="paw" backgroundColor="#e0e0e0" />
                  )}
                  <Text style={styles.petName}>{item.pet.name}</Text>
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
              >
                💬 {item._count?.count || 0}
              </Button>
              
              {item.is_edited && (
                <Text style={styles.editedIndicator}>Edited</Text>
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
          <ActivityIndicator size="small" color="#0a7ea4" />
        </View>
      );
    }

    if (!userProfile) return null;

    return (
      <Card style={styles.userHeaderCard}>
        <Card.Content>
          <TouchableOpacity 
            style={styles.userHeaderContent}
            onPress={handleUserProfilePress}
          >
            {userProfile.picture ? (
              <Avatar.Image size={60} source={{ uri: userProfile.picture }} />
            ) : (
              <Avatar.Text 
                size={60} 
                label={(userProfile.name?.charAt(0) || userProfile.email?.charAt(0) || 'U').toUpperCase()}
                backgroundColor={isDark ? '#444' : '#2E86DE'}
                color="#fff"
              />
            )}
            <View style={styles.userHeaderInfo}>
              <Text style={styles.userHeaderName}>
                {userProfile.name || 'Anonymous User'}
                {isOwnProfile && ' (You)'}
              </Text>
              <Text style={styles.userHeaderEmail}>{userProfile.email}</Text>
            </View>
            {!isOwnProfile && (
              <IconButton icon="chevron-right" size={20} />
            )}
          </TouchableOpacity>

          {/* User Stats */}
          {!statsLoading && stats && (
            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{stats.posts?.total || 0}</Text>
                <Text style={styles.statLabel}>Posts</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{stats.comments?.total || 0}</Text>
                <Text style={styles.statLabel}>Comments</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{stats.posts?.thisMonth || 0}</Text>
                <Text style={styles.statLabel}>This Month</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{stats.totalActivity || 0}</Text>
                <Text style={styles.statLabel}>Total Activity</Text>
              </View>
            </View>
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
          <Avatar.Icon size={80} icon="magnify" backgroundColor="#e0e0e0" />
          <ThemedText type="title" style={styles.emptyTitle}>
            No Posts Found
          </ThemedText>
          <ThemedText style={styles.emptyText}>
            No posts match your current filters
          </ThemedText>
          <Button mode="outlined" onPress={clearFilters} style={styles.clearButton}>
            Clear Filters
          </Button>
        </View>
      );
    }

    return (
      <View style={styles.emptyContainer}>
        <Avatar.Icon size={80} icon="post" backgroundColor="#e0e0e0" />
        <ThemedText type="title" style={styles.emptyTitle}>
          {isOwnProfile ? 'No Posts Yet' : 'No Public Posts'}
        </ThemedText>
        <ThemedText style={styles.emptyText}>
          {isOwnProfile 
            ? "You haven't shared any stories yet. Create your first post!" 
            : `${userProfile?.name || 'This user'} hasn't shared any public posts yet.`
          }
        </ThemedText>
        {isOwnProfile && (
          <Button 
            mode="contained" 
            onPress={handleCreatePost}
            style={styles.createFirstPostButton}
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
      <ThemedView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0a7ea4" />
        <ThemedText style={styles.loadingText}>
          Loading {isOwnProfile ? 'your' : 'user'} posts...
        </ThemedText>
      </ThemedView>
    );
  }

  if (error && posts.length === 0) {
    return (
      <ThemedView style={styles.errorContainer}>
        <Avatar.Icon size={80} icon="alert-circle" backgroundColor="#e0e0e0" />
        <ThemedText type="title" style={styles.errorTitle}>
          Error Loading Posts
        </ThemedText>
        <ThemedText style={styles.errorText}>{error}</ThemedText>
        <Button 
          mode="contained" 
          onPress={refetch}
          style={styles.retryButton}
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
      <View style={styles.searchContainer}>
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
          iconColor={showFilters ? '#0a7ea4' : undefined}
        />
      </View>

      {/* Filters */}
      {showFilters && (
        <View style={styles.filtersContainer}>
          <Text style={styles.filterLabel}>Post Type:</Text>
          <SegmentedButtons
            value={selectedPostType}
            onValueChange={setSelectedPostType}
            buttons={postTypeButtons}
            style={styles.filterButtons}
          />
          
          <Text style={styles.filterLabel}>Visibility:</Text>
          <SegmentedButtons
            value={selectedVisibility}
            onValueChange={setSelectedVisibility}
            buttons={visibilityButtons}
            style={styles.filterButtons}
          />

          {(searchQuery || selectedPostType !== 'all' || selectedVisibility !== 'all') && (
            <Button mode="text" onPress={clearFilters} style={styles.clearFiltersButton}>
              Clear All Filters
            </Button>
          )}
        </View>
      )}

      <Divider />

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
              <ActivityIndicator size="small" color="#0a7ea4" />
              <Text style={styles.loadMoreText}>Loading more posts...</Text>
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
        />
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  retryButton: {
    marginTop: 8,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 16,
    marginBottom: 0,
  },
  searchBar: {
    flex: 1,
    elevation: 4,
  },
  filterButton: {
    marginLeft: 8,
  },
  filtersContainer: {
    padding: 16,
    paddingTop: 8,
  },
  filterLabel: {
    fontSize: 14,
    marginBottom: 8,
    marginTop: 8,
    fontWeight: '500',
  },
  filterButtons: {
    marginBottom: 8,
  },
  clearFiltersButton: {
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  headerLoading: {
    padding: 20,
    alignItems: 'center',
  },
  userHeaderCard: {
    margin: 16,
    marginBottom: 8,
  },
  userHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  userHeaderInfo: {
    marginLeft: 16,
    flex: 1,
  },
  userHeaderName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 2,
  },
  userHeaderEmail: {
    fontSize: 14,
    opacity: 0.7,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0a7ea4',
  },
  statLabel: {
    fontSize: 12,
    opacity: 0.7,
    marginTop: 2,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  postCard: {
    marginBottom: 12,
    elevation: 2,
  },
  postCardDark: {
    backgroundColor: '#333',
  },
  cardContent: {
    padding: 16,
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  postMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  postTypeChip: {
    marginRight: 8,
    height: 28,
  },
  postTypeText: {
    fontSize: 10,
    textTransform: 'capitalize',
  },
  postDate: {
    fontSize: 12,
    opacity: 0.6,
  },
  visibilityContainer: {
    alignItems: 'flex-end',
  },
  visibilityChip: {
    height: 26,
  },
  visibilityText: {
    fontSize: 10,
    textTransform: 'capitalize',
  },
  postContent: {
    marginBottom: 12,
  },
  postTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 6,
    lineHeight: 22,
  },
  postText: {
    fontSize: 14,
    lineHeight: 20,
    opacity: 0.8,
    marginBottom: 8,
  },
  mediaContainer: {
    marginVertical: 8,
    borderRadius: 8,
    overflow: 'hidden',
  },
  mediaPreview: {
    width: '100%',
    height: 120,
  },
  videoPreview: {
    width: '100%',
    height: 120,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  petContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 6,
    borderRadius: 6,
    marginTop: 6,
    alignSelf: 'flex-start',
  },
  petName: {
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 6,
  },
  postFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  interactionButton: {
    minWidth: 0,
  },
  editedIndicator: {
    fontSize: 10,
    opacity: 0.5,
    fontStyle: 'italic',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    marginTop: 40,
  },
  emptyTitle: {
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    textAlign: 'center',
    opacity: 0.7,
    marginBottom: 16,
  },
  clearButton: {
    marginTop: 8,
  },
  createFirstPostButton: {
    marginTop: 8,
    backgroundColor: '#0a7ea4',
  },
  loadMoreContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  loadMoreText: {
    marginLeft: 8,
    opacity: 0.6,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: '#0a7ea4',
  },
});