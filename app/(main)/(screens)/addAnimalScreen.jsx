// components/AddAnimalScreen.jsx
import React, { useState } from 'react';
import { ScrollView, StyleSheet, View, ActivityIndicator, TouchableOpacity } from 'react-native';
import { TextInput, Button, Text, Divider, RadioButton, List } from 'react-native-paper';
import * as ExpoImagePicker from 'expo-image-picker';
import { uploadImage } from '@/services/supabase/storage';
import { supabase } from '@/services/supabase/config';
import { ThemedView } from '@/components/ThemedView';
import { useColorScheme } from '@/hooks/useColorScheme';
import ImagePicker from '@/components/interfaces/ImagePicker';
import { useAuth } from '@/contexts/AuthContext';

export default function AddAnimalScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { user } = useAuth();
  
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
  
  const handleSaveAnimal = async () => {
    if (!animalName || !species) {
      alert("Please provide at least a name and species for your animal.");
      return;
    }
    
    setIsSaving(true);
    let imageUrl = null;
    
    try {
      // Upload image if present
      if (animalImage) {
        setIsUploading(true);
        imageUrl = await uploadImage(animalImage);
        setIsUploading(false);
      }
      
      // Prepare animal data
      const animalData = {
        user_id: user?.sub, // Auth0 user ID
        name: animalName,
        species: species,
        age: age,
        sex: sex,
        date_acquired: dateAcquired,
        health_status: healthStatus,
        image_url: imageUrl,
        animal_type: animalType,
        created_at: new Date().toISOString(),
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
      
      // Save to Supabase
      const { data, error } = await supabase
        .from('animals')
        .insert(animalData)
        .select();
      
        if (error) {
            console.error('Detailed Supabase error:', JSON.stringify(error));
            throw error;
        }
      
      alert("Animal successfully added!");
      // Clear form or navigate away
      resetForm();
      
    } catch (error) {
      console.error('Error saving animal:', error.message || error);
      alert("Failed to save animal. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };
  
  const resetForm = () => {
    setAnimalName('');
    setSpecies('');
    setAge('');
    setSex('');
    setDateAcquired('');
    setHealthStatus('');
    setAnimalImage(null);
    setProductionPurpose('');
    setIdentificationNumber('');
    setPurchasePrice('');
    setWeight('');
    setFeedRequirements('');
    setPetType('');
    setBehavioralNotes('');
    setTrainingProgress('');
    setDietaryPreferences('');
    setGroomingNeeds('');
  };
  
  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>Add New Animal</Text>
        
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
        
        <Button 
          mode="contained" 
          onPress={handleSaveAnimal}
          style={styles.saveButton}
          disabled={isSaving || isUploading}
          loading={isSaving}
        >
          Save Animal
        </Button>
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
  saveButton: {
    marginTop: 24,
    paddingVertical: 8,
  },
});