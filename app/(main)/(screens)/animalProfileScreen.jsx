// screens/AnimalProfileScreen.jsx
import React, { useState, useEffect } from 'react';
import { ScrollView, StyleSheet, View, ActivityIndicator, Alert } from 'react-native';
import { Text, Button, Divider, Card, Avatar, List } from 'react-native-paper';
import { useRoute, useNavigation } from '@react-navigation/native';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { useAuth } from '@/contexts/AuthContext';
import { useColorScheme } from '@/hooks/useColorScheme';
import { deleteImage } from '@/services/supabase/storage';
import { supabase } from '@/services/supabase/config';
import { useAnimal } from '@/hooks/useAnimal';

export default function AnimalProfileScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { user } = useAuth();
  
  // Get animal ID from route params
  const { animalId } = route.params;
  
  // State for accordion expansion
  const [expandedLivestock, setExpandedLivestock] = useState(false);
  const [expandedPet, setExpandedPet] = useState(false);
  
  // Use the custom hook for real-time animal data
  const { animal, loading, error } = useAnimal(animalId);
  
  // Handle error - navigate back if animal was deleted or not found
  useEffect(() => {
    if (error) {
      Alert.alert('Error', error);
      navigation.goBack();
    }
  }, [error, navigation]);
  
  const handleEditAnimal = () => {
    navigation.navigate('EditAnimal', { animalId });
  };
  
  const handleDeleteAnimal = async () => {
    Alert.alert(
      'Confirm Deletion',
      `Are you sure you want to delete ${animal?.name}?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              // Delete image from storage if exists
              if (animal.image_url) {
                await deleteImage(animal.image_url);
              }
              
              // Delete record from database
              const { error } = await supabase
                .from('animals')
                .delete()
                .eq('id', animalId)
                .eq('user_id', user.sub);
              
              if (error) throw error;
              
              Alert.alert('Success', 'Animal deleted successfully');
              navigation.goBack();
            } catch (error) {
              console.error('Error deleting animal:', error);
              Alert.alert('Error', 'Failed to delete animal');
            }
          },
        },
      ]
    );
  };
  
  // Loading state
  if (loading) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0a7ea4" />
        <ThemedText style={styles.loadingText}>Loading animal profile...</ThemedText>
      </ThemedView>
    );
  }
  
  // Animal not found
  if (!animal) {
    return (
      <ThemedView style={styles.errorContainer}>
        <ThemedText type="title">Animal Not Found</ThemedText>
        <Button mode="contained" onPress={() => navigation.goBack()} style={styles.button}>
          Go Back
        </Button>
      </ThemedView>
    );
  }
  
  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header with image and name */}
        <Card style={styles.headerCard}>
          {animal.image_url ? (
            <Card.Cover source={{ uri: animal.image_url }} style={styles.animalImage} />
          ) : (
            <View style={[styles.imagePlaceholder, isDark && styles.imagePlaceholderDark]}>
              <Avatar.Icon 
                size={80} 
                icon={animal.animal_type === 'pet' ? 'paw' : 'cow'} 
                color={isDark ? '#eee' : '#666'} 
                style={styles.placeholderIcon}
              />
            </View>
          )}
          
          <Card.Content style={styles.headerContent}>
            <ThemedText type="title" style={styles.animalName}>{animal.name}</ThemedText>
            <ThemedText style={styles.animalSpecies}>{animal.species}</ThemedText>
            <View style={styles.animalTypeBadge}>
              <ThemedText style={styles.animalTypeText}>
                {animal.animal_type === 'pet' ? 'Pet' : 'Livestock'}
              </ThemedText>
            </View>
          </Card.Content>
        </Card>
        
        {/* Basic Information */}
        <Card style={styles.infoCard}>
          <Card.Title title="Basic Information" />
          <Card.Content>
            <View style={styles.infoRow}>
              <ThemedText style={styles.infoLabel}>Age:</ThemedText>
              <ThemedText style={styles.infoValue}>{animal.age || 'Not specified'}</ThemedText>
            </View>
            
            <View style={styles.infoRow}>
              <ThemedText style={styles.infoLabel}>Sex:</ThemedText>
              <ThemedText style={styles.infoValue}>{animal.sex || 'Not specified'}</ThemedText>
            </View>
            
            <View style={styles.infoRow}>
              <ThemedText style={styles.infoLabel}>Date Acquired:</ThemedText>
              <ThemedText style={styles.infoValue}>{animal.date_acquired || 'Not specified'}</ThemedText>
            </View>
            
            <View style={styles.infoRow}>
              <ThemedText style={styles.infoLabel}>Health Status:</ThemedText>
              <ThemedText style={styles.infoValue}>{animal.health_status || 'Not specified'}</ThemedText>
            </View>
          </Card.Content>
        </Card>
        
        {/* Livestock Specific Information */}
        {animal.animal_type === 'livestock' && (
          <List.Accordion
            title="Livestock Details"
            expanded={expandedLivestock}
            onPress={() => setExpandedLivestock(!expandedLivestock)}
            style={styles.accordion}
            titleStyle={styles.accordionTitle}
            left={props => <List.Icon {...props} icon="cow" />}
          >
            <Card style={styles.accordionCard}>
              <Card.Content>
                <View style={styles.infoRow}>
                  <ThemedText style={styles.infoLabel}>Production Purpose:</ThemedText>
                  <ThemedText style={styles.infoValue}>{animal.production_purpose || 'Not specified'}</ThemedText>
                </View>
                
                <View style={styles.infoRow}>
                  <ThemedText style={styles.infoLabel}>ID/Tag Number:</ThemedText>
                  <ThemedText style={styles.infoValue}>{animal.identification_number || 'Not specified'}</ThemedText>
                </View>
                
                <View style={styles.infoRow}>
                  <ThemedText style={styles.infoLabel}>Purchase Price:</ThemedText>
                  <ThemedText style={styles.infoValue}>
                    {animal.purchase_price ? `$${animal.purchase_price}` : 'Not specified'}
                  </ThemedText>
                </View>
                
                <View style={styles.infoRow}>
                  <ThemedText style={styles.infoLabel}>Weight:</ThemedText>
                  <ThemedText style={styles.infoValue}>
                    {animal.weight ? `${animal.weight} kg` : 'Not specified'}
                  </ThemedText>
                </View>
                
                <View style={styles.infoSection}>
                  <ThemedText style={styles.infoLabel}>Feed Requirements:</ThemedText>
                  <ThemedText style={styles.infoValue}>
                    {animal.feed_requirements || 'Not specified'}
                  </ThemedText>
                </View>
              </Card.Content>
            </Card>
          </List.Accordion>
        )}
        
        {/* Pet Specific Information */}
        {animal.animal_type === 'pet' && (
          <List.Accordion
            title="Pet Details"
            expanded={expandedPet}
            onPress={() => setExpandedPet(!expandedPet)}
            style={styles.accordion}
            titleStyle={styles.accordionTitle}
            left={props => <List.Icon {...props} icon="paw" />}
          >
            <Card style={styles.accordionCard}>
              <Card.Content>
                <View style={styles.infoRow}>
                  <ThemedText style={styles.infoLabel}>Pet Type:</ThemedText>
                  <ThemedText style={styles.infoValue}>{animal.pet_type || 'Not specified'}</ThemedText>
                </View>
                
                <View style={styles.infoSection}>
                  <ThemedText style={styles.infoLabel}>Behavioral Notes:</ThemedText>
                  <ThemedText style={styles.infoValue}>
                    {animal.behavioral_notes || 'Not specified'}
                  </ThemedText>
                </View>
                
                <View style={styles.infoSection}>
                  <ThemedText style={styles.infoLabel}>Training Progress:</ThemedText>
                  <ThemedText style={styles.infoValue}>
                    {animal.training_progress || 'Not specified'}
                  </ThemedText>
                </View>
                
                <View style={styles.infoSection}>
                  <ThemedText style={styles.infoLabel}>Dietary Preferences:</ThemedText>
                  <ThemedText style={styles.infoValue}>
                    {animal.dietary_preferences || 'Not specified'}
                  </ThemedText>
                </View>
                
                <View style={styles.infoSection}>
                  <ThemedText style={styles.infoLabel}>Grooming Needs:</ThemedText>
                  <ThemedText style={styles.infoValue}>
                    {animal.grooming_needs || 'Not specified'}
                  </ThemedText>
                </View>
              </Card.Content>
            </Card>
          </List.Accordion>
        )}
        
        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <Button 
            mode="contained" 
            onPress={handleEditAnimal} 
            style={[styles.button, styles.editButton]}
            icon="pencil"
          >
            Edit
          </Button>
          
          <Button 
            mode="contained" 
            onPress={handleDeleteAnimal} 
            style={[styles.button, styles.deleteButton]}
            icon="delete"
          >
            Delete
          </Button>
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  headerCard: {
    marginBottom: 16,
    overflow: 'hidden',
  },
  animalImage: {
    height: 200,
  },
  imagePlaceholder: {
    height: 200,
    backgroundColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imagePlaceholderDark: {
    backgroundColor: '#333',
  },
  placeholderIcon: {
    backgroundColor: 'transparent',
  },
  headerContent: {
    padding: 16,
  },
  animalName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  animalSpecies: {
    fontSize: 16,
    opacity: 0.7,
    marginBottom: 10,
  },
  animalTypeBadge: {
    backgroundColor: '#0a7ea4',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
    alignSelf: 'flex-start',
  },
  animalTypeText: {
    color: 'white',
    fontWeight: '500',
  },
  infoCard: {
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  infoSection: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  infoLabel: {
    fontWeight: '500',
    flex: 1,
  },
  infoValue: {
    flex: 2,
  },
  accordion: {
    marginBottom: 8,
    borderRadius: 8,
    overflow: 'hidden',
  },
  accordionTitle: {
    fontWeight: '500',
  },
  accordionCard: {
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    marginBottom: 16,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  button: {
    flex: 1,
    marginHorizontal: 8,
  },
  editButton: {
    backgroundColor: '#2E86DE',
  },
  deleteButton: {
    backgroundColor: '#E74C3C',
  },
});