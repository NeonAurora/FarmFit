// app/(main)/(screens)/addPetScreen.jsx
import React, { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { TextInput, Button, Text, Divider, List } from 'react-native-paper';
import * as ExpoImagePicker from 'expo-image-picker';
import { uploadImage } from '@/services/supabase/storage';
import { savePetData } from '@/services/supabase';
import { ThemedView } from '@/components/ThemedView';
import { useColorScheme } from '@/hooks/useColorScheme';
import ImagePicker from '@/components/interfaces/ImagePicker';
import { useAuth } from '@/contexts/AuthContext';
import { router } from 'expo-router';

export default function AddPetScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { user } = useAuth();
  
  // Basic pet information
  const [petName, setPetName] = useState('');
  const [species, setSpecies] = useState('');
  const [age, setAge] = useState('');
  const [sex, setSex] = useState('');
  const [dateAcquired, setDateAcquired] = useState('');
  const [healthStatus, setHealthStatus] = useState('');
  const [petImage, setPetImage] = useState(null);
  
  // Pet-specific fields
  const [petType, setPetType] = useState('');
  const [behavioralNotes, setBehavioralNotes] = useState('');
  const [trainingProgress, setTrainingProgress] = useState('');
  const [dietaryPreferences, setDietaryPreferences] = useState('');
  const [groomingNeeds, setGroomingNeeds] = useState('');
  
  // Expandable section
  const [detailsExpanded, setDetailsExpanded] = useState(false);
  
  // UI states
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
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
  
  const handleSavePet = async () => {
    if (!petName || !species) {
      alert("Please provide at least a name and species for your pet.");
      return;
    }
    
    setIsSaving(true);
    let imageUrl = null;
    
    try {
      // Upload image if present
      if (petImage) {
        setIsUploading(true);
        imageUrl = await uploadImage(petImage);
        setIsUploading(false);
      }
      
      // Prepare pet data
      const petData = {
        user_id: user?.sub, // Auth0 user ID
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
        created_at: new Date().toISOString(),
      };
      
      // Save using database function
      const result = await savePetData(petData);
      
      if (result) {
        alert("Pet successfully added!");
        router.back();
      } else {
        throw new Error('Failed to save pet');
      }
      
    } catch (error) {
      console.error('Error saving pet:', error.message || error);
      alert("Failed to save pet. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };
  
  const resetForm = () => {
    setPetName('');
    setSpecies('');
    setAge('');
    setSex('');
    setDateAcquired('');
    setHealthStatus('');
    setPetImage(null);
    setPetType('');
    setBehavioralNotes('');
    setTrainingProgress('');
    setDietaryPreferences('');
    setGroomingNeeds('');
  };
  
  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>Add New Pet</Text>
        
        {/* Basic Pet Information */}
        <Text style={styles.sectionLabel}>Basic Information</Text>
        
        <TextInput
          label="Pet Name"
          value={petName}
          onChangeText={setPetName}
          style={styles.input}
          mode="flat"
        />
        
        <TextInput
          label="Species/Breed"
          value={species}
          onChangeText={setSpecies}
          style={styles.input}
          mode="flat"
          placeholder="e.g., Golden Retriever, Persian Cat"
        />
        
        <TextInput
          label="Age"
          value={age}
          onChangeText={setAge}
          style={styles.input}
          mode="flat"
          placeholder="e.g., 2 years, 6 months"
        />
        
        <TextInput
          label="Sex"
          value={sex}
          onChangeText={setSex}
          style={styles.input}
          mode="flat"
          placeholder="Male, Female, Unknown"
        />
        
        <TextInput
          label="Date Acquired (YYYY-MM-DD)"
          value={dateAcquired}
          onChangeText={setDateAcquired}
          style={styles.input}
          mode="flat"
          placeholder="2024-01-15"
        />
        
        <TextInput
          label="Health Status"
          value={healthStatus}
          onChangeText={setHealthStatus}
          style={styles.input}
          mode="flat"
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
              mode="flat"
              placeholder="e.g., Companion, Working, Therapy, Guard"
            />
            
            <TextInput
              label="Behavioral Notes"
              value={behavioralNotes}
              onChangeText={setBehavioralNotes}
              style={styles.input}
              mode="flat"
              multiline
              numberOfLines={3}
              placeholder="Describe temperament, habits, special behaviors..."
            />
            
            <TextInput
              label="Training Progress"
              value={trainingProgress}
              onChangeText={setTrainingProgress}
              style={styles.input}
              mode="flat"
              multiline
              numberOfLines={2}
              placeholder="House trained, commands known, training goals..."
            />
            
            <TextInput
              label="Dietary Preferences"
              value={dietaryPreferences}
              onChangeText={setDietaryPreferences}
              style={styles.input}
              mode="flat"
              placeholder="Food brand, allergies, feeding schedule..."
            />
            
            <TextInput
              label="Grooming Needs"
              value={groomingNeeds}
              onChangeText={setGroomingNeeds}
              style={styles.input}
              mode="flat"
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
            onPress={handleSavePet}
            style={styles.saveButton}
            disabled={isSaving || isUploading}
            loading={isSaving}
          >
            Save Pet
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