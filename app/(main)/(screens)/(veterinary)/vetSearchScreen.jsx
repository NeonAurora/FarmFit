// app/(main)/(screens)/(veterinary)/vetSearchScreen.jsx
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
import { getVeterinaryClinics } from '@/services/supabase';
import { getClinicRatingSummary } from '@/services/supabase/ratingService';
import { StarRating } from '@/components/veterinary/StarRating';

const { width: screenWidth } = Dimensions.get('window');

export default function VetSearchScreen() {
  const lastFetchTime = useRef(0);
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  
  const [clinics, setClinics] = useState([]);
  const [filteredClinics, setFilteredClinics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [clinicRatings, setClinicRatings] = useState({});
  
  // Sort-related state
  const [showSortModal, setShowSortModal] = useState(false);
  const [sortBy, setSortBy] = useState('default');
  
  // Search bar animation state
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const searchBarWidth = useRef(new Animated.Value(screenWidth - 32 - 96)).current; // Initial width (screen - margins - buttons)
  const buttonOpacity = useRef(new Animated.Value(1)).current;
  const buttonTranslateX = useRef(new Animated.Value(0)).current;
  
  // Sort options
  const sortOptions = [
    { value: 'default', label: 'Default Order', icon: 'sort' },
    { value: 'rating_high', label: 'Highest Rated', icon: 'star' },
    { value: 'rating_low', label: 'Lowest Rated', icon: 'star-outline' },
    { value: 'name', label: 'Alphabetical', icon: 'alphabetical' },
    { value: 'reviews_most', label: 'Most Reviews', icon: 'comment-multiple' }
  ];
  
  // Common districts in Bangladesh
  const districts = [
    'Dhaka', 'Chittagong', 'Rajshahi', 'Khulna', 'Barisal', 'Sylhet', 
    'Rangpur', 'Mymensingh', 'Comilla', 'Gazipur', 'Narayanganj'
  ];
  
  // Animation functions
  const expandSearchBar = () => {
    setIsSearchFocused(true);
    Animated.parallel([
      Animated.timing(searchBarWidth, {
        toValue: screenWidth - 32, // Full width minus margins
        duration: 300,
        useNativeDriver: false, // Width animation requires false
      }),
      Animated.timing(buttonOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true, // Opacity can use native driver
      }),
      Animated.timing(buttonTranslateX, {
        toValue: 100,
        duration: 300,
        useNativeDriver: true, // Transform can use native driver
      }),
    ]).start();
  };
  
  const shrinkSearchBar = () => {
    setIsSearchFocused(false);
    Animated.parallel([
      Animated.timing(searchBarWidth, {
        toValue: screenWidth - 32 - 96, // Original width
        duration: 300,
        useNativeDriver: false, // Width animation requires false
      }),
      Animated.timing(buttonOpacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true, // Opacity can use native driver
      }),
      Animated.timing(buttonTranslateX, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true, // Transform can use native driver
      }),
    ]).start();
  };
  
  useFocusEffect(
    useCallback(() => {
      const now = Date.now();
      if (now - lastFetchTime.current > 30000) {
        fetchClinics();
        lastFetchTime.current = now;
      }
    }, [])
  );
  
  useEffect(() => {
    filterAndSortClinics();
  }, [searchQuery, selectedDistrict, clinics, sortBy, clinicRatings]);
  
  const fetchClinics = async (isRefresh = false) => {
    if (isRefresh) {
      setIsRefreshing(true);
    } else {
      setLoading(true);
    }
    
    try {
      const data = await getVeterinaryClinics();
      setClinics(data);
      
      // Fetch ratings for all clinics
      await fetchClinicRatings(data);
    } catch (error) {
      console.error('Error fetching clinics:', error);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  const fetchClinicRatings = async (clinicsData) => {
    try {
      const ratingsPromises = clinicsData.map(clinic => 
        getClinicRatingSummary(clinic.id).catch(error => {
          console.error(`Error fetching rating for clinic ${clinic.id}:`, error);
          return { average_rating: 0, total_ratings: 0 };
        })
      );
      
      const ratingsResults = await Promise.all(ratingsPromises);
      
      const ratingsMap = {};
      clinicsData.forEach((clinic, index) => {
        ratingsMap[clinic.id] = ratingsResults[index];
      });
      
      setClinicRatings(ratingsMap);
    } catch (error) {
      console.error('Error fetching clinic ratings:', error);
    }
  };
  
  const filterAndSortClinics = () => {
    let filtered = clinics;
    
    // Apply filters first
    if (searchQuery) {
      filtered = filtered.filter(clinic => 
        clinic.clinic_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        clinic.full_address.toLowerCase().includes(searchQuery.toLowerCase()) ||
        clinic.district?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        clinic.sub_district?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        clinic.services?.some(service => 
          service.serviceName?.toLowerCase().includes(searchQuery.toLowerCase())
        )
      );
    }
    
    if (selectedDistrict) {
      filtered = filtered.filter(clinic => 
        clinic.district?.toLowerCase() === selectedDistrict.toLowerCase()
      );
    }
    
    // Apply sorting
    const sorted = applySorting(filtered);
    setFilteredClinics(sorted);
  };
  
  const applySorting = (clinicsToSort) => {
    const sorted = [...clinicsToSort];
    
    switch (sortBy) {
      case 'rating_high':
        return sorted.sort((a, b) => {
          const ratingA = clinicRatings[a.id]?.average_rating || 0;
          const ratingB = clinicRatings[b.id]?.average_rating || 0;
          if (ratingB !== ratingA) return ratingB - ratingA;
          const reviewsA = clinicRatings[a.id]?.total_ratings || 0;
          const reviewsB = clinicRatings[b.id]?.total_ratings || 0;
          return reviewsB - reviewsA;
        });
        
      case 'rating_low':
        return sorted.sort((a, b) => {
          const ratingA = clinicRatings[a.id]?.average_rating || 0;
          const ratingB = clinicRatings[b.id]?.average_rating || 0;
          if (ratingA !== ratingB) return ratingA - ratingB;
          const reviewsA = clinicRatings[a.id]?.total_ratings || 0;
          const reviewsB = clinicRatings[b.id]?.total_ratings || 0;
          return reviewsA - reviewsB;
        });
        
      case 'name':
        return sorted.sort((a, b) => 
          a.clinic_name.localeCompare(b.clinic_name)
        );
        
      case 'reviews_most':
        return sorted.sort((a, b) => {
          const reviewsA = clinicRatings[a.id]?.total_ratings || 0;
          const reviewsB = clinicRatings[b.id]?.total_ratings || 0;
          if (reviewsB !== reviewsA) return reviewsB - reviewsA;
          const ratingA = clinicRatings[a.id]?.average_rating || 0;
          const ratingB = clinicRatings[b.id]?.average_rating || 0;
          return ratingB - ratingA;
        });
        
      case 'default':
      default:
        return sorted;
    }
  };
  
  const clearFilters = () => {
    setSearchQuery('');
    setSelectedDistrict('');
    setSortBy('default');
    setShowFilters(false);
  };
  
  const handleSortSelection = (value) => {
    setSortBy(value);
    setShowSortModal(false);
  };
  
  const getCurrentSortLabel = () => {
    const option = sortOptions.find(opt => opt.value === sortBy);
    return option ? option.label : 'Default Order';
  };
  
  const handleClinicPress = (clinicId) => {
    router.push({
      pathname: '/vetProfileViewScreen',
      params: { clinicId }
    });
  };
  
  // Search bar event handlers
  const handleSearchFocus = () => {
    expandSearchBar();
  };
  
  const handleSearchBlur = () => {
    // Only shrink if there's no search query
    if (!searchQuery.trim()) {
      shrinkSearchBar();
    }
  };
  
  const handleSearchClear = () => {
    setSearchQuery('');
    shrinkSearchBar();
  };
  
  const renderClinicCard = ({ item }) => {
    const displayServices = item.services?.slice(0, 3) || [];
    const hasMoreServices = item.services?.length > 3;
    const rating = clinicRatings[item.id] || { average_rating: 0, total_ratings: 0 };
    
    return (
      <TouchableOpacity onPress={() => handleClinicPress(item.id)}>
        <Card style={[styles.clinicCard, isDark && styles.clinicCardDark]}>
          {/* Cover Photo */}
          {item.cover_photo_url ? (
            <Card.Cover 
              source={{ uri: item.cover_photo_url }} 
              style={styles.coverPhoto}
            />
          ) : (
            <View style={[styles.placeholderCover, isDark && styles.placeholderCoverDark]}>
              <Avatar.Icon 
                size={60} 
                icon="hospital-building"
                backgroundColor="transparent"
                color={isDark ? '#fff' : '#666'}
              />
            </View>
          )}
          
          <Card.Content style={styles.cardContent}>
            {/* Header Row with Clinic Name and Rating */}
            <View style={styles.headerRow}>
              <View style={styles.clinicInfo}>
                <ThemedText style={styles.clinicName}>{item.clinic_name}</ThemedText>
                <ThemedText style={styles.location}>
                  📍 {item.sub_district ? `${item.sub_district}, ` : ''}{item.district}
                </ThemedText>
              </View>
              
              {/* Rating Section */}
              <View style={styles.ratingSection}>
                {rating.total_ratings > 0 ? (
                  <>
                    <StarRating 
                      rating={rating.average_rating} 
                      readonly={true} 
                      size={16}
                    />
                    <ThemedText style={styles.ratingText}>
                      {rating.average_rating.toFixed(1)}
                    </ThemedText>
                    <ThemedText style={styles.reviewCount}>
                      ({rating.total_ratings})
                    </ThemedText>
                  </>
                ) : (
                  <View style={styles.noRatingContainer}>
                    <StarRating 
                      rating={0} 
                      readonly={true} 
                      size={16}
                    />
                    <ThemedText style={styles.noRatingText}>
                      No reviews
                    </ThemedText>
                  </View>
                )}
              </View>
            </View>
            
            {/* Contact */}
            <ThemedText style={styles.contact}>
              📞 {item.primary_contact}
            </ThemedText>
            
            {/* Visiting Hours */}
            <ThemedText style={styles.hours}>
              🕒 Sat-Thu: {item.sat_to_thu_from} - {item.sat_to_thu_to}
            </ThemedText>
            
            {/* Services */}
            {displayServices.length > 0 && (
              <View style={styles.servicesContainer}>
                <ThemedText style={styles.servicesLabel}>Services:</ThemedText>
                <View style={styles.servicesChips}>
                  {displayServices.map((service, index) => (
                    <Chip 
                      key={index} 
                      style={styles.serviceChip}
                      textStyle={styles.serviceChipText}
                    >
                      {service.serviceName}
                      {service.fee && ` (৳${service.fee})`}
                    </Chip>
                  ))}
                  {hasMoreServices && (
                    <Chip style={styles.moreChip}>
                      +{item.services.length - 3} more
                    </Chip>
                  )}
                </View>
              </View>
            )}
          </Card.Content>
        </Card>
      </TouchableOpacity>
    );
  };
  
  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Avatar.Icon size={80} icon="hospital-building" backgroundColor="#e0e0e0" />
      <ThemedText type="title" style={styles.emptyTitle}>
        No Veterinary Clinics Found
      </ThemedText>
      <ThemedText style={styles.emptyText}>
        {searchQuery || selectedDistrict 
          ? "Try adjusting your search filters" 
          : "No approved veterinary clinics available at the moment"}
      </ThemedText>
      {(searchQuery || selectedDistrict) && (
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
          <ThemedText style={styles.sortModalTitle}>Sort Clinics By</ThemedText>
          
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
                    iconColor={sortBy === option.value ? '#E91E63' : '#666'}
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
            placeholder={isSearchFocused ? "Search clinics, services, location..." : "Search Clinics"}
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
          <IconButton
            icon="filter-variant"
            size={24}
            onPress={() => setShowFilters(!showFilters)}
            style={styles.actionButton}
            iconColor={showFilters ? '#E91E63' : undefined}
          />
          <IconButton
            icon="sort"
            size={24}
            onPress={() => setShowSortModal(true)}
            style={styles.actionButton}
            iconColor={sortBy !== 'default' ? '#E91E63' : undefined}
          />
        </Animated.View>
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
          
          {(searchQuery || selectedDistrict) && (
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
          <ActivityIndicator size="large" color="#0a7ea4" />
          <ThemedText style={styles.loadingText}>Loading veterinary clinics...</ThemedText>
        </View>
      ) : (
        <FlatList
          data={filteredClinics}
          renderItem={renderClinicCard}
          keyExtractor={item => item.id.toString()}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={renderEmptyState}
          refreshing={isRefreshing}
          onRefresh={() => fetchClinics(true)}
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
    height: 56, // Fixed height to prevent layout shift
  },
  searchBarContainer: {
    // Width is controlled by animation
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
  // Sort-related styles
  activeSortContainer: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  activeSortChip: {
    alignSelf: 'flex-start',
    backgroundColor: '#f8f9fa',
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
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  sortOptionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  sortOptionText: {
    fontSize: 16,
    marginLeft: 8,
  },
  sortOptionTextSelected: {
    color: '#E91E63',
    fontWeight: '600',
  },
  sortModalCloseButton: {
    marginTop: 16,
  },
  // Existing styles...
  filtersContainer: {
    padding: 16,
    paddingTop: 8,
  },
  filterLabel: {
    fontSize: 14,
    marginBottom: 8,
    fontWeight: '500',
  },
  districtChipsContainer: {
    paddingVertical: 4,
  },
  districtChip: {
    marginRight: 8,
  },
  clearFiltersButton: {
    alignSelf: 'flex-start',
    marginTop: 8,
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
  clinicCard: {
    marginBottom: 16,
    elevation: 2,
  },
  clinicCardDark: {
    backgroundColor: '#333',
  },
  coverPhoto: {
    height: 150,
  },
  placeholderCover: {
    height: 150,
    backgroundColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderCoverDark: {
    backgroundColor: '#444',
  },
  cardContent: {
    padding: 16,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  clinicInfo: {
    flex: 1,
    marginRight: 12,
  },
  clinicName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  location: {
    fontSize: 14,
    opacity: 0.8,
  },
  ratingSection: {
    alignItems: 'flex-end',
    minWidth: 80,
  },
  ratingText: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 2,
    color: '#FFD700',
  },
  reviewCount: {
    fontSize: 12,
    opacity: 0.7,
    marginTop: 1,
  },
  noRatingContainer: {
    alignItems: 'flex-end',
  },
  noRatingText: {
    fontSize: 12,
    opacity: 0.5,
    marginTop: 2,
  },
  contact: {
    fontSize: 14,
    opacity: 0.8,
    marginBottom: 2,
  },
  hours: {
    fontSize: 14,
    opacity: 0.8,
    marginBottom: 12,
  },
  servicesContainer: {
    marginTop: 8,
  },
  servicesLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 6,
  },
  servicesChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  serviceChip: {
    marginRight: 6,
    marginBottom: 4,
  },
  serviceChipText: {
    fontSize: 12,
  },
  moreChip: {
    backgroundColor: '#f0f0f0',
  },
});