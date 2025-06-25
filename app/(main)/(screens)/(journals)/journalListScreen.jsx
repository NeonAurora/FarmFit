// app/(main)/(screens)/journalListScreen.jsx
import React, { useState, useCallback } from 'react';
import { FlatList, StyleSheet, View, TouchableOpacity, RefreshControl } from 'react-native';
import { 
  Avatar, 
  ActivityIndicator, 
  FAB, 
  Searchbar, 
  IconButton, 
  Chip,
  SegmentedButtons
} from 'react-native-paper';
import { ThemedView } from '@/components/themes/ThemedView';
import { ThemedText } from '@/components/themes/ThemedText';
import { ThemedCard } from '@/components/themes/ThemedCard';
import { useTheme } from '@/contexts/ThemeContext';
import { useActivityIndicatorColors, useFabColors } from '@/hooks/useThemeColor';
import { BrandColors } from '@/constants/Colors';
import { router } from 'expo-router';
import { useJournals } from '@/hooks/useJournals';
import { useFocusEffect } from '@react-navigation/native';

const MOOD_EMOJIS = {
  happy: '😊',
  worried: '😟',
  proud: '😤',
  sad: '😢',
  tired: '😴'
};

export default function JournalListScreen() {
  const { colors, isDark } = useTheme();
  const activityIndicatorColors = useActivityIndicatorColors();
  const fabColors = useFabColors();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMood, setSelectedMood] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Use the hook with filters
  const { journals, loading, error, refetch } = useJournals({
    mood: selectedMood || undefined
  });

  // Refresh data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      const refreshData = async () => {
        try {
          await refetch();
        } catch (error) {
          // If refresh fails (no internet), the hook will show cached data
          console.log('Refresh failed, showing cached data:', error.message);
        }
      };
      
      refreshData();
    }, [refetch])
  );
  
  const handleAddJournal = () => {
    router.push("/addJournalScreen");
  };
  
  const handleJournalPress = (journalId) => {
    router.push({
      pathname: '/journalViewScreen',
      params: { journalId }
    });
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refetch();
    } catch (error) {
      console.log('Pull refresh failed, keeping cached data:', error.message);
    } finally {
      setIsRefreshing(false);
    }
  };
  
  const getFilteredJournals = () => {
    if (!searchQuery) return journals;
    
    return journals.filter(journal => 
      journal.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      journal.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      journal.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  };

  const moodButtons = [
    { value: '', label: 'All' },
    { value: 'happy', label: 'Happy' },
    { value: 'worried', label: 'Worried' },
    { value: 'proud', label: 'Proud' },
    { value: 'sad', label: 'Sad' },
    { value: 'tired', label: 'Tired' }
  ];
  
  const renderJournalCard = ({ item }) => {
    const journalDate = new Date(item.journal_date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });

    return (
      <TouchableOpacity 
        onPress={() => handleJournalPress(item.id)}
        activeOpacity={0.7}
        style={styles.cardTouchable}
      >
        <ThemedCard variant="elevated" style={styles.journalCard}>
          <View style={styles.cardContent}>
            {/* Header with date and mood */}
            <View style={styles.cardHeader}>
              <ThemedText style={[styles.dateText, { color: colors.textSecondary }]}>
                {journalDate}
              </ThemedText>
              
              <View style={styles.headerRight}>
                {item.mood && (
                  <Chip 
                    compact
                    style={[styles.moodChip, { backgroundColor: BrandColors.primary + '15' }]}
                    textStyle={[styles.chipText, { color: BrandColors.primary }]}
                  >
                    {MOOD_EMOJIS[item.mood]} {item.mood}
                  </Chip>
                )}
                
                {item.pet && (
                  <View style={styles.petInfo}>
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
                    <ThemedText style={[styles.petName, { color: colors.textSecondary }]}>
                      {item.pet.name}
                    </ThemedText>
                  </View>
                )}
              </View>
            </View>

            {/* Title and content */}
            <ThemedText style={styles.journalTitle}>{item.title}</ThemedText>
            <ThemedText 
              style={[styles.journalPreview, { color: colors.textSecondary }]} 
              numberOfLines={2}
            >
              {item.content}
            </ThemedText>

            {/* Footer with metadata */}
            <View style={styles.cardFooter}>
              <View style={styles.metadataRow}>
                {/* Tags */}
                {item.tags && item.tags.length > 0 && (
                  <View style={styles.tagsContainer}>
                    {item.tags.slice(0, 2).map((tag, index) => (
                      <Chip 
                        key={index} 
                        compact
                        style={[styles.tagChip, { backgroundColor: colors.surface }]}
                        textStyle={[styles.chipText, { color: colors.textSecondary }]}
                      >
                        #{tag}
                      </Chip>
                    ))}
                    {item.tags.length > 2 && (
                      <ThemedText style={[styles.moreTagsText, { color: colors.textSecondary }]}>
                        +{item.tags.length - 2}
                      </ThemedText>
                    )}
                  </View>
                )}
              </View>

              <View style={styles.indicatorsRow}>
                {/* Photos indicator */}
                {item.photo_urls && item.photo_urls.length > 0 && (
                  <Chip 
                    compact
                    icon="image"
                    style={[styles.indicatorChip, { backgroundColor: colors.surface }]}
                    textStyle={[styles.chipText, { color: colors.textSecondary }]}
                  >
                    {item.photo_urls.length}
                  </Chip>
                )}
                
                {/* Weather */}
                {item.weather && (
                  <ThemedText style={[styles.weatherText, { color: colors.textSecondary }]}>
                    {item.weather}
                  </ThemedText>
                )}
              </View>
            </View>
          </View>
        </ThemedCard>
      </TouchableOpacity>
    );
  };

  const renderSearchHeader = () => (
    <View style={styles.searchContainer}>
      <Searchbar
        placeholder="Search journals"
        onChangeText={setSearchQuery}
        value={searchQuery}
        style={[styles.searchBar, { backgroundColor: colors.surface }]}
        inputStyle={{ 
          color: colors.text,
          textAlignVertical: 'center',
          includeFontPadding: false,
          paddingBottom: 12,
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

  if (error) {
    return (
      <ThemedView style={styles.container}>
        {renderSearchHeader()}
        <View style={styles.centerState}>
          <IconButton
            icon="alert-circle"
            size={40}
            iconColor={colors.error}
          />
          <ThemedText style={styles.stateTitle}>Connection Error</ThemedText>
          <ThemedText style={[styles.stateMessage, { color: colors.textSecondary }]}>
            {error}
          </ThemedText>
          <IconButton
            icon="refresh"
            size={28}
            onPress={refetch}
            style={[styles.stateAction, { backgroundColor: colors.surface }]}
            iconColor={colors.text}
          />
        </View>
      </ThemedView>
    );
  }

  if (loading) {
    return (
      <ThemedView style={styles.container}>
        {renderSearchHeader()}
        <View style={styles.centerState}>
          <ActivityIndicator 
            size="large" 
            color={activityIndicatorColors.primary}
          />
          <ThemedText style={[styles.stateMessage, { color: colors.textSecondary }]}>
            Loading journals...
          </ThemedText>
        </View>
      </ThemedView>
    );
  }

  if (journals.length === 0) {
    return (
      <ThemedView style={styles.container}>
        {renderSearchHeader()}
        <View style={styles.centerState}>
          <IconButton
            icon="book-open-outline"
            size={48}
            iconColor={colors.textSecondary}
          />
          <ThemedText style={styles.stateTitle}>No journals yet</ThemedText>
          <ThemedText style={[styles.stateMessage, { color: colors.textSecondary }]}>
            Start documenting your journey
          </ThemedText>
        </View>
        
        <FAB
          icon="plus"
          style={[styles.fab, { backgroundColor: fabColors.background }]}
          color={fabColors.text}
          onPress={handleAddJournal}
        />
      </ThemedView>
    );
  }
  
  return (
    <ThemedView style={styles.container}>
      <FlatList
        data={getFilteredJournals()}
        renderItem={renderJournalCard}
        keyExtractor={item => item.id}
        ListHeaderComponent={() => (
          <View>
            {renderSearchHeader()}
            
            {/* Mood Filter */}
            {showFilters && (
              <View style={styles.filtersContainer}>
                <SegmentedButtons
                  value={selectedMood}
                  onValueChange={setSelectedMood}
                  buttons={moodButtons}
                  style={styles.moodButtons}
                />
              </View>
            )}
          </View>
        )}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            colors={[BrandColors.primary]}
            tintColor={BrandColors.primary}
            progressBackgroundColor={colors.surface}
          />
        }
      />
      
      <FAB
        icon="plus"
        style={[styles.fab, { backgroundColor: fabColors.background }]}
        color={fabColors.text}
        onPress={handleAddJournal}
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
  moodButtons: {
    height: 40,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 88,
  },
  centerState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
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
    borderRadius: 8,
    width: 44,
    height: 44,
  },
  cardTouchable: {
    marginBottom: 12,
  },
  journalCard: {
    elevation: 1,
  },
  cardContent: {
    padding: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  dateText: {
    fontSize: 12,
    fontWeight: '500',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  moodChip: {
    minHeight: 28,
    paddingVertical: 2,
    marginBottom: 0,
  },
  petInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  petName: {
    fontSize: 11,
    fontWeight: '500',
  },
  journalTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  journalPreview: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  cardFooter: {
    gap: 8,
  },
  metadataRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tagsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  tagChip: {
    minHeight: 24, 
    paddingVertical: 1,
  },
  chipText: {
    fontSize: 10,
    fontWeight: '500',
    lineHeight: 14, // Explicit line height for better control
    textAlignVertical: 'center', // Android-specific centering
    includeFontPadding: false, // Remove Android font padding
  },
  moreTagsText: {
    fontSize: 10,
    fontWeight: '500',
  },
  indicatorsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  indicatorChip: {
    minHeight: 24, // Instead of fixed height: 20  
    paddingVertical: 1,
  },
  weatherText: {
    fontSize: 11,
    fontWeight: '500',
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
});