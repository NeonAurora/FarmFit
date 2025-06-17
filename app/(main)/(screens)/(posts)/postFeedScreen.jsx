// app/(main)/(screens)/postFeedScreen.jsx
import React, { useState, useCallback, useEffect } from 'react';
import { FlatList, StyleSheet, View, TouchableOpacity, RefreshControl, Image } from 'react-native';
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
import { ThemedView } from '@/components/themes/ThemedView';
import { ThemedText } from '@/components/themes/ThemedText';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useAuth } from '@/contexts/AuthContext';
import { router } from 'expo-router';
import { usePosts } from '@/hooks/usePosts';
import { getPostCommentCount, getBatchPostCommentCounts } from '@/services/supabase';

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

export default function PostFeedScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { user, userData } = useAuth();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedPostType, setSelectedPostType] = useState('all');
  const [selectedVisibility, setSelectedVisibility] = useState('all');
  const [feedType, setFeedType] = useState('feed');
  const [commentCounts, setCommentCounts] = useState({});

  // Use the posts hook with current filters
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
    feedType: searchQuery ? 'search' : feedType,
    searchQuery,
    postType: selectedPostType,
    visibility: selectedVisibility,
    limit: 10
  });

  // Refresh when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      if (posts.length === 0) {
        refetch();
      }
    }, [])
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

  const fetchCommentCount = async (postId) => {
    if (commentCounts[postId] !== undefined) return commentCounts[postId];
    
    try {
      const count = await getPostCommentCount(postId);
      setCommentCounts(prev => ({ ...prev, [postId]: count }));
      return count;
    } catch (error) {
      console.error('Error fetching comment count:', error);
      return 0;
    }
  };

  const fetchAllCommentCounts = async (posts) => {
    if (!posts || posts.length === 0) return;
    
    try {
      const postIds = posts.map(post => post.id);
      const counts = await getBatchPostCommentCounts(postIds);
      setCommentCounts(prev => ({ ...prev, ...counts }));
    } catch (error) {
      console.error('Error fetching batch comment counts:', error);
    }
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedPostType('all');
    setSelectedVisibility('all');
    setShowFilters(false);
  };

  const postTypeButtons = [
    { value: 'all', label: 'All' },
    { value: 'text', label: '📝' },
    { value: 'image', label: '📸' },
    { value: 'video', label: '🎥' },
    { value: 'article', label: '📰' },
    { value: 'journal', label: '📔' }
  ];

  const visibilityButtons = [
    { value: 'all', label: 'All' },
    { value: 'public', label: 'Public' },
    { value: 'connections', label: 'Friends' },
    { value: 'private', label: 'Private' }
  ];

  const feedTypeButtons = [
    { value: 'feed', label: 'Feed' },
    { value: 'user', label: 'My Posts' }
  ];

  useEffect(() => {
    if (posts.length > 0) {
      fetchAllCommentCounts(posts);
    }
  }, [posts]);

  const renderPostCard = ({ item }) => {
    const postDate = new Date(item.created_at).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    const isOwnPost = item.user_id === user?.sub;
    const author = item.author || {};

    return (
      <TouchableOpacity onPress={() => handlePostPress(item.id)}>
        <Card style={[styles.postCard, isDark && styles.postCardDark]}>
          <Card.Content style={styles.cardContent}>
            {/* Header with author info and post metadata */}
            <View style={styles.postHeader}>
              <TouchableOpacity 
                style={styles.authorInfo}
                onPress={() => !isOwnPost && handleUserPress(author.id)}
              >
                {author.picture ? (
                  <Avatar.Image size={45} source={{ uri: author.picture }} />
                ) : (
                  <Avatar.Text 
                    size={45} 
                    label={(author.name?.charAt(0) || author.email?.charAt(0) || 'U').toUpperCase()}
                    backgroundColor={isDark ? '#444' : '#e0e0e0'}
                    color={isDark ? '#fff' : '#666'}
                  />
                )}
                <View style={styles.authorDetails}>
                  <Text style={styles.authorName}>
                    {author.name || 'Anonymous User'}
                    {isOwnPost && ' (You)'}
                  </Text>
                  <View style={styles.postMeta}>
                    <Text style={styles.postDate}>{postDate}</Text>
                    {item.is_edited && (
                      <Text style={styles.editedIndicator}> • Edited</Text>
                    )}
                  </View>
                </View>
              </TouchableOpacity>

              <View style={styles.postTypeContainer}>
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
              </View>
            </View>

            {/* Post content */}
            <View style={styles.postContent}>
              <Text style={styles.postTitle}>{item.title}</Text>
              
              {item.content && (
                <Text 
                  style={styles.postText} 
                  numberOfLines={4}
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
                      style={styles.mediaImage}
                      resizeMode="cover"
                    />
                  ) : item.post_type === 'video' ? (
                    <View style={styles.videoPlaceholder}>
                      <IconButton 
                        icon="play-circle" 
                        size={50} 
                        iconColor="#fff"
                      />
                      <Text style={styles.videoLabel}>Tap to play video</Text>
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
                    <Avatar.Image size={30} source={{ uri: item.pet.image_url }} />
                  ) : (
                    <Avatar.Icon size={30} icon="paw" backgroundColor="#e0e0e0" />
                  )}
                  <View style={styles.petInfo}>
                    <Text style={styles.petLabel}>About</Text>
                    <Text style={styles.petName}>{item.pet.name}</Text>
                  </View>
                </TouchableOpacity>
              )}
            </View>

            {/* Post footer with visibility and interactions */}
            <View style={styles.postFooter}>
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

              <View style={styles.interactionContainer}>
                <Button 
                  mode="text" 
                  compact
                  onPress={() => handlePostPress(item.id)}
                  style={styles.interactionButton}
                >
                  💬 {commentCounts[item.id] ?? item._count?.count ?? 0} comments
                </Button>
              </View>
            </View>
          </Card.Content>
        </Card>
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => {
    if (searchQuery) {
      return (
        <View style={styles.emptyContainer}>
          <Avatar.Icon size={80} icon="magnify" backgroundColor="#e0e0e0" />
          <ThemedText type="title" style={styles.emptyTitle}>
            No Posts Found
          </ThemedText>
          <ThemedText style={styles.emptyText}>
            No posts match your search "{searchQuery}"
          </ThemedText>
          <Button mode="outlined" onPress={clearFilters} style={styles.clearButton}>
            Clear Search
          </Button>
        </View>
      );
    }

    return (
      <View style={styles.emptyContainer}>
        <Avatar.Icon size={80} icon="post" backgroundColor="#e0e0e0" />
        <ThemedText type="title" style={styles.emptyTitle}>
          No Posts Yet
        </ThemedText>
        <ThemedText style={styles.emptyText}>
          {feedType === 'user' 
            ? "You haven't shared any stories yet. Create your first post!" 
            : "No posts to show. Follow some users or create your first post!"
          }
        </ThemedText>
        <Button 
          mode="contained" 
          onPress={handleCreatePost}
          style={styles.createFirstPostButton}
          icon="plus"
        >
          Share Your Story
        </Button>
      </View>
    );
  };

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      {/* Feed Type Selector */}
      <SegmentedButtons
        value={feedType}
        onValueChange={setFeedType}
        buttons={feedTypeButtons}
        style={styles.feedTypeButtons}
      />

      {/* Stats */}
      {posts.length > 0 && (
        <View style={styles.statsContainer}>
          <Text style={styles.statsText}>
            {posts.length} post{posts.length !== 1 ? 's' : ''} loaded
            {hasMore && ' • Pull up for more'}
          </Text>
        </View>
      )}
    </View>
  );

  if (loading && posts.length === 0) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0a7ea4" />
        <ThemedText style={styles.loadingText}>Loading posts...</ThemedText>
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
        data={posts}
        renderItem={renderPostCard}
        keyExtractor={item => item.id.toString()}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmptyState}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refresh}
            colors={['#0a7ea4']}
            tintColor="#0a7ea4"
          />
        }
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

      {/* Create Post FAB */}
      <FAB
        icon="plus"
        style={styles.fab}
        onPress={handleCreatePost}
        label="Share"
      />
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
  headerContainer: {
    padding: 16,
    paddingBottom: 8,
  },
  feedTypeButtons: {
    marginBottom: 12,
  },
  statsContainer: {
    alignItems: 'center',
  },
  statsText: {
    fontSize: 12,
    opacity: 0.6,
  },
  listContent: {
    padding: 16,
    paddingTop: 0,
    paddingBottom: 100,
  },
  postCard: {
    marginBottom: 16,
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
  postMeta: {
    flexDirection: 'row',
    alignItems: 'center',
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
  postTypeContainer: {
    marginLeft: 8,
  },
  postTypeChip: {
    height: 30,
  },
  postTypeText: {
    fontSize: 11,
    textTransform: 'capitalize',
  },
  postContent: {
    marginBottom: 12,
  },
  postTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
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
  mediaImage: {
    width: '100%',
    height: 200,
  },
  videoPlaceholder: {
    width: '100%',
    height: 200,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoLabel: {
    color: '#fff',
    marginTop: 8,
  },
  petContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 8,
    borderRadius: 8,
    marginTop: 8,
  },
  petInfo: {
    marginLeft: 8,
  },
  petLabel: {
    fontSize: 10,
    opacity: 0.6,
    textTransform: 'uppercase',
  },
  petName: {
    fontSize: 14,
    fontWeight: '500',
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
  visibilityText: {
    fontSize: 10,
    textTransform: 'capitalize',
  },
  interactionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  interactionButton: {
    minWidth: 0,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
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