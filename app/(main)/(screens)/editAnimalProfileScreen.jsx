// app/(main)/(screens)/editAnimalScreen.jsx
import React, { useState, useEffect } from 'react';
import { ScrollView, StyleSheet, View, ActivityIndicator, Alert } from 'react-native';
import { TextInput, Button, Text, Divider, RadioButton, List } from 'react-native-paper';
import * as ExpoImagePicker from 'expo-image-picker';
import { uploadImage, deleteImage } from '@/services/supabase/storage';
import { supabase } from '@/services/supabase/config';
import { ThemedView } from '@/components/ThemedView';
import { useColorScheme } from '@/hooks/useColorScheme';
import ImagePicker from '@/components/interfaces/ImagePicker';
import { useAuth } from '@/contexts/AuthContext';
import { useAnimal } from '@/hooks/useAnimal';
import { useLocalSearchParams, router } from 'expo-router';

export default function EditAnimalScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { user } = useAuth();
  const { animalId } = useLocalSearchParams();
  
  // Use animal hook to get current data
  const { animal, loading: animalLoading, error: animalError } = useAnimal(animalId);
  
  // Form state
  const [animalName, setAnimalName] = useState('');
  const [species, setSpecies] = useState('');
  const [age, setAge] = useState('');
  const [sex, setSex] = useState('');
  const [dateAcquired, setDateAcquired] = useState('');
  const [healthStatus, setHealthStatus] = useState('');
  const [animalImage, setAnimalImage] = useState(null);
  const [animalType, setAnimalType] = useState('livestock'); // 'livestock' or 'pet'
  
  // Expandable sections
  const [livestockExpanded, setLivestockExpanded] = useState(false);
  const [petExpanded, setPetExpanded] = useState(false);
  
  // Livestock-specific fields
  const [productionPurpose, setProductionPurpose] = useState('');
  const [identificationNumber, setIdentificationNumber] = useState('');
  const [purchasePrice, setPurchasePrice] = useState('');
  const [weight, setWeight] = useState('');
  const [feedRequirements, setFeedRequirements] = useState('');
  
  // Pet-specific fields
  const [petType, setPetType] = useState('');
  const [behavioralNotes, setBehavioralNotes] = useState('');
  const [trainingProgress, setTrainingProgress] = useState('');
  const [dietaryPreferences, setDietaryPreferences] = useState('');
  const [groomingNeeds, setGroomingNeeds] = useState('');
  
  // UI states
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Populate form with animal data once loaded
  useEffect(() => {
    if (animal) {
      setAnimalName(animal.name || '');
      setSpecies(animal.species || '');
      setAge(animal.age || '');
      setSex(animal.sex || '');
      setDateAcquired(animal.date_acquired || '');
      setHealthStatus(animal.health_status || '');
      setAnimalImage(animal.image_url || null);
      setAnimalType(animal.animal_type || 'livestock');
      
      // Expand appropriate section based on animal type
      if (animal.animal_type === 'livestock') {
        setLivestockExpanded(true);
      } else if (animal.animal_type === 'pet') {
        setPetExpanded(true);
      }
      
      // Livestock fields
      setProductionPurpose(animal.production_purpose || '');
      setIdentificationNumber(animal.identification_number || '');
      setPurchasePrice(animal.purchase_price ? String(animal.purchase_price) : '');
      setWeight(animal.weight ? String(animal.weight) : '');
      setFeedRequirements(animal.feed_requirements || '');
      
      // Pet fields
      setPetType(animal.pet_type || '');
      setBehavioralNotes(animal.behavioral_notes || '');
      setTrainingProgress(animal.training_progress || '');
      setDietaryPreferences(animal.dietary_preferences || '');
      setGroomingNeeds(animal.grooming_needs || '');
    }
  }, [animal]);
  
  // Handle errors from animal hook
  useEffect(() => {
    if (animalError) {
      Alert.alert("Error", "Could not load animal data. Please try again.");
      router.back();
    }
  }, [animalError]);
  
  const handlePickImage = async () => {
    // Request permissions
    const { status } = await ExpoImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      alert("Please allow access to your photos.");
      return;
    }
  
    // Launch picker
    const result = await ExpoImagePicker.launchImageLibraryAsync({
      mediaTypes: ExpoImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
    });
  
    // Handle selection
    if (!result.canceled && result.assets?.length > 0) {
      setAnimalImage(result.assets[0].uri);
    }
  };
  
  const handleUpdateAnimal = async () => {
    if (!animalName || !species) {
      alert("Please provide at least a name and species for your animal.");
      return;
    }
    
    setIsSaving(true);
    let imageUrl = animal.image_url; // Default to current image URL
    
    try {
      // If image changed, upload new one and delete old one
      if (animalImage && animalImage !== animal.image_url) {
        setIsUploading(true);
        // Upload new image
        imageUrl = await uploadImage(animalImage);
        
        // Delete old image if it exists
        if (animal.image_url) {
          await deleteImage(animal.image_url);
        }
        
        setIsUploading(false);
      }
      
      // Prepare animal data
      const animalData = {
        name: animalName,
        species: species,
        age: age,
        sex: sex,
        date_acquired: dateAcquired,
        health_status: healthStatus,
        image_url: imageUrl,
        animal_type: animalType,
        updated_at: new Date().toISOString(),
        // Conditional fields based on animal type
        ...(animalType === 'livestock' ? {
          production_purpose: productionPurpose,
          identification_number: identificationNumber,
          purchase_price: purchasePrice ? parseFloat(purchasePrice) : null,
          weight: weight ? parseFloat(weight) : null,
          feed_requirements: feedRequirements
        } : {}),
        ...(animalType === 'pet' ? {
          pet_type: petType,
          behavioral_notes: behavioralNotes,
          training_progress: trainingProgress,
          dietary_preferences: dietaryPreferences,
          grooming_needs: groomingNeeds
        } : {})
      };
      
      // Update in Supabase
      const { data, error } = await supabase
        .from('animals')
        .update(animalData)
        .eq('id', animalId)
        .eq('user_id', user.sub)
        .select();
      
      if (error) {
        console.error('Detailed Supabase error:', JSON.stringify(error));
        throw error;
      }
      
      Alert.alert("Success", "Animal successfully updated!");
      // Navigate back to animal profile
      router.push({
        pathname: '/animalProfileScreen',
        params: { animalId }
      });
      
    } catch (error) {
      console.error('Error updating animal:', error.message || error);
      Alert.alert("Error", "Failed to update animal. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };
  
  if (animalLoading) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0a7ea4" />
        <Text style={styles.loadingText}>Loading animal data...</Text>
      </ThemedView>
    );
  }
  
  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>Edit Animal</Text>
        
        {/* Animal Type Selection */}
        <View style={styles.typeSelection}>
          <Text style={styles.sectionLabel}>Animal Type:</Text>
          <RadioButton.Group onValueChange={value => setAnimalType(value)} value={animalType}>
            <View style={styles.radioRow}>
              <RadioButton.Item label="Livestock" value="livestock" position="leading" />
              <RadioButton.Item label="Pet" value="pet" position="leading" />
            </View>
          </RadioButton.Group>
        </View>
        
        <Divider style={styles.divider} />
        
        {/* Core Animal Information */}
        <Text style={styles.sectionLabel}>Basic Information</Text>
        
        <TextInput
          label="Name"
          value={animalName}
          onChangeText={setAnimalName}
          style={styles.input}
          mode="outlined"
        />
        
        <TextInput
          label="Species/Breed"
          value={species}
          onChangeText={setSpecies}
          style={styles.input}
          mode="outlined"
        />
        
        <TextInput
          label="Age"
          value={age}
          onChangeText={setAge}
          style={styles.input}
          mode="outlined"
          keyboardType="default"
        />
        
        <TextInput
          label="Sex"
          value={sex}
          onChangeText={setSex}
          style={styles.input}
          mode="outlined"
        />
        
        <TextInput
          label="Date Acquired (YYYY-MM-DD)"
          value={dateAcquired}
          onChangeText={setDateAcquired}
          style={styles.input}
          mode="outlined"
        />
        
        <TextInput
          label="Health Status"
          value={healthStatus}
          onChangeText={setHealthStatus}
          style={styles.input}
          mode="outlined"
        />
        
        <Text style={styles.imageLabel}>Animal Photo</Text>
        <ImagePicker
          image={animalImage}
          onPickImage={handlePickImage}
          isUploading={isUploading}
        />
        
        <Divider style={styles.divider} />
        
        {/* Livestock Details Section */}
        <List.Accordion
          title="Livestock Details"
          expanded={livestockExpanded}
          onPress={() => setLivestockExpanded(!livestockExpanded)}
          style={styles.accordion}
          titleStyle={styles.accordionTitle}
          disabled={animalType !== 'livestock'}
          left={props => <List.Icon {...props} icon="cow" />}
        >
          <View style={styles.accordionContent}>
            <TextInput
              label="Production Purpose"
              value={productionPurpose}
              onChangeText={setProductionPurpose}
              style={styles.input}
              mode="outlined"
              placeholder="e.g., Meat, Dairy, Eggs, Wool"
            />
            
            <TextInput
              label="Identification/Tag Number"
              value={identificationNumber}
              onChangeText={setIdentificationNumber}
              style={styles.input}
              mode="outlined"
            />
            
            <TextInput
              label="Purchase Price"
              value={purchasePrice}
              onChangeText={setPurchasePrice}
              style={styles.input}
              mode="outlined"
              keyboardType="numeric"
              placeholder="0.00"
            />
            
            <TextInput
              label="Weight (kg)"
              value={weight}
              onChangeText={setWeight}
              style={styles.input}
              mode="outlined"
              keyboardType="numeric"
            />
            
            <TextInput
              label="Feed Requirements"
              value={feedRequirements}
              onChangeText={setFeedRequirements}
              style={styles.input}
              mode="outlined"
              multiline
              numberOfLines={3}
            />
          </View>
        </List.Accordion>
        
        {/* Pet Details Section */}
        <List.Accordion
          title="Pet Details"
          expanded={petExpanded}
          onPress={() => setPetExpanded(!petExpanded)}
          style={styles.accordion}
          titleStyle={styles.accordionTitle}
          disabled={animalType !== 'pet'}
          left={props => <List.Icon {...props} icon="paw" />}
        >
          <View style={styles.accordionContent}>
            <TextInput
              label="Pet Type"
              value={petType}
              onChangeText={setPetType}
              style={styles.input}
              mode="outlined"
              placeholder="e.g., Companion, Working, Therapy"
            />
            
            <TextInput
              label="Behavioral Notes"
              value={behavioralNotes}
              onChangeText={setBehavioralNotes}
              style={styles.input}
              mode="outlined"
              multiline
              numberOfLines={3}
            />
            
            <TextInput
              label="Training Progress"
              value={trainingProgress}
              onChangeText={setTrainingProgress}
              style={styles.input}
              mode="outlined"
              multiline
              numberOfLines={2}
            />
            
            <TextInput
              label="Dietary Preferences"
              value={dietaryPreferences}
              onChangeText={setDietaryPreferences}
              style={styles.input}
              mode="outlined"
            />
            
            <TextInput
              label="Grooming Needs"
              value={groomingNeeds}
              onChangeText={setGroomingNeeds}
              style={styles.input}
              mode="outlined"
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
            onPress={handleUpdateAnimal}
            style={styles.saveButton}
            disabled={isSaving || isUploading}
            loading={isSaving}
          >
            Update Animal
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
  typeSelection: {
    marginBottom: 16,
  },
  radioRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 8,
  },
  sectionLabel: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    marginTop: 8,
  },
  input: {
    marginBottom: 16,
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