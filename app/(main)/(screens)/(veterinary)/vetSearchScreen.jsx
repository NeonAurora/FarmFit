// app/(main)/(screens)/(veterinary)/vetSearchScreen.jsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { FlatList, StyleSheet, View, Pressable, Modal, Animated, Dimensions } from 'react-native';
import { 
  Avatar, 
  ActivityIndicator, 
  Searchbar, 
  Chip,
  Button,
  IconButton,
  Divider,
  RadioButton,
  Portal,
  Surface,
  FAB,
  ProgressBar,
  Text
} from 'react-native-paper';
import { router } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { ThemedView } from '@/components/themes/ThemedView';
import { ThemedText } from '@/components/themes/ThemedText';
import { ThemedCard } from '@/components/themes/ThemedCard';
import { ThemedButton } from '@/components/themes/ThemedButton';
import { useTheme } from '@/contexts/ThemeContext';
import { useCardColors, useChipColors, useActivityIndicatorColors } from '@/hooks/useThemeColor';
import { getVeterinaryClinics } from '@/services/supabase';
import { getClinicRatingSummary } from '@/services/supabase/ratingService';
import { StarRating } from '@/components/veterinary/StarRating';

const { width: screenWidth } = Dimensions.get('window');

export default function VetSearchScreen() {
  const lastFetchTime = useRef(0);
  const { colors, isDark, brandColors } = useTheme();
  const cardColors = useCardColors();
  const chipColors = useChipColors();
  const activityIndicatorColors = useActivityIndicatorColors();
  
  const [clinics, setClinics] = useState([]);
  const [filteredClinics, setFilteredClinics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [clinicRatings, setClinicRatings] = useState({});
  const [showSortModal, setShowSortModal] = useState(false);
  const [sortBy, setSortBy] = useState('default');
  
  // View mode cycling state
  const [viewMode, setViewMode] = useState('full'); // 'full' | 'compact' | 'grid'
  const viewModeAnimation = useRef(new Animated.Value(1)).current;
  
  // Search bar animation state
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const searchBarWidth = useRef(new Animated.Value(screenWidth - 32 - 144)).current; // For 3 buttons
  const buttonOpacity = useRef(new Animated.Value(1)).current;
  const buttonTranslateX = useRef(new Animated.Value(0)).current;
  
  // View mode definitions
  const viewModes = [
    { mode: 'full', icon: 'view-agenda', label: 'Full View' },
    { mode: 'compact', icon: 'view-list', label: 'Compact View' },
    { mode: 'grid', icon: 'view-grid', label: 'Grid View' }
  ];
  
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

  // Search animation handlers
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
        toValue: 150,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleSearchBlur = () => {
    setIsSearchFocused(false);
    Animated.parallel([
      Animated.timing(searchBarWidth, {
        toValue: screenWidth - 32 - 144,
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

  // Get number of columns for FlatList
  const getNumColumns = () => {
    return viewMode === 'grid' ? 2 : 1;
  };
  
  const renderClinicCard = ({ item }) => {
    const displayServices = item.services?.slice(0, 2) || [];
    const hasMoreServices = item.services?.length > 2;
    const rating = clinicRatings[item.id] || { average_rating: 0, total_ratings: 0 };
    
    // Grid View
    if (viewMode === 'grid') {
      return (
        <View style={styles.gridItemContainer}>
          <Pressable onPress={() => handleClinicPress(item.id)}>
            <ThemedCard style={styles.gridCard} variant="elevated">
              <View style={styles.gridCardContent}>
                {/* Clinic Image */}
                {item.cover_photo_url ? (
                  <Avatar.Image 
                    size={64}
                    source={{ uri: item.cover_photo_url }}
                    style={{ borderRadius: 8 }}
                  />
                ) : (
                  <Avatar.Icon 
                    size={64} 
                    icon="hospital-building"
                    backgroundColor={colors.primary + '20'}
                    color={colors.primary}
                  />
                )}
                
                <ThemedText style={styles.gridName}>{item.clinic_name}</ThemedText>
                <ThemedText style={styles.gridLocation}>
                  {item.sub_district ? `${item.sub_district}, ` : ''}{item.district}
                </ThemedText>
                
                {/* Rating */}
                <View style={styles.gridRating}>
                  {rating.total_ratings > 0 ? (
                    <>
                      <StarRating 
                        rating={rating.average_rating} 
                        readonly={true} 
                        size={12}
                      />
                      <ThemedText style={styles.gridRatingText}>
                        {rating.average_rating.toFixed(1)} ({rating.total_ratings})
                      </ThemedText>
                    </>
                  ) : (
                    <ThemedText style={styles.gridNoRating}>No reviews</ThemedText>
                  )}
                </View>
              </View>
            </ThemedCard>
          </Pressable>
        </View>
      );
    }
    
    // Compact View
    if (viewMode === 'compact') {
      return (
        <Pressable onPress={() => handleClinicPress(item.id)}>
          <ThemedCard style={styles.compactCard} variant="elevated">
            <View style={styles.compactContent}>
              <View style={styles.compactHeader}>
                {/* Small Image */}
                {item.cover_photo_url ? (
                  <Avatar.Image 
                    size={40}
                    source={{ uri: item.cover_photo_url }}
                    style={{ borderRadius: 6 }}
                  />
                ) : (
                  <Avatar.Icon 
                    size={40} 
                    icon="hospital-building"
                    backgroundColor={colors.primary + '20'}
                    color={colors.primary}
                  />
                )}
                
                {/* Clinic Info */}
                <View style={styles.compactInfo}>
                  <ThemedText style={styles.compactName}>{item.clinic_name}</ThemedText>
                  <ThemedText style={styles.compactLocation}>
                    {item.sub_district ? `${item.sub_district}, ` : ''}{item.district}
                  </ThemedText>
                </View>
                
                {/* Rating */}
                <View style={styles.compactRating}>
                  {rating.total_ratings > 0 ? (
                    <>
                      <View style={styles.compactRatingRow}>
                        <StarRating 
                          rating={rating.average_rating} 
                          readonly={true} 
                          size={12}
                        />
                        <ThemedText style={styles.compactRatingText}>
                          {rating.average_rating.toFixed(1)}
                        </ThemedText>
                      </View>
                      <ThemedText style={styles.compactReviews}>
                        {rating.total_ratings} reviews
                      </ThemedText>
                    </>
                  ) : (
                    <ThemedText style={styles.compactNoRating}>No reviews</ThemedText>
                  )}
                </View>
              </View>
            </View>
          </ThemedCard>
        </Pressable>
      );
    }
    
    // Full View (Default)
    return (
      <Pressable onPress={() => handleClinicPress(item.id)}>
        <ThemedCard style={styles.clinicCard} variant="elevated">
          <View style={styles.cardContent}>
            {/* Header with Image and Info */}
            <View style={styles.headerSection}>
              {/* Clinic Image - Compact */}
              <View style={styles.imageContainer}>
                {item.cover_photo_url ? (
                  <Surface style={styles.clinicImage}>
                    <Avatar.Image 
                      size={56}
                      source={{ uri: item.cover_photo_url }}
                      style={{ borderRadius: 8 }}
                      backgroundColor="transparent"
                    />
                  </Surface>
                ) : (
                  <Surface style={[styles.clinicImage, { backgroundColor: colors.backgroundSecondary }]}>
                    <Avatar.Icon 
                      size={48} 
                      icon="hospital-building"
                      backgroundColor="transparent"
                      color={colors.primary}
                    />
                  </Surface>
                )}
              </View>
              
              {/* Clinic Info */}
              <View style={styles.clinicInfo}>
                <ThemedText style={styles.clinicName}>{item.clinic_name}</ThemedText>
                
                <View style={styles.locationRow}>
                  <IconButton 
                    icon="map-marker" 
                    size={14} 
                    iconColor={colors.textSecondary}
                    style={styles.locationIcon}
                  />
                  <ThemedText style={styles.location}>
                    {item.sub_district ? `${item.sub_district}, ` : ''}{item.district}
                  </ThemedText>
                </View>
                
                <View style={styles.contactRow}>
                  <IconButton 
                    icon="phone" 
                    size={14} 
                    iconColor={colors.textSecondary}
                    style={styles.contactIcon}
                  />
                  <ThemedText style={styles.contact}>{item.primary_contact}</ThemedText>
                </View>
              </View>
              
              {/* Rating Section */}
              <View style={styles.ratingSection}>
                {rating.total_ratings > 0 ? (
                  <>
                    <View style={styles.ratingRow}>
                      <StarRating 
                        rating={rating.average_rating} 
                        readonly={true} 
                        size={14}
                      />
                      <ThemedText style={styles.ratingText}>
                        {rating.average_rating.toFixed(1)}
                      </ThemedText>
                    </View>
                    <ThemedText style={styles.reviewCount}>
                      {rating.total_ratings} review{rating.total_ratings !== 1 ? 's' : ''}
                    </ThemedText>
                  </>
                ) : (
                  <View style={styles.noRatingContainer}>
                    <StarRating 
                      rating={0} 
                      readonly={true} 
                      size={14}
                    />
                    <ThemedText style={styles.noRatingText}>No reviews</ThemedText>
                  </View>
                )}
              </View>
            </View>
            
            {/* Compact Info Row */}
            <View style={styles.infoRow}>
              <View style={styles.hoursContainer}>
                <IconButton 
                  icon="clock-outline" 
                  size={12} 
                  iconColor={colors.textSecondary}
                  style={styles.infoIcon}
                />
                <ThemedText style={styles.hoursText}>
                  {item.sat_to_thu_from} - {item.sat_to_thu_to}
                </ThemedText>
              </View>
            </View>
            
            {/* Services - Compact */}
            {displayServices.length > 0 && (
              <View style={styles.servicesContainer}>
                <View style={styles.servicesRow}>
                  {displayServices.map((service, index) => (
                    <Chip 
                      key={index} 
                      style={[styles.serviceChip, { backgroundColor: chipColors.background }]}
                      textStyle={[styles.serviceChipText, { color: chipColors.text }]}
                      compact
                    >
                      {service.serviceName}
                      {service.fee && ` ৳${service.fee}`}
                    </Chip>
                  ))}
                  {hasMoreServices && (
                    <Chip 
                      style={[styles.moreChip, { backgroundColor: chipColors.selected }]}
                      textStyle={{ color: chipColors.selectedText }}
                      compact
                    >
                      +{item.services.length - 2}
                    </Chip>
                  )}
                </View>
              </View>
            )}
          </View>
        </ThemedCard>
      </Pressable>
    );
  };
  
  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Avatar.Icon 
        size={64} 
        icon="hospital-building" 
        backgroundColor={chipColors.background}
        color={colors.textSecondary}
      />
      <ThemedText type="title" style={styles.emptyTitle}>
        No Veterinary Clinics Found
      </ThemedText>
      <ThemedText style={styles.emptyText}>
        {searchQuery || selectedDistrict 
          ? "Try adjusting your search filters" 
          : "No approved veterinary clinics available at the moment"}
      </ThemedText>
      {(searchQuery || selectedDistrict) && (
        <ThemedButton variant="outlined" onPress={clearFilters} style={styles.clearButton}>
          Clear Filters
        </ThemedButton>
      )}
    </View>
  );
  
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
          <ThemedText style={styles.sortModalTitle}>Sort Clinics By</ThemedText>
          
          <RadioButton.Group
            onValueChange={handleSortSelection}
            value={sortBy}
          >
            {sortOptions.map((option) => (
              <Pressable
                key={option.value}
                style={styles.sortOption}
                onPress={() => handleSortSelection(option.value)}
              >
                <View style={styles.sortOptionContent}>
                  <IconButton
                    icon={option.icon}
                    size={20}
                    iconColor={sortBy === option.value ? colors.primary : colors.textSecondary}
                    style={styles.sortIcon}
                  />
                  <ThemedText style={[
                    styles.sortOptionText,
                    sortBy === option.value && { color: colors.primary, fontWeight: '600' }
                  ]}>
                    {option.label}
                  </ThemedText>
                </View>
                <RadioButton value={option.value} />
              </Pressable>
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
      {/* Animated Search Header */}
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
            placeholder={isSearchFocused ? "Search clinics, services, location..." : "Search Clinics"}
            onChangeText={setSearchQuery}
            value={searchQuery}
            onFocus={handleSearchFocus}
            onBlur={handleSearchBlur}
            onClearIconPress={handleSearchClear}
            style={[
              styles.searchBar, 
              { 
                backgroundColor: colors.backgroundSecondary,
                elevation: 4,
              }
            ]}
            inputStyle={{ color: colors.text }}
            iconColor={colors.textSecondary}
            placeholderTextColor={colors.textSecondary}
          />
        </Animated.View>
        
        {/* Animated Button Container */}
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
            iconColor={showFilters ? brandColors.primary : colors.textSecondary}
            style={styles.actionButton}
          />
          <IconButton
            icon="sort"
            size={24}
            onPress={() => setShowSortModal(true)}
            iconColor={sortBy !== 'default' ? brandColors.primary : colors.textSecondary}
            style={styles.actionButton}
          />
        </Animated.View>
      </View>
      
      {/* View Mode Indicator */}
      <View style={[styles.viewModeIndicator, { backgroundColor: colors.background }]}>
        <Text variant="bodySmall" style={[styles.viewModeText, { color: colors.textSecondary }]}>
          {getCurrentViewMode().label} ({filteredClinics.length} clinics)
        </Text>
      </View>
      
      {/* Active Sort/Filter Indicators */}
      {(sortBy !== 'default' || selectedDistrict) && (
        <View style={styles.activeFiltersContainer}>
          {sortBy !== 'default' && (
            <Chip
              icon="sort"
              style={[styles.activeFilterChip, { backgroundColor: chipColors.selected }]}
              textStyle={{ color: chipColors.selectedText }}
              onClose={() => setSortBy('default')}
              compact
            >
              {getCurrentSortLabel()}
            </Chip>
          )}
          {selectedDistrict && (
            <Chip
              icon="map-marker"
              style={[styles.activeFilterChip, { backgroundColor: chipColors.selected }]}
              textStyle={{ color: chipColors.selectedText }}
              onClose={() => setSelectedDistrict('')}
              compact
            >
              {selectedDistrict}
            </Chip>
          )}
        </View>
      )}
      
      {/* Filters Panel */}
      {showFilters && (
        <Surface style={[styles.filtersPanel, { backgroundColor: colors.surface }]} elevation={1}>
          <ThemedText style={styles.filterLabel}>Filter by District</ThemedText>
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
                textStyle={selectedDistrict === item ? { color: chipColors.selectedText } : undefined}
                compact
              >
                {item}
              </Chip>
            )}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.districtChipsContainer}
            keyExtractor={(item) => item}
          />
          
          {(searchQuery || selectedDistrict) && (
            <ThemedButton 
              variant="outlined" 
              onPress={clearFilters} 
              style={styles.clearFiltersButton}
              compact
            >
              Clear All Filters
            </ThemedButton>
          )}
        </Surface>
      )}
      
      {/* Results */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ProgressBar indeterminate color={colors.primary} style={styles.progressBar} />
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
          showsVerticalScrollIndicator={false}
          numColumns={getNumColumns()}
          key={viewMode} // Force re-render when view mode changes
        />
      )}
      
      {/* Sort Modal */}
      {renderSortModal()}
      
      {/* Refresh FAB */}
      <FAB
        icon="refresh"
        style={[styles.refreshFab, { backgroundColor: colors.primary }]}
        onPress={() => fetchClinics(true)}
        size="small"
        visible={!loading}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  
  // Animated Search Header
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 16,
    marginBottom: 8,
    height: 56,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    borderRadius: 8,
    paddingHorizontal: 8,
  },
  searchBarContainer: {
    paddingBottom: 15,
    paddingRight: 0,
    paddingLeft: 0,
    marginLeft: -5,
    marginRight: 0,
  },
  searchBar: {
    elevation: 0,
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
  
  // View Mode Indicator
  viewModeIndicator: {
    paddingHorizontal: 16,
    paddingVertical: 4,
  },
  viewModeText: {
    textAlign: 'center',
    fontWeight: '500',
  },
  
  // Active Filters
  activeFiltersContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 8,
    gap: 8,
  },
  activeFilterChip: {
    height: 28,
  },
  
  // Filters Panel
  filtersPanel: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  districtChipsContainer: {
    paddingVertical: 4,
    gap: 8,
  },
  districtChip: {
    height: 32,
  },
  clearFiltersButton: {
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  
  // List Content
  listContent: {
    padding: 16,
    paddingBottom: 100,
  },
  
  // Full View (Default) - Same as before
  clinicCard: {
    marginBottom: 12,
  },
  cardContent: {
    padding: 12,
  },
  headerSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  imageContainer: {
    marginRight: 12,
  },
  clinicImage: {
    width: 56,
    height: 56,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  clinicInfo: {
    flex: 1,
    marginRight: 12,
  },
  clinicName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  locationIcon: {
    margin: 0,
    marginRight: 4,
  },
  location: {
    fontSize: 13,
    opacity: 0.8,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  contactIcon: {
    margin: 0,
    marginRight: 4,
  },
  contact: {
    fontSize: 13,
    opacity: 0.8,
  },
  ratingSection: {
    alignItems: 'flex-end',
    minWidth: 80,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFD700',
  },
  reviewCount: {
    fontSize: 11,
    opacity: 0.7,
    marginTop: 2,
  },
  noRatingContainer: {
    alignItems: 'flex-end',
  },
  noRatingText: {
    fontSize: 11,
    opacity: 0.5,
    marginTop: 2,
  },
  
  // Info Row
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  hoursContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoIcon: {
    margin: 0,
    marginRight: 4,
  },
  hoursText: {
    fontSize: 12,
    opacity: 0.8,
  },
  
  // Services
  servicesContainer: {
    marginTop: 4,
  },
  servicesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  serviceChip: {
    height: 24,
  },
  serviceChipText: {
    fontSize: 10,
  },
  moreChip: {
    height: 24,
  },
  
  // Compact View
  compactCard: {
    marginBottom: 8,
  },
  compactContent: {
    padding: 12,
  },
  compactHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  compactInfo: {
    flex: 1,
    marginLeft: 12,
    marginRight: 12,
  },
  compactName: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  compactLocation: {
    fontSize: 12,
    opacity: 0.8,
  },
  compactRating: {
    alignItems: 'flex-end',
    minWidth: 70,
  },
  compactRatingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  compactRatingText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFD700',
  },
  compactReviews: {
    fontSize: 10,
    opacity: 0.6,
    marginTop: 1,
  },
  compactNoRating: {
    fontSize: 10,
    opacity: 0.5,
  },
  
  // Grid View
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
    paddingHorizontal: 12,
  },
  gridName: {
    textAlign: 'center',
    fontWeight: '600',
    marginTop: 8,
    marginBottom: 4,
    fontSize: 14,
  },
  gridLocation: {
    textAlign: 'center',
    opacity: 0.7,
    marginBottom: 8,
    fontSize: 12,
  },
  gridRating: {
    alignItems: 'center',
  },
  gridRatingText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFD700',
    marginTop: 2,
  },
  gridNoRating: {
    fontSize: 10,
    opacity: 0.5,
  },
  
  // Loading State
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  progressBar: {
    width: '60%',
    marginBottom: 16,
  },
  loadingText: {
    marginTop: 8,
  },
  
  // Empty State
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyTitle: {
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyText: {
    textAlign: 'center',
    opacity: 0.7,
    marginBottom: 16,
  },
  clearButton: {
    marginTop: 8,
  },
  
  // Sort Modal
  sortModal: {
    margin: 20,
    borderRadius: 12,
    elevation: 8,
  },
  sortModalContent: {
    padding: 20,
  },
  sortModalTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    textAlign: 'center',
  },
  sortOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 4,
    minHeight: 48,
  },
  sortOptionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  sortIcon: {
    margin: 0,
    marginRight: 8,
  },
  sortOptionText: {
    fontSize: 16,
  },
  sortModalCloseButton: {
    marginTop: 16,
  },
  
  // FAB
  refreshFab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
});