// app/(main)/(screens)/vetSearchScreen.jsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { FlatList, StyleSheet, View, TouchableOpacity } from 'react-native';
import { 
  Card, 
  Text, 
  Avatar, 
  ActivityIndicator, 
  Searchbar, 
  Chip,
  Button,
  IconButton,
  Divider
} from 'react-native-paper';
import { router } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native'; // ← Add this import
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { useColorScheme } from '@/hooks/useColorScheme';
import { getVeterinaryClinics } from '@/services/supabase';

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
  
  // Common districts in Bangladesh (you can expand this)
  const districts = [
    'Dhaka', 'Chittagong', 'Rajshahi', 'Khulna', 'Barisal', 'Sylhet', 
    'Rangpur', 'Mymensingh', 'Comilla', 'Gazipur', 'Narayanganj'
  ];
  
  // ✅ Replace useEffect with useFocusEffect for refocusing behavior
  useFocusEffect(
    useCallback(() => {
      const now = Date.now();
      // Only fetch if it's been more than 30 seconds since last fetch
      if (now - lastFetchTime.current > 30000) {
        fetchClinics();
        lastFetchTime.current = now;
      }
    }, [])
  );
  
  useEffect(() => {
    filterClinics();
  }, [searchQuery, selectedDistrict, clinics]);
  
  const fetchClinics = async (isRefresh = false) => {
    if (isRefresh) {
      setIsRefreshing(true);
    } else {
      setLoading(true);
    }
    
    try {
      const data = await getVeterinaryClinics();
      setClinics(data);
      setFilteredClinics(data);
    } catch (error) {
      console.error('Error fetching clinics:', error);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };
  
  const filterClinics = () => {
    let filtered = clinics;
    
    // Filter by search query (clinic name, address, services)
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
    
    // Filter by district
    if (selectedDistrict) {
      filtered = filtered.filter(clinic => 
        clinic.district?.toLowerCase() === selectedDistrict.toLowerCase()
      );
    }
    
    setFilteredClinics(filtered);
  };
  
  const clearFilters = () => {
    setSearchQuery('');
    setSelectedDistrict('');
    setShowFilters(false);
  };
  
  const handleClinicPress = (clinicId) => {
    router.push({
      pathname: '/vetProfileViewScreen',
      params: { clinicId }
    });
  };
  
  const renderClinicCard = ({ item }) => {
    // Get first few services to display
    const displayServices = item.services?.slice(0, 3) || [];
    const hasMoreServices = item.services?.length > 3;
    
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
            {/* Clinic Name & Location */}
            <ThemedText style={styles.clinicName}>{item.clinic_name}</ThemedText>
            <ThemedText style={styles.location}>
              📍 {item.sub_district ? `${item.sub_district}, ` : ''}{item.district}
            </ThemedText>
            
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
  
  return (
    <ThemedView style={styles.container}>
      {/* Search Header */}
      <View style={styles.searchContainer}>
        <Searchbar
          placeholder="Search clinics, services, location..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchBar}
        />
        <IconButton
          icon="filter-variant"
          size={24}
          onPress={() => setShowFilters(!showFilters)}
          style={styles.filterButton}
          iconColor={showFilters ? '#0a7ea4' : undefined}
        />
      </View>
      
      {/* Filters */}
      {showFilters && (
        <View style={styles.filtersContainer}>
          <ThemedText style={styles.filterLabel}>Filter by District:</ThemedText>
          <FlatList
            horizontal
            data={districts}
            keyExtractor={(item) => item}
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
          refreshing={loading}
          onRefresh={fetchClinics}
        />
      )}
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
  clinicName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  location: {
    fontSize: 14,
    opacity: 0.8,
    marginBottom: 2,
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