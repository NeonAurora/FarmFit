// app/(main)/(screens)/petProfileScreen.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { ScrollView, StyleSheet, View, ActivityIndicator, Alert, TouchableOpacity } from 'react-native';
import { Button, Avatar, List, Chip, IconButton } from 'react-native-paper';
import { useRoute, useNavigation } from '@react-navigation/native';
import { router } from 'expo-router';
import { ThemedView } from '@/components/themes/ThemedView';
import { ThemedText } from '@/components/themes/ThemedText';
import { ThemedCard } from '@/components/themes/ThemedCard';
import { useTheme } from '@/contexts/ThemeContext';
import { useActivityIndicatorColors } from '@/hooks/useThemeColor';
import { BrandColors } from '@/constants/Colors';
import { useAuth } from '@/contexts/AuthContext';
import { deleteImage, deletePetData } from '@/services/supabase';
import { usePet } from '@/hooks/usePet';
import { useFocusEffect } from '@react-navigation/native';

export default function PetProfileScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { colors, isDark } = useTheme();
  const activityIndicatorColors = useActivityIndicatorColors();
  const { user } = useAuth();
  
  // Get pet ID from route params
  const { petId } = route.params;
  
  // State for accordion expansion
  const [expandedDetails, setExpandedDetails] = useState(false);
  
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
      'Delete Pet',
      `Are you sure you want to delete ${pet?.name}? This action cannot be undone.`,
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
      <ThemedView style={styles.container}>
        <View style={styles.centerState}>
          <ActivityIndicator 
            size="large" 
            color={activityIndicatorColors.primary}
          />
          <ThemedText style={[styles.loadingText, { color: colors.textSecondary }]}>
            Loading pet profile...
          </ThemedText>
        </View>
      </ThemedView>
    );
  }
  
  // Pet not found
  if (!pet) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.centerState}>
          <IconButton
            icon="alert-circle"
            size={48}
            iconColor={colors.error}
          />
          <ThemedText type="subtitle" style={styles.centerTitle}>
            Pet Not Found
          </ThemedText>
          <ThemedText style={[styles.centerMessage, { color: colors.textSecondary }]}>
            This pet may have been deleted or moved
          </ThemedText>
          <Button 
            mode="contained" 
            onPress={() => router.back()}
            style={styles.centerAction}
          >
            Go Back
          </Button>
        </View>
      </ThemedView>
    );
  }
  
  return (
    <ThemedView style={styles.container}>
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Pet Header Card */}
        <ThemedCard variant="elevated" style={styles.headerCard}>
          <View style={styles.headerContent}>
            {/* Pet Image */}
            <View style={styles.imageContainer}>
              {pet.image_url ? (
                <TouchableOpacity 
                  style={styles.imageWrapper}
                  activeOpacity={0.9}
                >
                  <Avatar.Image 
                    size={120} 
                    source={{ uri: pet.image_url }}
                    style={styles.petImage}
                  />
                </TouchableOpacity>
              ) : (
                <View style={[styles.imagePlaceholder, { backgroundColor: colors.surface }]}>
                  <Avatar.Icon 
                    size={80} 
                    icon="account-circle"
                    color={colors.textSecondary}
                    style={{ backgroundColor: 'transparent' }}
                  />
                </View>
              )}
            </View>
            
            {/* Pet Info */}
            <View style={styles.petHeaderInfo}>
              <ThemedText type="title" style={styles.petName}>
                {pet.name}
              </ThemedText>
              <ThemedText style={[styles.petSpecies, { color: colors.textSecondary }]}>
                {pet.species}
              </ThemedText>
              
              {/* Tags Row */}
              <View style={styles.tagsRow}>
                {pet.age && (
                  <Chip 
                    compact
                    style={[styles.infoChip, { backgroundColor: colors.surface }]}
                    textStyle={[styles.chipText, { color: colors.textSecondary }]}
                  >
                    {pet.age}
                  </Chip>
                )}
                
                {pet.sex && (
                  <Chip 
                    compact
                    style={[styles.infoChip, { backgroundColor: colors.surface }]}
                    textStyle={[styles.chipText, { color: colors.textSecondary }]}
                  >
                    {pet.sex}
                  </Chip>
                )}
                
                {pet.pet_type && (
                  <Chip 
                    compact
                    style={[
                      styles.typeChip, 
                      { backgroundColor: BrandColors.primary + '15' }
                    ]}
                    textStyle={[styles.chipText, { color: BrandColors.primary }]}
                  >
                    {pet.pet_type}
                  </Chip>
                )}
              </View>
            </View>
          </View>
        </ThemedCard>
        
        {/* Basic Information Card */}
        <ThemedCard variant="elevated" style={styles.infoCard}>
          <View style={styles.cardContent}>
            <ThemedText type="subtitle" style={styles.sectionTitle}>
              Basic Information
            </ThemedText>
            
            <View style={styles.infoGrid}>
              <View style={styles.infoItem}>
                <ThemedText style={styles.infoLabel}>Date Acquired</ThemedText>
                <ThemedText style={[styles.infoValue, { color: colors.textSecondary }]}>
                  {pet.date_acquired || 'Not specified'}
                </ThemedText>
              </View>
              
              <View style={styles.infoItem}>
                <ThemedText style={styles.infoLabel}>Health Status</ThemedText>
                <ThemedText style={[styles.infoValue, { color: colors.textSecondary }]}>
                  {pet.health_status || 'Not specified'}
                </ThemedText>
              </View>
            </View>
          </View>
        </ThemedCard>
        
        {/* Additional Details Card */}
        <ThemedCard variant="elevated" style={styles.infoCard}>
          <List.Accordion
            title="Additional Details"
            expanded={expandedDetails}
            onPress={() => setExpandedDetails(!expandedDetails)}
            style={styles.accordion}
            titleStyle={[styles.accordionTitle, { color: colors.text }]}
            left={props => <List.Icon {...props} icon="chevron-down" />}
          >
            <View style={styles.accordionContent}>
              {pet.behavioral_notes && (
                <View style={styles.detailItem}>
                  <ThemedText style={styles.detailLabel}>Behavioral Notes</ThemedText>
                  <ThemedText style={[styles.detailValue, { color: colors.textSecondary }]}>
                    {pet.behavioral_notes}
                  </ThemedText>
                </View>
              )}
              
              {pet.training_progress && (
                <View style={styles.detailItem}>
                  <ThemedText style={styles.detailLabel}>Training Progress</ThemedText>
                  <ThemedText style={[styles.detailValue, { color: colors.textSecondary }]}>
                    {pet.training_progress}
                  </ThemedText>
                </View>
              )}
              
              {pet.dietary_preferences && (
                <View style={styles.detailItem}>
                  <ThemedText style={styles.detailLabel}>Dietary Preferences</ThemedText>
                  <ThemedText style={[styles.detailValue, { color: colors.textSecondary }]}>
                    {pet.dietary_preferences}
                  </ThemedText>
                </View>
              )}
              
              {pet.grooming_needs && (
                <View style={styles.detailItem}>
                  <ThemedText style={styles.detailLabel}>Grooming Needs</ThemedText>
                  <ThemedText style={[styles.detailValue, { color: colors.textSecondary }]}>
                    {pet.grooming_needs}
                  </ThemedText>
                </View>
              )}
              
              {!pet.behavioral_notes && !pet.training_progress && 
               !pet.dietary_preferences && !pet.grooming_needs && (
                <ThemedText style={[styles.noDetails, { color: colors.textSecondary }]}>
                  No additional details available
                </ThemedText>
              )}
            </View>
          </List.Accordion>
        </ThemedCard>
        
        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <Button 
            mode="contained" 
            onPress={handleEditPet} 
            style={styles.editButton}
            labelStyle={styles.buttonLabel}
            icon="pencil"
          >
            Edit
          </Button>
          
          <Button 
            mode="outlined" 
            onPress={handleDeletePet} 
            style={styles.deleteButton}
            labelStyle={[styles.buttonLabel, { color: colors.error }]}
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
    padding: 20,
    paddingBottom: 40,
  },
  centerState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  centerTitle: {
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  centerMessage: {
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  centerAction: {
    paddingHorizontal: 24,
  },
  loadingText: {
    textAlign: 'center',
    marginTop: 16,
  },
  headerCard: {
    marginBottom: 20,
    elevation: 2,
  },
  headerContent: {
    padding: 24,
    alignItems: 'center',
  },
  imageContainer: {
    marginBottom: 20,
  },
  imageWrapper: {
    borderRadius: 60,
    elevation: 2,
  },
  petImage: {
    elevation: 2,
  },
  imagePlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 1,
  },
  petHeaderInfo: {
    alignItems: 'center',
  },
  petName: {
    textAlign: 'center',
    marginBottom: 4,
  },
  petSpecies: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 16,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
  },
  infoChip: {
    height: 28,
  },
  typeChip: {
    height: 28,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '500',
  },
  infoCard: {
    marginBottom: 20,
    elevation: 1,
  },
  cardContent: {
    padding: 20,
  },
  sectionTitle: {
    marginBottom: 16,
    color: '#666',
  },
  infoGrid: {
    gap: 16,
  },
  infoItem: {
    gap: 4,
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 14,
    lineHeight: 20,
  },
  accordion: {
    backgroundColor: 'transparent',
    borderRadius: 0,
  },
  accordionTitle: {
    fontWeight: '500',
    fontSize: 18,
  },
  accordionContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
  },
  detailItem: {
    marginBottom: 16,
    gap: 4,
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 14,
    lineHeight: 20,
  },
  noDetails: {
    fontSize: 14,
    textAlign: 'center',
    fontStyle: 'italic',
    paddingVertical: 16,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 8,
  },
  editButton: {
    flex: 1,
    paddingVertical: 4,
  },
  deleteButton: {
    flex: 1,
    paddingVertical: 4,
  },
  buttonLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
});