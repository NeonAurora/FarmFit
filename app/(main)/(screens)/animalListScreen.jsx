// screens/AnimalListScreen.jsx
import React, { useState, useEffect } from 'react';
import { FlatList, StyleSheet, View, TouchableOpacity } from 'react-native';
import { Card, Text, Avatar, ActivityIndicator, FAB, Searchbar, Chip } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { supabase } from '@/services/supabase/config';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { useAuth } from '@/contexts/AuthContext';
import { useColorScheme } from '@/hooks/useColorScheme';

export default function AnimalListScreen() {
  const { user } = useAuth();
  const navigation = useNavigation();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  
  const [animals, setAnimals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState('all'); // 'all', 'livestock', 'pet'
  
  useEffect(() => {
    if (user?.sub) {
      fetchAnimals();
    }
  }, [user, filter]);
  
  const fetchAnimals = async () => {
    if (!user?.sub) return;
    
    setLoading(true);
    try {
      let query = supabase
        .from('animals')
        .select('*')
        .eq('user_id', user.sub)
        .order('created_at', { ascending: false });
      
      // Apply filter if not 'all'
      if (filter !== 'all') {
        query = query.eq('animal_type', filter);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      setAnimals(data || []);
    } catch (error) {
      console.error('Error fetching animals:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const handleAddAnimal = () => {
    navigation.navigate('AddAnimal');
  };
  
  const handleAnimalPress = (animalId) => {
    navigation.navigate('AnimalProfile', { animalId });
  };
  
  const getFilteredAnimals = () => {
    if (!searchQuery) return animals;
    
    return animals.filter(animal => 
      animal.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      animal.species.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };
  
  const renderAnimalCard = ({ item }) => {
    return (
      <TouchableOpacity onPress={() => handleAnimalPress(item.id)}>
        <Card style={[styles.animalCard, isDark && styles.animalCardDark]}>
          <Card.Content style={styles.cardContent}>
            {/* Left side - Image/Avatar */}
            <View style={styles.cardImageContainer}>
              {item.image_url ? (
                <Avatar.Image size={60} source={{ uri: item.image_url }} />
              ) : (
                <Avatar.Icon 
                  size={60} 
                  icon={item.animal_type === 'pet' ? 'paw' : 'cow'} 
                  backgroundColor={isDark ? '#444' : '#e0e0e0'}
                  color={isDark ? '#fff' : '#666'}
                />
              )}
            </View>
            
            {/* Right side - Info */}
            <View style={styles.cardInfoContainer}>
              <ThemedText style={styles.animalName}>{item.name}</ThemedText>
              <ThemedText style={styles.animalSpecies}>{item.species}</ThemedText>
              
              <View style={[
                styles.animalTypeBadge, 
                item.animal_type === 'pet' ? styles.petBadge : styles.livestockBadge
              ]}>
                <Text style={styles.animalTypeText}>
                  {item.animal_type === 'pet' ? 'Pet' : 'Livestock'}
                </Text>
              </View>
            </View>
          </Card.Content>
        </Card>
      </TouchableOpacity>
    );
  };
  
  return (
    <ThemedView style={styles.container}>
      {/* Search bar */}
      <Searchbar
        placeholder="Search animals..."
        onChangeText={setSearchQuery}
        value={searchQuery}
        style={styles.searchBar}
      />
      
      {/* Filter chips */}
      <View style={styles.filterContainer}>
        <Chip 
          selected={filter === 'all'} 
          onPress={() => setFilter('all')}
          style={styles.filterChip}
        >
          All
        </Chip>
        <Chip 
          selected={filter === 'livestock'} 
          onPress={() => setFilter('livestock')}
          style={styles.filterChip}
          icon="cow"
        >
          Livestock
        </Chip>
        <Chip 
          selected={filter === 'pet'} 
          onPress={() => setFilter('pet')}
          style={styles.filterChip}
          icon="paw"
        >
          Pets
        </Chip>
      </View>
      
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0a7ea4" />
          <ThemedText style={styles.loadingText}>Loading your animals...</ThemedText>
        </View>
      ) : animals.length === 0 ? (
        <View style={styles.emptyContainer}>
          <ThemedText type="title">No Animals Yet</ThemedText>
          <ThemedText style={styles.emptyText}>
            Tap the + button to add your first animal
          </ThemedText>
        </View>
      ) : (
        <FlatList
          data={getFilteredAnimals()}
          renderItem={renderAnimalCard}
          keyExtractor={item => item.id.toString()}
          contentContainerStyle={styles.listContent}
        />
      )}
      
      <FAB
        icon="plus"
        style={styles.fab}
        onPress={handleAddAnimal}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchBar: {
    margin: 16,
    elevation: 4,
  },
  filterContainer: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 16,
  },
  filterChip: {
    marginRight: 8,
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
  animalCard: {
    marginBottom: 12,
    elevation: 2,
  },
  animalCardDark: {
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
  animalName: {
    fontSize: 18,
    fontWeight: '600',
  },
  animalSpecies: {
    fontSize: 14,
    opacity: 0.7,
    marginBottom: 6,
  },
  animalTypeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 2,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  petBadge: {
    backgroundColor: '#0a7ea4',
  },
  livestockBadge: {
    backgroundColor: '#8e44ad',
  },
  animalTypeText: {
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