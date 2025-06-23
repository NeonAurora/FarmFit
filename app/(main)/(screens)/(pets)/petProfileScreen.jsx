// app/(main)/(screens)/petProfileScreen.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { ScrollView, StyleSheet, View, ActivityIndicator, Alert } from 'react-native';
import { Text, Button, Divider, Card, Avatar, List } from 'react-native-paper';
import { useRoute, useNavigation } from '@react-navigation/native';
import { router } from 'expo-router';
import { ThemedView } from '@/components/themes/ThemedView';
import { ThemedText } from '@/components/themes/ThemedText';
import { useAuth } from '@/contexts/AuthContext';
import { useColorScheme } from '@/hooks/useColorScheme.native';
import { deleteImage } from '@/services/supabase';
import { deletePetData } from '@/services/supabase';
import { usePet } from '@/hooks/usePet';
import { useFocusEffect } from '@react-navigation/native';

export default function PetProfileScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { user } = useAuth();
  
  // Get pet ID from route params
  const { petId } = route.params;
  
  // State for accordion expansion
  const [expandedDetails, setExpandedDetails] = useState(true);
  
  // Use the custom hook for real-time pet data
  const { pet, loading, error, refetch } = usePet(petId);

  // Refetch data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch])
  );
  
  // Handle error - navigate back if pet was deleted or not found
  useEffect(() => {
    if (error) {
      Alert.alert('Error', error);
      router.back();
    }
  }, [error, navigation]);
  
  const handleEditPet = () => {
    router.push({
      pathname: '/editPetScreen',
      params: { petId: petId }
    });
  };
  
  const handleDeletePet = async () => {
    Alert.alert(
      'Confirm Deletion',
      `Are you sure you want to delete ${pet?.name}?`,
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
              if (pet.image_url) {
                await deleteImage(pet.image_url);
              }
              
              // Delete record using database function
              const result = await deletePetData(petId, user.sub);
              
              if (result) {
                Alert.alert('Success', 'Pet deleted successfully');
                router.push('/petListScreen');
              } else {
                throw new Error('Failed to delete pet');
              }
            } catch (error) {
              console.error('Error deleting pet:', error);
              Alert.alert('Error', 'Failed to delete pet');
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
        <ThemedText style={styles.loadingText}>Loading pet profile...</ThemedText>
      </ThemedView>
    );
  }
  
  // Pet not found
  if (!pet) {
    return (
      <ThemedView style={styles.errorContainer}>
        <ThemedText type="title">Pet Not Found</ThemedText>
        <Button mode="contained" onPress={() => router.back()} style={styles.button}>
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
          {pet.image_url ? (
            <Card.Cover source={{ uri: pet.image_url }} style={styles.petImage} />
          ) : (
            <View style={[styles.imagePlaceholder, isDark && styles.imagePlaceholderDark]}>
              <Avatar.Icon 
                size={80} 
                icon="paw"
                color={isDark ? '#eee' : '#666'} 
                style={styles.placeholderIcon}
              />
            </View>
          )}
          
          <Card.Content style={styles.headerContent}>
            <ThemedText type="title" style={styles.petName}>{pet.name}</ThemedText>
            <ThemedText style={styles.petSpecies}>{pet.species}</ThemedText>
            {/* Show pet type if available */}
            {pet.pet_type && (
              <View style={styles.petTypeBadge}>
                <ThemedText style={styles.petTypeText}>
                  {pet.pet_type}
                </ThemedText>
              </View>
            )}
          </Card.Content>
        </Card>
        
        {/* Basic Information */}
        <Card style={styles.infoCard}>
          <Card.Title title="Basic Information" />
          <Card.Content>
            <View style={styles.infoRow}>
              <ThemedText style={styles.infoLabel}>Age:</ThemedText>
              <ThemedText style={styles.infoValue}>{pet.age || 'Not specified'}</ThemedText>
            </View>
            
            <View style={styles.infoRow}>
              <ThemedText style={styles.infoLabel}>Sex:</ThemedText>
              <ThemedText style={styles.infoValue}>{pet.sex || 'Not specified'}</ThemedText>
            </View>
            
            <View style={styles.infoRow}>
              <ThemedText style={styles.infoLabel}>Date Acquired:</ThemedText>
              <ThemedText style={styles.infoValue}>{pet.date_acquired || 'Not specified'}</ThemedText>
            </View>
            
            <View style={styles.infoRow}>
              <ThemedText style={styles.infoLabel}>Health Status:</ThemedText>
              <ThemedText style={styles.infoValue}>{pet.health_status || 'Not specified'}</ThemedText>
            </View>
          </Card.Content>
        </Card>
        
        {/* Pet Details Section */}
        <List.Accordion
          title="Additional Details"
          expanded={expandedDetails}
          onPress={() => setExpandedDetails(!expandedDetails)}
          style={styles.accordion}
          titleStyle={styles.accordionTitle}
          left={props => <List.Icon {...props} icon="paw" />}
        >
          <Card style={styles.accordionCard}>
            <Card.Content>
              <View style={styles.infoSection}>
                <ThemedText style={styles.infoLabel}>Behavioral Notes:</ThemedText>
                <ThemedText style={styles.infoValue}>
                  {pet.behavioral_notes || 'Not specified'}
                </ThemedText>
              </View>
              
              <View style={styles.infoSection}>
                <ThemedText style={styles.infoLabel}>Training Progress:</ThemedText>
                <ThemedText style={styles.infoValue}>
                  {pet.training_progress || 'Not specified'}
                </ThemedText>
              </View>
              
              <View style={styles.infoSection}>
                <ThemedText style={styles.infoLabel}>Dietary Preferences:</ThemedText>
                <ThemedText style={styles.infoValue}>
                  {pet.dietary_preferences || 'Not specified'}
                </ThemedText>
              </View>
              
              <View style={styles.infoSection}>
                <ThemedText style={styles.infoLabel}>Grooming Needs:</ThemedText>
                <ThemedText style={styles.infoValue}>
                  {pet.grooming_needs || 'Not specified'}
                </ThemedText>
              </View>
            </Card.Content>
          </Card>
        </List.Accordion>
        
        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <Button 
            mode="contained" 
            onPress={handleEditPet} 
            style={[styles.button, styles.editButton]}
            icon="pencil"
          >
            Edit
          </Button>
          
          <Button 
            mode="contained" 
            onPress={handleDeletePet} 
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
  petImage: {
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
  petName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  petSpecies: {
    fontSize: 16,
    opacity: 0.7,
    marginBottom: 10,
  },
  petTypeBadge: {
    backgroundColor: '#0a7ea4',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
    alignSelf: 'flex-start',
  },
  petTypeText: {
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