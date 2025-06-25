// app/(main)/(screens)/(practitioner)/findPractitioners.jsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { FlatList, StyleSheet, View, TouchableOpacity, Modal, Animated, Dimensions } from 'react-native';
import { 
  Text, 
  ActivityIndicator, 
  Searchbar, 
  Chip,
  IconButton,
  Divider,
  RadioButton,
  Portal
} from 'react-native-paper';
import { router } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { ThemedView } from '@/components/themes/ThemedView';
import { ThemedText } from '@/components/themes/ThemedText';
import { ThemedCard } from '@/components/themes/ThemedCard';
import { ThemedButton } from '@/components/themes/ThemedButton';
import { useTheme } from '@/contexts/ThemeContext';
import { 
  useChipColors, 
  useInputColors, 
  useActivityIndicatorColors, 
  useCardColors,
  useButtonColors 
} from '@/hooks/useThemeColor';
import { searchPractitioners, getRecentPractitioners } from '@/services/supabase';
import PractitionerCard from '@/components/practitioners/PractitionerCard';

const { width: screenWidth } = Dimensions.get('window');

export default function FindPractitionersScreen() {
  const lastFetchTime = useRef(0);
  const { colors, brandColors, isDark } = useTheme();
  const chipColors = useChipColors();
  const inputColors = useInputColors();
  const activityIndicatorColors = useActivityIndicatorColors();
  const cardColors = useCardColors();
  const buttonColors = useButtonColors();
  
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
  const searchBarWidth = useRef(new Animated.Value(screenWidth - 32 - 144)).current; // Updated for 3 buttons
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
  const renderPractitionerCard = ({ item }) => (
    <PractitionerCard 
      practitioner={item}
      mode={viewMode} // 'full' | 'compact' | 'grid'
      showActions={true}
      onPress={() => router.push(`/viewPractitionerProfile?profileId=${item.id}`)}
    />
  );
  
  // Get number of columns for FlatList
  const getNumColumns = () => {
    return viewMode === 'grid' ? 2 : 1;
  };
  
  // Empty state
  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <ThemedText type="subtitle" style={styles.emptyTitle}>
        {searchQuery || selectedDistrict || selectedExpertise ? 'No practitioners found' : 'No practitioners available'}
      </ThemedText>
      <ThemedText style={[styles.emptyText, { color: colors.textSecondary }]}>
        {searchQuery || selectedDistrict || selectedExpertise ? 
          "Try adjusting your search filters" 
          : "No verified practitioners available at the moment"}
      </ThemedText>
      {(searchQuery || selectedDistrict || selectedExpertise) && (
        <ThemedButton 
          variant="outlined" 
          onPress={clearFilters} 
          style={styles.clearButton}
        >
          Clear Filters
        </ThemedButton>
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
          { backgroundColor: cardColors.background }
        ]}
      >
        <View style={styles.sortModalContent}>
          <ThemedText type="subtitle" style={styles.sortModalTitle}>
            Sort Practitioners By
          </ThemedText>
          
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
                    iconColor={sortBy === option.value ? brandColors.primary : colors.textSecondary}
                  />
                  <ThemedText style={[
                    styles.sortOptionText,
                    sortBy === option.value && { 
                      fontWeight: 'bold',
                      color: brandColors.primary 
                    }
                  ]}>
                    {option.label}
                  </ThemedText>
                </View>
                <RadioButton value={option.value} />
              </TouchableOpacity>
            ))}
          </RadioButton.Group>
          
          <ThemedButton
            variant="outlined"
            onPress={() => setShowSortModal(false)}
            style={styles.sortModalCloseButton}
          >
            Close
          </ThemedButton>
        </View>
      </Modal>
    </Portal>
  );
  
  return (
    <ThemedView style={styles.container}>
      {/* Fixed Search Header */}
      <View style={[styles.searchContainer, { backgroundColor: colors.background }]}>
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
            style={[
              styles.searchBar, 
              { 
                backgroundColor: colors.backgroundSecondary, // Different from container background for visibility
                elevation: 4,
              }
            ]}
            inputStyle={{ color: colors.text }}
            iconColor={colors.textSecondary}
            placeholderTextColor={colors.textSecondary}
          />
        </Animated.View>
        
        {/* Button Container */}
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
              size={20}
              onPress={cycleViewMode}
              style={styles.actionButton}
              iconColor={brandColors.primary}
            />
          </Animated.View>
          
          <IconButton
            icon="filter-variant"
            size={24}
            onPress={() => setShowFilters(!showFilters)}
            style={styles.actionButton}
            iconColor={showFilters ? brandColors.primary : colors.textSecondary}
          />
          <IconButton
            icon="sort"
            size={24}
            onPress={() => setShowSortModal(true)}
            style={styles.actionButton}
            iconColor={sortBy !== 'default' ? brandColors.primary : colors.textSecondary}
          />
        </Animated.View>
      </View>
      
      {/* View Mode Indicator */}
      <View style={[styles.viewModeIndicator, { backgroundColor: colors.background }]}>
        <Text variant="bodySmall" style={[styles.viewModeText, { color: colors.textSecondary }]}>
          {getCurrentViewMode().label} ({filteredPractitioners.length} practitioners)
        </Text>
      </View>
      
      {/* Active Sort Indicator */}
      {sortBy !== 'default' && (
        <View style={styles.activeSortContainer}>
          <Chip
            icon="sort"
            style={[styles.activeSortChip, { backgroundColor: chipColors.selected }]}
            textStyle={{ color: chipColors.selectedText }}
            onClose={() => setSortBy('default')}
          >
            Sorted by: {getCurrentSortLabel()}
          </Chip>
        </View>
      )}
      
      {/* Filters */}
      {showFilters && (
        <ThemedCard variant="flat" style={styles.filtersCard}>
          <View style={styles.filtersContainer}>
            <ThemedText type="defaultSemiBold" style={styles.filterLabel}>
              Filter by District:
            </ThemedText>
            <FlatList
              data={districts}
              horizontal
              renderItem={({ item }) => (
                <Chip
                  selected={selectedDistrict === item}
                  onPress={() => setSelectedDistrict(selectedDistrict === item ? '' : item)}
                  style={[
                    styles.districtChip,
                    selectedDistrict === item && { backgroundColor: chipColors.selected }
                  ]}
                  textStyle={selectedDistrict === item ? { color: chipColors.selectedText } : { color: chipColors.text }}
                >
                  {item}
                </Chip>
              )}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.districtChipsContainer}
            />
            
            <ThemedText type="defaultSemiBold" style={styles.filterLabel}>
              Filter by Expertise:
            </ThemedText>
            <FlatList
              data={expertiseAreas}
              horizontal
              renderItem={({ item }) => (
                <Chip
                  selected={selectedExpertise === item}
                  onPress={() => setSelectedExpertise(selectedExpertise === item ? '' : item)}
                  style={[
                    styles.districtChip,
                    selectedExpertise === item && { backgroundColor: chipColors.selected }
                  ]}
                  textStyle={selectedExpertise === item ? { color: chipColors.selectedText } : { color: chipColors.text }}
                >
                  {item}
                </Chip>
              )}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.districtChipsContainer}
            />
            
            {(searchQuery || selectedDistrict || selectedExpertise) && (
              <ThemedButton 
                variant="outlined" 
                onPress={clearFilters} 
                style={styles.clearFiltersButton}
              >
                Clear All Filters
              </ThemedButton>
            )}
          </View>
        </ThemedCard>
      )}
      
      <Divider style={{ backgroundColor: colors.border }} />
      
      {/* Results */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={activityIndicatorColors.primary} />
          <ThemedText style={[styles.loadingText, { color: colors.textSecondary }]}>
            Loading practitioners...
          </ThemedText>
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
          showsVerticalScrollIndicator={false}
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
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    borderRadius: 8,
    paddingHorizontal: 8,
    marginRight: 10,
  },
  searchBarContainer: {
    // Width controlled by animation
    paddingBottom: 15,
    paddingRight: 0,
    paddingLeft: 0,
    marginLeft: -5,
    marginRight: 0,
  },
  searchBar: {
    elevation: 0, // Remove individual elevation since container has it
    shadowOpacity: 0,
    marginTop: 10,
    marginLeft: -5,
    marginRight: 0,
  },
  buttonsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'absolute',
    right: 0,
    height: 56,
    paddingBottom: 10,
  },
  actionButton: {
    marginLeft: 4,
  },
  viewModeIndicator: {
    paddingHorizontal: 16,
    paddingVertical: 4,
  },
  viewModeText: {
    textAlign: 'center',
    fontWeight: '500',
  },
  activeSortContainer: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  activeSortChip: {
    alignSelf: 'flex-start',
  },
  filtersCard: {
    margin: 16,
    marginBottom: 0,
  },
  filtersContainer: {
    padding: 16,
  },
  filterLabel: {
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
  
  // Full view styles - MAINTAINED FROM ORIGINAL
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
    padding: 8,
    borderRadius: 6,
  },
  placeholderText: {
    textAlign: 'center',
    fontStyle: 'italic',
    opacity: 0.7,
  },

  // Compact view styles - MAINTAINED FROM ORIGINAL
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

  // Grid view styles - MAINTAINED FROM ORIGINAL
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

  // Other styles (loading, empty, modal) - MAINTAINED FROM ORIGINAL
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
    margin: 20,
    borderRadius: 12,
    elevation: 8,
  },
  sortModalContent: {
    padding: 20,
  },
  sortModalTitle: {
    textAlign: 'center',
    marginBottom: 16,
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
  sortModalCloseButton: {
    marginTop: 16,
  },
});