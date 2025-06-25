// app/(main)/(screens)/addPetScreen.jsx
import React, { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { TextInput, Button, Divider, List } from 'react-native-paper';
import { uploadImage, savePetData } from '@/services/supabase';
import { ThemedView } from '@/components/themes/ThemedView';
import { ThemedText } from '@/components/themes/ThemedText';
import { ThemedCard } from '@/components/themes/ThemedCard';
import { useTheme } from '@/contexts/ThemeContext';
import { useInputColors } from '@/hooks/useThemeColor';
import ImagePicker from '@/components/interfaces/ImagePicker';
import { useAuth } from '@/contexts/AuthContext';
import { router } from 'expo-router';
import AgeInput from '@/components/interfaces/AgeInput';

export default function AddPetScreen() {
  const { colors, isDark } = useTheme();
  const inputColors = useInputColors();
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
        user_id: user?.sub,
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
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <ThemedText type="title" style={styles.title}>Add Pet</ThemedText>
        
        {/* Basic Information Card */}
        <ThemedCard variant="elevated" style={styles.card}>
          <View style={styles.cardContent}>
            <ThemedText type="subtitle" style={styles.sectionTitle}>
              Basic Information
            </ThemedText>
            
            <TextInput
              label="Name"
              value={petName}
              onChangeText={setPetName}
              style={styles.input}
              mode="outlined"
              outlineStyle={styles.inputOutline}
            />
            
            <TextInput
              label="Species/Breed"
              value={species}
              onChangeText={setSpecies}
              style={styles.input}
              mode="outlined"
              outlineStyle={styles.inputOutline}
              placeholder="e.g., Golden Retriever, Persian Cat"
            />
            
            <ThemedText style={styles.inputLabel}>Age</ThemedText>
            <AgeInput
              value={age}
              onAgeChange={(ageString) => setAge(ageString)}
              maxYears={25}
              style={[
                styles.ageInputContainer,
                { backgroundColor: colors.surface }
              ]}
            />
            
            <View style={styles.rowInputs}>
              <TextInput
                label="Sex"
                value={sex}
                onChangeText={setSex}
                style={[styles.input, styles.halfInput]}
                mode="outlined"
                outlineStyle={styles.inputOutline}
                placeholder="Male/Female"
              />
              
              <TextInput
                label="Health Status"
                value={healthStatus}
                onChangeText={setHealthStatus}
                style={[styles.input, styles.halfInput]}
                mode="outlined"
                outlineStyle={styles.inputOutline}
                placeholder="Healthy"
              />
            </View>
            
            <TextInput
              label="Date Acquired"
              value={dateAcquired}
              onChangeText={setDateAcquired}
              style={styles.input}
              mode="outlined"
              outlineStyle={styles.inputOutline}
              placeholder="YYYY-MM-DD"
            />
          </View>
        </ThemedCard>
        
        {/* Photo Upload Card */}
        <ThemedCard variant="elevated" style={styles.card}>
          <View style={styles.cardContent}>
            <ThemedText type="subtitle" style={styles.sectionTitle}>
              Photo
            </ThemedText>
            <ImagePicker
              mode="pet"
              images={petImage}
              onImagesSelected={setPetImage}
              isUploading={isUploading}
            />
          </View>
        </ThemedCard>
        
        {/* Additional Details Card */}
        <ThemedCard variant="elevated" style={styles.card}>
          <List.Accordion
            title="Additional Details"
            expanded={detailsExpanded}
            onPress={() => setDetailsExpanded(!detailsExpanded)}
            style={styles.accordion}
            titleStyle={[styles.accordionTitle, { color: colors.text }]}
            left={props => <List.Icon {...props} icon="chevron-down" />}
          >
            <View style={styles.accordionContent}>
              <TextInput
                label="Type"
                value={petType}
                onChangeText={setPetType}
                style={styles.input}
                mode="outlined"
                outlineStyle={styles.inputOutline}
                placeholder="Companion, Working, Therapy"
              />
              
              <TextInput
                label="Behavioral Notes"
                value={behavioralNotes}
                onChangeText={setBehavioralNotes}
                style={styles.input}
                mode="outlined"
                outlineStyle={styles.inputOutline}
                multiline
                numberOfLines={3}
                placeholder="Temperament, habits, behaviors..."
              />
              
              <TextInput
                label="Training"
                value={trainingProgress}
                onChangeText={setTrainingProgress}
                style={styles.input}
                mode="outlined"
                outlineStyle={styles.inputOutline}
                multiline
                numberOfLines={2}
                placeholder="Commands known, training goals..."
              />
              
              <TextInput
                label="Diet"
                value={dietaryPreferences}
                onChangeText={setDietaryPreferences}
                style={styles.input}
                mode="outlined"
                outlineStyle={styles.inputOutline}
                placeholder="Food brand, allergies, schedule..."
              />
              
              <TextInput
                label="Grooming"
                value={groomingNeeds}
                onChangeText={setGroomingNeeds}
                style={styles.input}
                mode="outlined"
                outlineStyle={styles.inputOutline}
                placeholder="Brushing, bathing, nail care..."
              />
            </View>
          </List.Accordion>
        </ThemedCard>
        
        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          <Button 
            mode="outlined" 
            onPress={() => router.back()}
            style={styles.cancelButton}
            labelStyle={[styles.buttonLabel, { color: colors.text }]}
          >
            Cancel
          </Button>
          
          <Button 
            mode="contained" 
            onPress={handleSavePet}
            style={styles.saveButton}
            labelStyle={styles.buttonLabel}
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
    padding: 20,
    paddingBottom: 40,
  },
  title: {
    textAlign: 'center',
    marginBottom: 24,
  },
  card: {
    marginBottom: 20,
    elevation: 2,
  },
  cardContent: {
    padding: 20,
  },
  sectionTitle: {
    marginBottom: 20,
    color: '#666',
  },
  input: {
    marginBottom: 16,
    backgroundColor: 'transparent',
  },
  inputOutline: {
    borderRadius: 12,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
    marginTop: 4,
  },
  ageInputContainer: {
    borderRadius: 12,
    marginBottom: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  rowInputs: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  halfInput: {
    flex: 1,
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
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
    marginTop: 24,
  },
  saveButton: {
    flex: 1,
    paddingVertical: 4,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 4,
  },
  buttonLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
});