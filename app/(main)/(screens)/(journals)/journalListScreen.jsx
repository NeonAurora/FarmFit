// app/(main)/(screens)/journalListScreen.jsx
import React, { useState } from 'react';
import { FlatList, StyleSheet, View, TouchableOpacity } from 'react-native';
import { 
  Card, 
  Text, 
  Avatar, 
  ActivityIndicator, 
  FAB, 
  Searchbar, 
  IconButton, 
  Chip,
  SegmentedButtons
} from 'react-native-paper';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { useColorScheme } from '@/hooks/useColorScheme';
import { router } from 'expo-router';
import { useJournals } from '@/hooks/useJournals';

const MOOD_EMOJIS = {
  happy: '😊',
  worried: '😟',
  proud: '😤',
  sad: '😢',
  tired: '😴'
};

const MOOD_COLORS = {
  happy: '#4CAF50',
  worried: '#FF9800',
  proud: '#9C27B0',
  sad: '#2196F3',
  tired: '#607D8B'
};

export default function JournalListScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMood, setSelectedMood] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  
  // Use the hook with filters
  const { journals, loading, error, refetch } = useJournals({
    mood: selectedMood || undefined
  });
  
  const handleAddJournal = () => {
    router.push("/addJournalScreen");
  };
  
  const handleJournalPress = (journalId) => {
    router.push({
      pathname: '/journalViewScreen',
      params: { journalId }
    });
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
    { value: 'happy', label: '😊' },
    { value: 'worried', label: '😟' },
    { value: 'proud', label: '😤' },
    { value: 'sad', label: '😢' },
    { value: 'tired', label: '😴' }
  ];
  
  const renderJournalCard = ({ item }) => {
    const journalDate = new Date(item.journal_date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });

    return (
      <TouchableOpacity onPress={() => handleJournalPress(item.id)}>
        <Card style={[styles.journalCard, isDark && styles.journalCardDark]}>
          <Card.Content style={styles.cardContent}>
            {/* Header with mood and date */}
            <View style={styles.cardHeader}>
              <View style={styles.moodDateContainer}>
                {item.mood && (
                  <Chip 
                    icon={() => <Text>{MOOD_EMOJIS[item.mood]}</Text>}
                    style={[styles.moodChip, { backgroundColor: MOOD_COLORS[item.mood] + '20' }]}
                    textStyle={styles.moodChipText}
                  >
                    {item.mood}
                  </Chip>
                )}
                <Text style={styles.dateText}>{journalDate}</Text>
              </View>
              {item.pet && (
                <View style={styles.petInfo}>
                  {item.pet.image_url ? (
                    <Avatar.Image size={30} source={{ uri: item.pet.image_url }} />
                  ) : (
                    <Avatar.Icon size={30} icon="paw" backgroundColor="#e0e0e0" />
                  )}
                  <Text style={styles.petName}>{item.pet.name}</Text>
                </View>
              )}
            </View>

            {/* Title and content preview */}
            <ThemedText style={styles.journalTitle}>{item.title}</ThemedText>
            <ThemedText style={styles.journalPreview} numberOfLines={2}>
              {item.content}
            </ThemedText>

            {/* Tags */}
            {item.tags && item.tags.length > 0 && (
              <View style={styles.tagsContainer}>
                {item.tags.slice(0, 3).map((tag, index) => (
                  <Chip key={index} style={styles.tagChip} textStyle={styles.tagText}>
                    #{tag}
                  </Chip>
                ))}
                {item.tags.length > 3 && (
                  <Text style={styles.moreTagsText}>+{item.tags.length - 3} more</Text>
                )}
              </View>
            )}

            {/* Footer with photos indicator and weather */}
            <View style={styles.cardFooter}>
              {item.photo_urls && item.photo_urls.length > 0 && (
                <Chip icon="camera" style={styles.photoChip} textStyle={styles.photoChipText}>
                  {item.photo_urls.length} photo{item.photo_urls.length > 1 ? 's' : ''}
                </Chip>
              )}
              {item.weather && (
                <Text style={styles.weatherText}>🌤️ {item.weather}</Text>
              )}
            </View>
          </Card.Content>
        </Card>
      </TouchableOpacity>
    );
  };
  
  return (
    <ThemedView style={styles.container}>
      {/* Search and Filter Header */}
      <View style={styles.searchContainer}>
        <Searchbar
          placeholder="Search journals..."
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
      
      {error ? (
        <View style={styles.errorContainer}>
          <ThemedText type="title">Error</ThemedText>
          <ThemedText style={styles.errorText}>{error}</ThemedText>
          <IconButton
            icon="refresh"
            size={32}
            onPress={refetch}
            style={styles.errorRefreshButton}
          />
        </View>
      ) : loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0a7ea4" />
          <ThemedText style={styles.loadingText}>Loading your journals...</ThemedText>
        </View>
      ) : journals.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Avatar.Icon size={80} icon="book-open-variant" backgroundColor="#e0e0e0" />
          <ThemedText type="title">No Journals Yet</ThemedText>
          <ThemedText style={styles.emptyText}>
            Start documenting your pet care journey
          </ThemedText>
        </View>
      ) : (
        <FlatList
          data={getFilteredJournals()}
          renderItem={renderJournalCard}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
      
      <FAB
        icon="plus"
        style={styles.fab}
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
  moodButtons: {
    marginBottom: 8,
  },
  listContent: {
    padding: 16,
    paddingBottom: 80,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    marginTop: 10,
    textAlign: 'center',
    opacity: 0.7,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    marginTop: 10,
    textAlign: 'center',
    color: '#E74C3C',
  },
  errorRefreshButton: {
    marginTop: 16,
  },
  journalCard: {
    marginBottom: 12,
    elevation: 2,
  },
  journalCardDark: {
    backgroundColor: '#333',
  },
  cardContent: {
    padding: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  moodDateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  moodChip: {
    marginRight: 8,
    height: 30,
  },
  moodChipText: {
    fontSize: 12,
    textTransform: 'capitalize',
  },
  dateText: {
    fontSize: 12,
    opacity: 0.6,
  },
  petInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  petName: {
    fontSize: 12,
    marginLeft: 4,
    opacity: 0.7,
  },
  journalTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 6,
  },
  journalPreview: {
    fontSize: 14,
    opacity: 0.8,
    lineHeight: 20,
    marginBottom: 12,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    marginBottom: 12,
  },
  tagChip: {
    marginRight: 6,
    marginBottom: 4,
    height: 24,
    backgroundColor: '#e3f2fd',
  },
  tagText: {
    fontSize: 10,
  },
  moreTagsText: {
    fontSize: 10,
    opacity: 0.6,
    marginLeft: 4,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  photoChip: {
    height: 24,
    backgroundColor: '#f3e5f5',
  },
  photoChipText: {
    fontSize: 10,
  },
  weatherText: {
    fontSize: 12,
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