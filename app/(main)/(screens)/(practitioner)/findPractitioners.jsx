// app/(main)/(screens)/(practitioner)/findPractitioners.jsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { FlatList, StyleSheet, View, TouchableOpacity, Modal, Animated, Dimensions } from 'react-native';
import { 
  Card, 
  Text, 
  Avatar, 
  ActivityIndicator, 
  Searchbar, 
  Chip,
  Button,
  IconButton,
  Divider,
  RadioButton,
  Portal
} from 'react-native-paper';
import { router } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { ThemedView } from '@/components/themes/ThemedView';
import { ThemedText } from '@/components/themes/ThemedText';
import { useColorScheme } from '@/hooks/useColorScheme';
import { searchPractitioners, getRecentPractitioners } from '@/services/supabase';

const { width: screenWidth } = Dimensions.get('window');

export default function FindPractitionersScreen() {
  const lastFetchTime = useRef(0);
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  
  const [practitioners, setPractitioners] = useState([]);
  const [filteredPractitioners, setFilteredPractitioners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [selectedExpertise, setSelectedExpertise] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  
  // View mode cycling state
  const [viewMode, setViewMode] = useState('full'); // 'full' | 'compact' | 'grid'
  const viewModeAnimation = useRef(new Animated.Value(1)).current;
  
  // Sort-related state
  const [showSortModal, setShowSortModal] = useState(false);
  const [sortBy, setSortBy] = useState('default');
  
  // Search bar animation state
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const searchBarWidth = useRef(new Animated.Value(screenWidth - 32 - 144)).current; // Updated for 4 buttons
  const buttonOpacity = useRef(new Animated.Value(1)).current;
  const buttonTranslateX = useRef(new Animated.Value(0)).current;
  
  // View mode definitions
  const viewModes = [
    { mode: 'full', icon: 'view-agenda', label: 'Full View' },
    { mode: 'compact', icon: 'view-list', label: 'Compact View' },
    { mode: 'grid', icon: 'view-grid', label: 'Grid View' }
  ];
  
  // Districts list (from your validation file)
  const districts = ['Dhaka', 'Chittagong', 'Khulna', 'Rajshahi', 'Sylhet', 'Barisal', 'Rangpur'];
  
  // Expertise areas
  const expertiseAreas = [
    'Pet Animal Medicine',
    'Large Animal Medicine', 
    'Poultry Medicine',
    'Small Animal Surgery',
    'Emergency Medicine'
  ];
  
  // Sort options
  const sortOptions = [
    { value: 'default', label: 'Default', icon: 'sort' },
    { value: 'name', label: 'Name A-Z', icon: 'sort-alphabetical-ascending' },
    { value: 'recent', label: 'Recently Verified', icon: 'clock' },
    { value: 'district', label: 'District', icon: 'map-marker' }
  ];

  // Get current view mode info
  const getCurrentViewMode = () => {
    return viewModes.find(vm => vm.mode === viewMode) || viewModes[0];
  };

  // Cycle to next view mode
  const cycleViewMode = () => {
    const currentIndex = viewModes.findIndex(vm => vm.mode === viewMode);
    const nextIndex = (currentIndex + 1) % viewModes.length;
    const nextMode = viewModes[nextIndex].mode;
    
    // Animate button press
    Animated.sequence([
      Animated.timing(viewModeAnimation, {
        toValue: 0.7,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(viewModeAnimation, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
    
    setViewMode(nextMode);
  };

  useFocusEffect(
    useCallback(() => {
      const now = Date.now();
      if (now - lastFetchTime.current > 5 * 60 * 1000) { // 5 minutes cache
        fetchPractitioners();
        lastFetchTime.current = now;
      }
    }, [])
  );

  useEffect(() => {
    filterAndSortPractitioners();
  }, [searchQuery, selectedDistrict, selectedExpertise, practitioners, sortBy]);
  
  const fetchPractitioners = async (isRefresh = false) => {
    if (isRefresh) {
      setIsRefreshing(true);
    } else {
      setLoading(true);
    }
    
    try {
      const result = await searchPractitioners({ limit: 100 });
      if (result.success) {
        setPractitioners(result.data);
      }
    } catch (error) {
      console.error('Error fetching practitioners:', error);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };
  
  const filterAndSortPractitioners = () => {
    let filtered = practitioners;
    
    // Apply filters first
    if (searchQuery) {
      filtered = filtered.filter(practitioner => 
        practitioner.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        practitioner.designation.toLowerCase().includes(searchQuery.toLowerCase()) ||
        practitioner.areas_of_expertise.toLowerCase().includes(searchQuery.toLowerCase()) ||
        practitioner.district?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        practitioner.sub_district?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    if (selectedDistrict) {
      filtered = filtered.filter(practitioner => 
        practitioner.district?.toLowerCase() === selectedDistrict.toLowerCase()
      );
    }

    if (selectedExpertise) {
      filtered = filtered.filter(practitioner => 
        practitioner.areas_of_expertise?.toLowerCase().includes(selectedExpertise.toLowerCase())
      );
    }
    
    // Apply sorting
    const sorted = applySorting(filtered);
    setFilteredPractitioners(sorted);
  };
  
  const applySorting = (practitionersToSort) => {
    const sorted = [...practitionersToSort];
    
    switch (sortBy) {
      case 'name':
        return sorted.sort((a, b) => 
          a.full_name.localeCompare(b.full_name)
        );
        
      case 'recent':
        return sorted.sort((a, b) => 
          new Date(b.verified_at || b.created_at) - new Date(a.verified_at || a.created_at)
        );
        
      case 'district':
        return sorted.sort((a, b) => 
          a.district.localeCompare(b.district)
        );
        
      case 'default':
      default:
        return sorted;
    }
  };
  
  const clearFilters = () => {
    setSearchQuery('');
    setSelectedDistrict('');
    setSelectedExpertise('');
    setSortBy('default');
    setShowFilters(false);
  };
  
  const handleSortSelection = (value) => {
    setSortBy(value);
    setShowSortModal(false);
  };
  
  const getCurrentSortLabel = () => {
    const option = sortOptions.find(opt => opt.value === sortBy);
    return option ? option.label : 'Default';
  };

  // Search animation handlers (updated width calculation)
  const handleSearchFocus = () => {
    setIsSearchFocused(true);
    Animated.parallel([
      Animated.timing(searchBarWidth, {
        toValue: screenWidth - 32,
        duration: 200,
        useNativeDriver: false,
      }),
      Animated.timing(buttonOpacity, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(buttonTranslateX, {
        toValue: 150, // Updated for more buttons
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleSearchBlur = () => {
    setIsSearchFocused(false);
    Animated.parallel([
      Animated.timing(searchBarWidth, {
        toValue: screenWidth - 32 - 144, // Updated width calculation
        duration: 200,
        useNativeDriver: false,
      }),
      Animated.timing(buttonOpacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(buttonTranslateX, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleSearchClear = () => {
    setSearchQuery('');
  };
  
  // Render practitioner card based on view mode
  const renderPractitionerCard = ({ item }) => {
    if (viewMode === 'grid') {
      return (
        <View style={styles.gridItemContainer}>
          <Card 
            style={styles.gridCard}
            onPress={() => router.push(`/viewPractitionerProfile?profileId=${item.id}`)}
          >
            <Card.Content style={styles.gridCardContent}>
              {item.profile_photo_url ? (
                <Avatar.Image 
                  size={80} 
                  source={{ uri: item.profile_photo_url }} 
                />
              ) : (
                <Avatar.Text 
                  size={80} 
                  label={item.full_name?.charAt(0)?.toUpperCase() || 'P'} 
                  backgroundColor="#27AE60"
                />
              )}
              
              <Text variant="titleSmall" style={styles.gridName} numberOfLines={2}>
                {item.full_name}
              </Text>
              <Text variant="bodySmall" style={styles.gridDesignation} numberOfLines={1}>
                {item.designation}
              </Text>
              <Text variant="bodySmall" style={styles.gridLocation} numberOfLines={1}>
                📍 {item.district}
              </Text>
              
              <View style={styles.gridBadge}>
                <Text style={styles.gridVerifiedText}>✅</Text>
              </View>
            </Card.Content>
          </Card>
        </View>
      );
    }

    if (viewMode === 'compact') {
      return (
        <Card 
          style={styles.compactCard}
          onPress={() => router.push(`/viewPractitionerProfile?profileId=${item.id}`)}
        >
          <Card.Content>
            <View style={styles.compactHeader}>
              {item.profile_photo_url ? (
                <Avatar.Image 
                  size={50} 
                  source={{ uri: item.profile_photo_url }} 
                />
              ) : (
                <Avatar.Text 
                  size={50} 
                  label={item.full_name?.charAt(0)?.toUpperCase() || 'P'} 
                  backgroundColor="#27AE60"
                />
              )}
              
              <View style={styles.compactInfo}>
                <Text variant="titleMedium" style={styles.practitionerName}>
                  {item.full_name}
                </Text>
                <Text variant="bodyMedium" style={styles.designation}>
                  {item.designation} • BVC: {item.bvc_registration_number}
                </Text>
                <Text variant="bodySmall" style={styles.location}>
                  📍 {item.sub_district}, {item.district}
                </Text>
              </View>
              
              <View style={styles.compactBadge}>
                <Text style={styles.verifiedText}>✅</Text>
              </View>
            </View>
          </Card.Content>
        </Card>
      );
    }

    // Full view (default)
    return (
      <Card 
        style={styles.practitionerCard}
        onPress={() => router.push(`/viewPractitionerProfile?profileId=${item.id}`)}
      >
        <Card.Content>
          <View style={styles.cardHeader}>
            <View style={styles.practitionerInfo}>
              {item.profile_photo_url ? (
                <Avatar.Image 
                  size={60} 
                  source={{ uri: item.profile_photo_url }} 
                />
              ) : (
                <Avatar.Text 
                  size={60} 
                  label={item.full_name?.charAt(0)?.toUpperCase() || 'P'} 
                  backgroundColor="#27AE60"
                />
              )}
              
              <View style={styles.practitionerDetails}>
                <Text variant="titleMedium" style={styles.practitionerName}>
                  {item.full_name}
                </Text>
                <Text variant="bodyMedium" style={styles.designation}>
                  {item.designation}
                </Text>
                <Text variant="bodySmall" style={styles.location}>
                  📍 {item.sub_district}, {item.district}
                </Text>
                <Text variant="bodySmall" style={styles.bvc}>
                  BVC: {item.bvc_registration_number}
                </Text>
              </View>
            </View>
            
            <View style={styles.verifiedBadge}>
              <Text style={styles.verifiedText}>✅</Text>
            </View>
          </View>
          
          <Divider style={styles.cardDivider} />
          
          <Text variant="bodySmall" style={styles.expertise} numberOfLines={2}>
            <Text style={styles.expertiseLabel}>Expertise: </Text>
            {item.areas_of_expertise}
          </Text>
          
          {/* Placeholder for future layers */}
          <View style={styles.placeholderContainer}>
            <Text variant="bodySmall" style={styles.placeholderText}>
              ⭐ 4.8 (12 reviews) • Available today
            </Text>
          </View>
        </Card.Content>
      </Card>
    );
  };
  
  // Get number of columns for FlatList
  const getNumColumns = () => {
    return viewMode === 'grid' ? 2 : 1;
  };
  
  // Empty state
  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <ThemedText style={styles.emptyTitle}>
        {searchQuery || selectedDistrict || selectedExpertise ? 'No practitioners found' : 'No practitioners available'}
      </ThemedText>
      <ThemedText style={styles.emptyText}>
        {searchQuery || selectedDistrict || selectedExpertise ? 
          "Try adjusting your search filters" 
          : "No verified practitioners available at the moment"}
      </ThemedText>
      {(searchQuery || selectedDistrict || selectedExpertise) && (
        <Button mode="outlined" onPress={clearFilters} style={styles.clearButton}>
          Clear Filters
        </Button>
      )}
    </View>
  );
  
  // Sort Modal Component
  const renderSortModal = () => (
    <Portal>
      <Modal
        visible={showSortModal}
        onDismiss={() => setShowSortModal(false)}
        contentContainerStyle={[
          styles.sortModal, 
          isDark && styles.sortModalDark
        ]}
      >
        <View style={styles.sortModalContent}>
          <ThemedText style={styles.sortModalTitle}>Sort Practitioners By</ThemedText>
          
          <RadioButton.Group
            onValueChange={handleSortSelection}
            value={sortBy}
          >
            {sortOptions.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={styles.sortOption}
                onPress={() => handleSortSelection(option.value)}
              >
                <View style={styles.sortOptionContent}>
                  <IconButton
                    icon={option.icon}
                    size={20}
                    iconColor={sortBy === option.value ? '#27AE60' : '#666'}
                  />
                  <ThemedText style={[
                    styles.sortOptionText,
                    sortBy === option.value && styles.sortOptionTextSelected
                  ]}>
                    {option.label}
                  </ThemedText>
                </View>
                <RadioButton value={option.value} />
              </TouchableOpacity>
            ))}
          </RadioButton.Group>
          
          <Button
            mode="outlined"
            onPress={() => setShowSortModal(false)}
            style={styles.sortModalCloseButton}
          >
            Close
          </Button>
        </View>
      </Modal>
    </Portal>
  );
  
  return (
    <ThemedView style={styles.container}>
      {/* Fixed Search Header */}
      <View style={styles.searchContainer}>
        <Animated.View
          style={[
            styles.searchBarContainer,
            {
              width: searchBarWidth,
            }
          ]}
        >
          <Searchbar
            placeholder={isSearchFocused ? "Search practitioners, expertise, location..." : "Search Practitioners"}
            onChangeText={setSearchQuery}
            value={searchQuery}
            onFocus={handleSearchFocus}
            onBlur={handleSearchBlur}
            onClearIconPress={handleSearchClear}
            style={styles.searchBar}
          />
        </Animated.View>
        
        <Animated.View 
          style={[
            styles.buttonsContainer,
            { 
              opacity: buttonOpacity,
              transform: [{ translateX: buttonTranslateX }]
            }
          ]}
          pointerEvents={isSearchFocused ? 'none' : 'auto'}
        >
          {/* Cycling View Mode Button */}
          <Animated.View style={{ transform: [{ scale: viewModeAnimation }] }}>
            <IconButton
              icon={getCurrentViewMode().icon}
              size={24}
              onPress={cycleViewMode}
              style={styles.actionButton}
              iconColor="#27AE60"
            />
          </Animated.View>
          
          <IconButton
            icon="filter-variant"
            size={24}
            onPress={() => setShowFilters(!showFilters)}
            style={styles.actionButton}
            iconColor={showFilters ? '#27AE60' : undefined}
          />
          <IconButton
            icon="sort"
            size={24}
            onPress={() => setShowSortModal(true)}
            style={styles.actionButton}
            iconColor={sortBy !== 'default' ? '#27AE60' : undefined}
          />
        </Animated.View>
      </View>
      
      {/* View Mode Indicator */}
      <View style={styles.viewModeIndicator}>
        <Text variant="bodySmall" style={styles.viewModeText}>
          {getCurrentViewMode().label} ({filteredPractitioners.length} practitioners)
        </Text>
      </View>
      
      {/* Active Sort Indicator */}
      {sortBy !== 'default' && (
        <View style={styles.activeSortContainer}>
          <Chip
            icon="sort"
            style={styles.activeSortChip}
            onClose={() => setSortBy('default')}
          >
            Sorted by: {getCurrentSortLabel()}
          </Chip>
        </View>
      )}
      
      {/* Filters */}
      {showFilters && (
        <View style={styles.filtersContainer}>
          <ThemedText style={styles.filterLabel}>Filter by District:</ThemedText>
          <FlatList
            data={districts}
            horizontal
            renderItem={({ item }) => (
              <Chip
                selected={selectedDistrict === item}
                onPress={() => setSelectedDistrict(selectedDistrict === item ? '' : item)}
                style={styles.districtChip}
              >
                {item}
              </Chip>
            )}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.districtChipsContainer}
          />
          
          <ThemedText style={styles.filterLabel}>Filter by Expertise:</ThemedText>
          <FlatList
            data={expertiseAreas}
            horizontal
            renderItem={({ item }) => (
              <Chip
                selected={selectedExpertise === item}
                onPress={() => setSelectedExpertise(selectedExpertise === item ? '' : item)}
                style={styles.districtChip}
              >
                {item}
              </Chip>
            )}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.districtChipsContainer}
          />
          
          {(searchQuery || selectedDistrict || selectedExpertise) && (
            <Button mode="text" onPress={clearFilters} style={styles.clearFiltersButton}>
              Clear All Filters
            </Button>
          )}
        </View>
      )}
      
      <Divider />
      
      {/* Results */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#27AE60" />
          <ThemedText style={styles.loadingText}>Loading practitioners...</ThemedText>
        </View>
      ) : (
        <FlatList
          data={filteredPractitioners}
          renderItem={renderPractitionerCard}
          keyExtractor={item => item.id.toString()}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={renderEmptyState}
          refreshing={isRefreshing}
          onRefresh={() => fetchPractitioners(true)}
          numColumns={getNumColumns()}
          key={viewMode} // Force re-render when view mode changes
        />
      )}
      
      {/* Sort Modal */}
      {renderSortModal()}
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
    height: 56,
  },
  searchBarContainer: {
    // Width controlled by animation
  },
  searchBar: {
    elevation: 4,
  },
  buttonsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'absolute',
    right: 0,
    height: 56,
  },
  actionButton: {
    marginLeft: 4,
  },
  viewModeIndicator: {
    paddingHorizontal: 16,
    paddingVertical: 4,
    backgroundColor: '#f8f9fa',
  },
  viewModeText: {
    textAlign: 'center',
    fontWeight: '500',
    color: '#666',
  },
  activeSortContainer: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  activeSortChip: {
    alignSelf: 'flex-start',
    backgroundColor: '#f8f9fa',
  },
  filtersContainer: {
    padding: 16,
    backgroundColor: '#f8f9fa',
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    marginTop: 8,
  },
  districtChipsContainer: {
    paddingBottom: 8,
  },
  districtChip: {
    marginRight: 8,
    marginBottom: 4,
  },
  clearFiltersButton: {
    alignSelf: 'center',
    marginTop: 8,
  },
  listContent: {
    padding: 16,
  },
  
  // Full view styles
  practitionerCard: {
    marginBottom: 12,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  practitionerInfo: {
    flexDirection: 'row',
    flex: 1,
  },
  practitionerDetails: {
    marginLeft: 16,
    flex: 1,
  },
  practitionerName: {
    fontWeight: 'bold',
    marginBottom: 2,
  },
  designation: {
    color: '#27AE60',
    marginBottom: 2,
  },
  location: {
    opacity: 0.7,
    marginBottom: 2,
  },
  bvc: {
    opacity: 0.6,
    fontSize: 12,
  },
  verifiedBadge: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  verifiedText: {
    fontSize: 20,
  },
  cardDivider: {
    marginVertical: 12,
  },
  expertise: {
    marginBottom: 8,
  },
  expertiseLabel: {
    fontWeight: '500',
  },
  placeholderContainer: {
    backgroundColor: '#f0f0f0',
    padding: 8,
    borderRadius: 6,
  },
  placeholderText: {
    textAlign: 'center',
    fontStyle: 'italic',
    opacity: 0.7,
  },

  // Compact view styles
  compactCard: {
    marginBottom: 8,
    elevation: 1,
  },
  compactHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  compactInfo: {
    marginLeft: 12,
    flex: 1,
  },
  compactBadge: {
    marginLeft: 8,
  },

  // Grid view styles
  gridItemContainer: {
    flex: 1,
    margin: 6,
  },
  gridCard: {
    elevation: 1,
  },
  gridCardContent: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  gridName: {
    textAlign: 'center',
    fontWeight: 'bold',
    marginTop: 8,
    marginBottom: 4,
  },
  gridDesignation: {
    textAlign: 'center',
    color: '#27AE60',
    marginBottom: 4,
  },
  gridLocation: {
    textAlign: 'center',
    opacity: 0.7,
    marginBottom: 8,
  },
  gridBadge: {
    alignItems: 'center',
  },
  gridVerifiedText: {
    fontSize: 16,
  },

  // Other styles (loading, empty, modal)
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
    opacity: 0.7,
    marginBottom: 16,
  },
  clearButton: {
    marginTop: 8,
  },
  sortModal: {
    backgroundColor: 'white',
    margin: 20,
    borderRadius: 12,
    elevation: 8,
  },
  sortModalDark: {
    backgroundColor: '#333',
  },
  sortModalContent: {
    padding: 20,
  },
  sortModalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  sortOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  sortOptionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  sortOptionText: {
    marginLeft: 8,
    fontSize: 16,
  },
  sortOptionTextSelected: {
    fontWeight: 'bold',
    color: '#27AE60',
  },
  sortModalCloseButton: {
    marginTop: 16,
  },
});