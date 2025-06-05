// app/(main)/(screens)/editPetScreen.jsx
import React, { useState, useEffect } from 'react';
import { ScrollView, StyleSheet, View, ActivityIndicator, Alert } from 'react-native';
import { TextInput, Button, Text, Divider, List } from 'react-native-paper';
import * as ExpoImagePicker from 'expo-image-picker';
import { uploadImage, deleteImage } from '@/services/supabase/storage';
import { supabase } from '@/services/supabase/config';
import { ThemedView } from '@/components/ThemedView';
import { useColorScheme } from '@/hooks/useColorScheme';
import ImagePicker from '@/components/interfaces/ImagePicker';
import { useAuth } from '@/contexts/AuthContext';
import { usePet } from '@/hooks/usePet';
import { useLocalSearchParams, router } from 'expo-router';

export default function EditPetScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { user } = useAuth();
  const { petId } = useLocalSearchParams();
  
  // Use pet hook to get current data
  const { pet, loading: petLoading, error: petError } = usePet(petId);
  
  // Form state
  const [petName, setPetName] = useState('');
  const [species, setSpecies] = useState('');
  const [age, setAge] = useState('');
  const [sex, setSex] = useState('');
  const [dateAcquired, setDateAcquired] = useState('');
  const [healthStatus, setHealthStatus] = useState('');
  const [petImage, setPetImage] = useState(null);
  
  // Expandable section
  const [detailsExpanded, setDetailsExpanded] = useState(true);
  
  // Pet-specific fields
  const [petType, setPetType] = useState('');
  const [behavioralNotes, setBehavioralNotes] = useState('');
  const [trainingProgress, setTrainingProgress] = useState('');
  const [dietaryPreferences, setDietaryPreferences] = useState('');
  const [groomingNeeds, setGroomingNeeds] = useState('');
  
  // UI states
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Populate form with pet data once loaded
  useEffect(() => {
    if (pet) {
      setPetName(pet.name || '');
      setSpecies(pet.species || '');
      setAge(pet.age || '');
      setSex(pet.sex || '');
      setDateAcquired(pet.date_acquired || '');
      setHealthStatus(pet.health_status || '');
      setPetImage(pet.image_url || null);
      
      // Pet fields
      setPetType(pet.pet_type || '');
      setBehavioralNotes(pet.behavioral_notes || '');
      setTrainingProgress(pet.training_progress || '');
      setDietaryPreferences(pet.dietary_preferences || '');
      setGroomingNeeds(pet.grooming_needs || '');
    }
  }, [pet]);
  
  // Handle errors from pet hook
  useEffect(() => {
    if (petError) {
      Alert.alert("Error", "Could not load pet data. Please try again.");
      router.back();
    }
  }, [petError]);
  
  const handlePickImage = async () => {
    // Request permissions
    const { status } = await ExpoImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      alert("Please allow access to your photos.");
      return;
    }
  
    // Launch picker with updated API
    const result = await ExpoImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'], // ✅ Fixed deprecation warning
      quality: 0.7,
      allowsEditing: true,
    });
  
    // Handle selection
    if (!result.canceled && result.assets?.length > 0) {
      setPetImage(result.assets[0].uri);
    }
  };
  
  const handleUpdatePet = async () => {
    if (!petName || !species) {
      alert("Please provide at least a name and species for your pet.");
      return;
    }
    
    setIsSaving(true);
    let imageUrl = pet.image_url; // Default to current image URL
    
    try {
      // If image changed, upload new one and delete old one
      if (petImage && petImage !== pet.image_url) {
        setIsUploading(true);
        // Upload new image
        imageUrl = await uploadImage(petImage);
        
        // Delete old image if it exists
        if (pet.image_url) {
          await deleteImage(pet.image_url);
        }
        
        setIsUploading(false);
      }
      
      // Prepare pet data
      const petData = {
        name: petName,
        species: species,
        age: age,
        sex: sex,
        date_acquired: dateAcquired,
        health_status: healthStatus,
        image_url: imageUrl,
        pet_type: petType,
        behavioral_notes: behavioralNotes,
        training_progress: trainingProgress,
        dietary_preferences: dietaryPreferences,
        grooming_needs: groomingNeeds,
        updated_at: new Date().toISOString(),
      };
      
      // Update in Supabase
      const { data, error } = await supabase
        .from('pets') // ✅ Changed to pets table
        .update(petData)
        .eq('id', petId)
        .eq('user_id', user.sub)
        .select();
      
      if (error) {
        console.error('Detailed Supabase error:', JSON.stringify(error));
        throw error;
      }
      
      Alert.alert("Success", "Pet successfully updated!");
      // Navigate back to pet profile
      router.push({
        pathname: '/petProfileScreen',
        params: { petId }
      });
      
    } catch (error) {
      console.error('Error updating pet:', error.message || error);
      Alert.alert("Error", "Failed to update pet. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };
  
  if (petLoading) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0a7ea4" />
        <Text style={styles.loadingText}>Loading pet data...</Text>
      </ThemedView>
    );
  }
  
  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>Edit Pet</Text>
        
        {/* Basic Pet Information */}
        <Text style={styles.sectionLabel}>Basic Information</Text>
        
        <TextInput
          label="Pet Name"
          value={petName}
          onChangeText={setPetName}
          style={styles.input}
          mode="outlined"
        />
        
        <TextInput
          label="Species/Breed"
          value={species}
          onChangeText={setSpecies}
          style={styles.input}
          mode="outlined"
          placeholder="e.g., Golden Retriever, Persian Cat"
        />
        
        <TextInput
          label="Age"
          value={age}
          onChangeText={setAge}
          style={styles.input}
          mode="outlined"
          placeholder="e.g., 2 years, 6 months"
        />
        
        <TextInput
          label="Sex"
          value={sex}
          onChangeText={setSex}
          style={styles.input}
          mode="outlined"
          placeholder="Male, Female, Unknown"
        />
        
        <TextInput
          label="Date Acquired (YYYY-MM-DD)"
          value={dateAcquired}
          onChangeText={setDateAcquired}
          style={styles.input}
          mode="outlined"
          placeholder="2024-01-15"
        />
        
        <TextInput
          label="Health Status"
          value={healthStatus}
          onChangeText={setHealthStatus}
          style={styles.input}
          mode="outlined"
          placeholder="Healthy, Under treatment, etc."
        />
        
        <Text style={styles.imageLabel}>Pet Photo</Text>
        <ImagePicker
          image={petImage}
          onPickImage={handlePickImage}
          isUploading={isUploading}
        />
        
        <Divider style={styles.divider} />
        
        {/* Pet Details Section */}
        <List.Accordion
          title="Additional Details"
          expanded={detailsExpanded}
          onPress={() => setDetailsExpanded(!detailsExpanded)}
          style={styles.accordion}
          titleStyle={styles.accordionTitle}
          left={props => <List.Icon {...props} icon="paw" />}
        >
          <View style={styles.accordionContent}>
            <TextInput
              label="Pet Type"
              value={petType}
              onChangeText={setPetType}
              style={styles.input}
              mode="outlined"
              placeholder="e.g., Companion, Working, Therapy, Guard"
            />
            
            <TextInput
              label="Behavioral Notes"
              value={behavioralNotes}
              onChangeText={setBehavioralNotes}
              style={styles.input}
              mode="outlined"
              multiline
              numberOfLines={3}
              placeholder="Describe temperament, habits, special behaviors..."
            />
            
            <TextInput
              label="Training Progress"
              value={trainingProgress}
              onChangeText={setTrainingProgress}
              style={styles.input}
              mode="outlined"
              multiline
              numberOfLines={2}
              placeholder="House trained, commands known, training goals..."
            />
            
            <TextInput
              label="Dietary Preferences"
              value={dietaryPreferences}
              onChangeText={setDietaryPreferences}
              style={styles.input}
              mode="outlined"
              placeholder="Food brand, allergies, feeding schedule..."
            />
            
            <TextInput
              label="Grooming Needs"
              value={groomingNeeds}
              onChangeText={setGroomingNeeds}
              style={styles.input}
              mode="outlined"
              placeholder="Brushing frequency, nail trimming, bathing..."
            />
          </View>
        </List.Accordion>
        
        <View style={styles.buttonContainer}>
          <Button 
            mode="outlined" 
            onPress={() => router.back()}
            style={styles.cancelButton}
            labelStyle={styles.cancelButtonText}
          >
            Cancel
          </Button>
          
          <Button 
            mode="contained" 
            onPress={handleUpdatePet}
            style={styles.saveButton}
            disabled={isSaving || isUploading}
            loading={isSaving}
          >
            Update Pet
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
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 20,
    textAlign: 'center',
  },
  sectionLabel: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    marginTop: 8,
  },
  input: {
    marginBottom: 16,
    backgroundColor: "transparent",
  },
  divider: {
    marginVertical: 20,
    height: 1,
  },
  imageLabel: {
    fontSize: 16,
    marginBottom: 8,
    fontWeight: '500',
  },
  accordion: {
    marginBottom: 8,
    borderRadius: 8,
    overflow: 'hidden',
  },
  accordionTitle: {
    fontWeight: '500',
  },
  accordionContent: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
  },
  saveButton: {
    flex: 1,
    paddingVertical: 8,
    marginLeft: 8,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 8,
    marginRight: 8,
    borderColor: '#999',
  },
  cancelButtonText: {
    color: '#999',
  },
});