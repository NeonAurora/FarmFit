// app/(main)/(screens)/petListScreen.jsx
import React, { useState } from 'react';
import { FlatList, StyleSheet, View, TouchableOpacity, RefreshControl } from 'react-native';
import { Card, Text, Avatar, ActivityIndicator, FAB, Searchbar, IconButton } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { ThemedView } from '@/components/themes/ThemedView';
import { ThemedText } from '@/components/themes/ThemedText';
import { useColorScheme } from '@/hooks/useColorScheme';
import { router } from 'expo-router';
import { usePets } from '@/hooks/usePetsData';

export default function PetListScreen() {
  const navigation = useNavigation();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const [searchQuery, setSearchQuery] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Use the hook instead of managing state and fetching manually
  const { pets, loading, error, refetch } = usePets();
  
  const handleAddPet = () => {
    router.push("/addPetScreen");
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
      await refetch();
    } catch (error) {
      console.error('Error refreshing pets:', error);
    } finally {
      setIsRefreshing(false);
    }
  };
  
  const getFilteredPets = () => {
    if (!searchQuery) return pets;
    
    return pets.filter(pet => 
      pet.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      pet.species.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };
  
  const renderPetCard = ({ item }) => {
    return (
      <TouchableOpacity onPress={() => handlePetPress(item.id)}>
        <Card style={[styles.petCard, isDark && styles.petCardDark]}>
          <Card.Content style={styles.cardContent}>
            {/* Left side - Image/Avatar */}
            <View style={styles.cardImageContainer}>
              {item.image_url ? (
                <Avatar.Image size={60} source={{ uri: item.image_url }} />
              ) : (
                <Avatar.Icon 
                  size={60} 
                  icon="paw"
                  backgroundColor={isDark ? '#444' : '#e0e0e0'}
                  color={isDark ? '#fff' : '#666'}
                />
              )}
            </View>
            
            {/* Right side - Info */}
            <View style={styles.cardInfoContainer}>
              <ThemedText style={styles.petName}>{item.name}</ThemedText>
              <ThemedText style={styles.petSpecies}>{item.species}</ThemedText>
              
              {/* Show pet type if available */}
              {item.pet_type && (
                <View style={styles.petTypeBadge}>
                  <Text style={styles.petTypeText}>
                    {item.pet_type}
                  </Text>
                </View>
              )}
            </View>
          </Card.Content>
        </Card>
      </TouchableOpacity>
    );
  };
  
  return (
    <ThemedView style={styles.container}>
      {/* Search bar with refresh button */}
      <View style={styles.searchContainer}>
        <Searchbar
          placeholder="Search pets..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchBar}
        />
        <IconButton
          icon="refresh"
          size={24}
          onPress={handleRefresh}
          disabled={isRefreshing || loading}
          style={styles.refreshButton}
        />
      </View>
      
      {error ? (
        <View style={styles.errorContainer}>
          <ThemedText type="title">Error</ThemedText>
          <ThemedText style={styles.errorText}>{error}</ThemedText>
          <IconButton
            icon="refresh"
            size={32}
            onPress={handleRefresh}
            disabled={isRefreshing}
            style={styles.errorRefreshButton}
          />
        </View>
      ) : loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0a7ea4" />
          <ThemedText style={styles.loadingText}>Loading your pets...</ThemedText>
        </View>
      ) : pets.length === 0 ? (
        <View style={styles.emptyContainer}>
          <ThemedText type="title">No Pets Yet</ThemedText>
          <ThemedText style={styles.emptyText}>
            Tap the + button to add your first pet
          </ThemedText>
          <IconButton
            icon="refresh"
            size={32}
            onPress={handleRefresh}
            disabled={isRefreshing}
            style={styles.emptyRefreshButton}
          />
        </View>
      ) : (
        <FlatList
          data={getFilteredPets()}
          renderItem={renderPetCard}
          keyExtractor={item => item.id.toString()}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              colors={['#0a7ea4']}
              tintColor="#0a7ea4"
            />
          }
        />
      )}
      
      <FAB
        icon="plus"
        style={styles.fab}
        onPress={handleAddPet}
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
  refreshButton: {
    marginLeft: 8,
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
  },
  emptyRefreshButton: {
    marginTop: 16,
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
  petCard: {
    marginBottom: 12,
    elevation: 2,
  },
  petCardDark: {
    backgroundColor: '#333',
  },
  cardContent: {
    flexDirection: 'row',
    padding: 8,
  },
  cardImageContainer: {
    marginRight: 16,
    justifyContent: 'center',
  },
  cardInfoContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  petName: {
    fontSize: 18,
    fontWeight: '600',
  },
  petSpecies: {
    fontSize: 14,
    opacity: 0.7,
    marginBottom: 6,
  },
  petTypeBadge: {
    backgroundColor: '#0a7ea4',
    paddingHorizontal: 10,
    paddingVertical: 2,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  petTypeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: '#0a7ea4',
  },
});