// app/(main)/(screens)/postFeedScreen.jsx
import React, { useState, useCallback, useEffect } from 'react';
import { FlatList, StyleSheet, View, TouchableOpacity, RefreshControl, Image } from 'react-native';
import { 
  Avatar, 
  ActivityIndicator, 
  FAB, 
  Searchbar, 
  IconButton, 
  Chip,
  SegmentedButtons,
  Button
} from 'react-native-paper';
import { useFocusEffect } from '@react-navigation/native';
import { ThemedView } from '@/components/themes/ThemedView';
import { ThemedText } from '@/components/themes/ThemedText';
import { ThemedCard } from '@/components/themes/ThemedCard';
import { useTheme } from '@/contexts/ThemeContext';
import { useActivityIndicatorColors, useFabColors } from '@/hooks/useThemeColor';
import { BrandColors } from '@/constants/Colors';
import { useAuth } from '@/contexts/AuthContext';
import { router } from 'expo-router';
import { usePosts } from '@/hooks/usePosts';
import { getPostCommentCount, getBatchPostCommentCounts } from '@/services/supabase';

export default function PostFeedScreen() {
  const { colors, isDark } = useTheme();
  const activityIndicatorColors = useActivityIndicatorColors();
  const fabColors = useFabColors();
  const { user, userData } = useAuth();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedPostType, setSelectedPostType] = useState('all');
  const [selectedVisibility, setSelectedVisibility] = useState('all');
  const [feedType, setFeedType] = useState('feed');
  const [commentCounts, setCommentCounts] = useState({});
  const [isRefreshing, setIsRefreshing] = useState(false);

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

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refresh();
    } catch (error) {
      console.log('Refresh failed, showing cached data:', error.message);
    } finally {
      setIsRefreshing(false);
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
    { value: 'text', label: 'Text' },
    { value: 'image', label: 'Photo' },
    { value: 'video', label: 'Video' },
    { value: 'article', label: 'Article' },
    { value: 'journal', label: 'Journal' }
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
      <TouchableOpacity 
        onPress={() => handlePostPress(item.id)}
        activeOpacity={0.7}
        style={styles.cardTouchable}
      >
        <ThemedCard variant="elevated" style={styles.postCard}>
          <View style={styles.cardContent}>
            {/* Header */}
            <View style={styles.postHeader}>
              <TouchableOpacity 
                style={styles.authorInfo}
                onPress={() => !isOwnPost && handleUserPress(author.id)}
                activeOpacity={0.7}
              >
                {author.picture ? (
                  <Avatar.Image size={40} source={{ uri: author.picture }} />
                ) : (
                  <Avatar.Text 
                    size={40} 
                    label={(author.name?.charAt(0) || author.email?.charAt(0) || 'U').toUpperCase()}
                    style={{ backgroundColor: colors.surface }}
                    color={colors.textSecondary}
                  />
                )}
                <View style={styles.authorDetails}>
                  <ThemedText style={styles.authorName}>
                    {author.name || 'Anonymous User'}
                    {isOwnPost && ' (You)'}
                  </ThemedText>
                  <ThemedText style={[styles.postDate, { color: colors.textSecondary }]}>
                    {postDate}
                    {item.is_edited && ' • Edited'}
                  </ThemedText>
                </View>
              </TouchableOpacity>

              <View style={styles.postMeta}>
                <Chip 
                  compact
                  style={[styles.postTypeChip, { backgroundColor: BrandColors.primary + '15' }]}
                  textStyle={[styles.chipText, { color: BrandColors.primary }]}
                >
                  {item.post_type}
                </Chip>
                
                <Chip 
                  compact
                  icon={
                    item.visibility === 'public' ? 'earth' :
                    item.visibility === 'connections' ? 'account-group' : 'lock'
                  }
                  style={[styles.visibilityChip, { backgroundColor: colors.surface }]}
                  textStyle={[styles.chipText, { color: colors.textSecondary }]}
                >
                  {item.visibility}
                </Chip>
              </View>
            </View>

            {/* Content */}
            <View style={styles.postContent}>
              <ThemedText style={styles.postTitle}>{item.title}</ThemedText>
              
              {item.content && (
                <ThemedText 
                  style={[styles.postText, { color: colors.textSecondary }]} 
                  numberOfLines={3}
                >
                  {item.content}
                </ThemedText>
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
                        size={40} 
                        iconColor="#fff"
                        style={styles.playIcon}
                      />
                      <ThemedText style={styles.videoLabel}>Video</ThemedText>
                    </View>
                  ) : null}
                </View>
              )}

              {/* Pet information */}
              {item.pet && (
                <TouchableOpacity 
                  style={[styles.petContainer, { backgroundColor: colors.surface }]}
                  onPress={() => handlePetPress(item.pet.id)}
                  activeOpacity={0.7}
                >
                  {item.pet.image_url ? (
                    <Avatar.Image size={24} source={{ uri: item.pet.image_url }} />
                  ) : (
                    <Avatar.Icon 
                      size={24} 
                      icon="account-circle" 
                      style={{ backgroundColor: colors.surface }}
                      color={colors.textSecondary}
                    />
                  )}
                  <View style={styles.petInfo}>
                    <ThemedText style={[styles.petName, { color: colors.textSecondary }]}>
                      About {item.pet.name}
                    </ThemedText>
                  </View>
                </TouchableOpacity>
              )}
            </View>

            {/* Footer */}
            <View style={styles.postFooter}>
              <Button 
                mode="text" 
                compact
                onPress={() => handlePostPress(item.id)}
                style={styles.commentsButton}
                labelStyle={[styles.commentsLabel, { color: colors.textSecondary }]}
                icon="comment-outline"
              >
                {commentCounts[item.id] ?? item._count?.count ?? 0}
              </Button>
            </View>
          </View>
        </ThemedCard>
      </TouchableOpacity>
    );
  };

  const renderSearchHeader = () => (
    <View style={styles.searchContainer}>
      <Searchbar
        placeholder="Search posts"
        onChangeText={setSearchQuery}
        value={searchQuery}
        style={[styles.searchBar, { backgroundColor: colors.surface }]}
        inputStyle={{ 
          color: colors.text,
          textAlignVertical: 'center',
          includeFontPadding: false,
          paddingBottom: 10,
        }}
        iconColor={colors.textSecondary}
        placeholderTextColor={colors.textSecondary}
        elevation={0}
      />
      
      <IconButton
        icon="tune"
        size={22}
        onPress={() => setShowFilters(!showFilters)}
        style={[
          styles.filterButton, 
          { backgroundColor: showFilters ? BrandColors.primary + '15' : colors.surface }
        ]}
        iconColor={showFilters ? BrandColors.primary : colors.text}
      />
    </View>
  );

  const renderEmptyState = () => {
    if (searchQuery) {
      return (
        <View style={styles.centerState}>
          <IconButton
            icon="magnify"
            size={48}
            iconColor={colors.textSecondary}
          />
          <ThemedText style={styles.stateTitle}>No posts found</ThemedText>
          <ThemedText style={[styles.stateMessage, { color: colors.textSecondary }]}>
            No posts match your search "{searchQuery}"
          </ThemedText>
          <Button mode="outlined" onPress={clearFilters} style={styles.stateAction}>
            Clear Search
          </Button>
        </View>
      );
    }

    return (
      <View style={styles.centerState}>
        <IconButton
          icon="post-outline"
          size={48}
          iconColor={colors.textSecondary}
        />
        <ThemedText style={styles.stateTitle}>No posts yet</ThemedText>
        <ThemedText style={[styles.stateMessage, { color: colors.textSecondary }]}>
          {feedType === 'user' 
            ? "You haven't shared any stories yet" 
            : "No posts to show in your feed"
          }
        </ThemedText>
        <Button 
          mode="contained" 
          onPress={handleCreatePost}
          style={styles.stateAction}
          icon="plus"
        >
          Share Your Story
        </Button>
      </View>
    );
  };

  if (loading && posts.length === 0) {
    return (
      <ThemedView style={styles.container}>
        {renderSearchHeader()}
        <View style={styles.centerState}>
          <ActivityIndicator 
            size="large" 
            color={activityIndicatorColors.primary}
          />
          <ThemedText style={[styles.stateMessage, { color: colors.textSecondary }]}>
            Loading posts...
          </ThemedText>
        </View>
      </ThemedView>
    );
  }

  if (error && posts.length === 0) {
    return (
      <ThemedView style={styles.container}>
        {renderSearchHeader()}
        <View style={styles.centerState}>
          <IconButton
            icon="alert-circle"
            size={48}
            iconColor={colors.error}
          />
          <ThemedText style={styles.stateTitle}>Error loading posts</ThemedText>
          <ThemedText style={[styles.stateMessage, { color: colors.textSecondary }]}>
            {error}
          </ThemedText>
          <Button 
            mode="contained" 
            onPress={refetch}
            style={styles.stateAction}
            icon="refresh"
          >
            Try Again
          </Button>
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <FlatList
        data={posts}
        renderItem={renderPostCard}
        keyExtractor={item => item.id.toString()}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={() => (
          <View>
            {renderSearchHeader()}
            
            {/* Filters */}
            {showFilters && (
              <View style={styles.filtersContainer}>
                <View style={styles.filterSection}>
                  <ThemedText style={styles.filterLabel}>Post Type</ThemedText>
                  <SegmentedButtons
                    value={selectedPostType}
                    onValueChange={setSelectedPostType}
                    buttons={postTypeButtons.slice(0, 3)}
                    style={styles.filterButtons}
                  />
                  <SegmentedButtons
                    value={selectedPostType}
                    onValueChange={setSelectedPostType}
                    buttons={postTypeButtons.slice(3)}
                    style={styles.filterButtons}
                  />
                </View>
                
                <View style={styles.filterSection}>
                  <ThemedText style={styles.filterLabel}>Visibility</ThemedText>
                  <SegmentedButtons
                    value={selectedVisibility}
                    onValueChange={setSelectedVisibility}
                    buttons={visibilityButtons}
                    style={styles.filterButtons}
                  />
                </View>

                {(searchQuery || selectedPostType !== 'all' || selectedVisibility !== 'all') && (
                  <Button 
                    mode="text" 
                    onPress={clearFilters} 
                    style={styles.clearFiltersButton}
                    labelStyle={{ color: colors.textSecondary }}
                  >
                    Clear All Filters
                  </Button>
                )}
              </View>
            )}

            {/* Feed Type Selector */}
            <View style={styles.feedTypeContainer}>
              <SegmentedButtons
                value={feedType}
                onValueChange={setFeedType}
                buttons={feedTypeButtons}
                style={styles.feedTypeButtons}
              />
            </View>
          </View>
        )}
        ListEmptyComponent={renderEmptyState}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            colors={[BrandColors.primary]}
            tintColor={BrandColors.primary}
            progressBackgroundColor={colors.surface}
          />
        }
        onEndReached={loadMore}
        onEndReachedThreshold={0.1}
        ListFooterComponent={() => 
          hasMore && posts.length > 0 ? (
            <View style={styles.loadMoreContainer}>
              <ActivityIndicator 
                size="small" 
                color={activityIndicatorColors.primary}
              />
              <ThemedText style={[styles.loadMoreText, { color: colors.textSecondary }]}>
                Loading more...
              </ThemedText>
            </View>
          ) : null
        }
        showsVerticalScrollIndicator={false}
      />

      {/* Create Post FAB */}
      <FAB
        icon="plus"
        style={[styles.fab, { backgroundColor: fabColors.background }]}
        color={fabColors.text}
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 0,
    paddingVertical: 12,
    gap: 8,
  },
  searchBar: {
    flex: 1,
    borderRadius: 8,
    height: 44,
  },
  filterButton: {
    borderRadius: 8,
    width: 44,
    height: 44,
    margin: 0,
  },
  filtersContainer: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  filterSection: {
    marginBottom: 12,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  filterButtons: {
    marginBottom: 8,
  },
  clearFiltersButton: {
    alignSelf: 'flex-start',
  },
  feedTypeContainer: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  feedTypeButtons: {
    marginBottom: 8,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  centerState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 40,
  },
  stateTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 12,
    marginBottom: 6,
    textAlign: 'center',
  },
  stateMessage: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 16,
  },
  stateAction: {
    paddingHorizontal: 24,
  },
  cardTouchable: {
    marginBottom: 16,
  },
  postCard: {
    elevation: 1,
  },
  cardContent: {
    padding: 16,
  },
  postHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  authorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  authorDetails: {
    marginLeft: 12,
    flex: 1,
  },
  authorName: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2,
  },
  postDate: {
    fontSize: 12,
  },
  postMeta: {
    alignItems: 'flex-end',
    gap: 4,
  },
  postTypeChip: {
    minHeight: 24,
    paddingVertical: 1,
  },
  visibilityChip: {
    minHeight: 24,
    paddingVertical: 1,
  },
  chipText: {
    fontSize: 10,
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  postContent: {
    marginBottom: 12,
  },
  postTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 6,
  },
  postText: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
  mediaContainer: {
    marginVertical: 8,
    borderRadius: 8,
    overflow: 'hidden',
  },
  mediaImage: {
    width: '100%',
    height: 180,
  },
  videoPlaceholder: {
    width: '100%',
    height: 180,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  playIcon: {
    margin: 0,
  },
  videoLabel: {
    color: '#fff',
    fontSize: 12,
    marginTop: 4,
  },
  petContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 8,
    marginTop: 8,
  },
  petInfo: {
    marginLeft: 8,
  },
  petName: {
    fontSize: 12,
    fontWeight: '500',
  },
  postFooter: {
    alignItems: 'flex-start',
  },
  commentsButton: {
    minWidth: 0,
    marginLeft: -8,
  },
  commentsLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  loadMoreContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  loadMoreText: {
    marginLeft: 8,
    fontSize: 12,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
});