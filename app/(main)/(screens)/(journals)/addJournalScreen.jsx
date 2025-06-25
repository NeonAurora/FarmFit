// app/(main)/(screens)/addJournalScreen.jsx
import React, { useState, useEffect } from 'react';
import { ScrollView, StyleSheet, View, Alert } from 'react-native';
import { 
  TextInput, 
  Button, 
  List, 
  Chip,
  SegmentedButtons,
  IconButton
} from 'react-native-paper';
import { ThemedView } from '@/components/themes/ThemedView';
import { ThemedText } from '@/components/themes/ThemedText';
import { ThemedCard } from '@/components/themes/ThemedCard';
import { useTheme } from '@/contexts/ThemeContext';
import ImagePicker from '@/components/interfaces/ImagePicker';
import { useAuth } from '@/contexts/AuthContext';
import { router } from 'expo-router';
import { uploadImage } from '@/services/supabase';
import { saveJournalData } from '@/services/supabase/journalService';
import { getPetsByUserId } from '@/services/supabase/petService';
import { BrandColors } from '@/constants/Colors';
import ReanimatedMoodCarousel from '@/components/interfaces/ReanimatedMoodCarousel';

export default function AddJournalScreen() {
  const { colors, isDark } = useTheme();
  const { user } = useAuth();
  
  // Form state
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [journalDate, setJournalDate] = useState(new Date().toISOString().split('T')[0]);
  const [mood, setMood] = useState('');
  const [weather, setWeather] = useState('');
  const [selectedPetId, setSelectedPetId] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState('');
  const [location, setLocation] = useState('');
  const [photos, setPhotos] = useState([]);
  
  // UI state
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [detailsExpanded, setDetailsExpanded] = useState(false);
  
  // User pets
  const [userPets, setUserPets] = useState([]);

  useEffect(() => {
    fetchUserPets();
  }, [user]);

  const fetchUserPets = async () => {
    if (!user?.sub) return;
    
    try {
      const pets = await getPetsByUserId(user.sub);
      setUserPets(pets);
    } catch (error) {
      console.error('Error fetching pets:', error);
    }
  };

  const addTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags(prev => [...prev, tagInput.trim()]);
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove) => {
    setTags(prev => prev.filter(tag => tag !== tagToRemove));
  };

  const validateForm = () => {
    if (!title.trim()) {
      Alert.alert("Validation Error", "Please enter a title for your journal entry.");
      return false;
    }
    
    if (!content.trim()) {
      Alert.alert("Validation Error", "Please write some content for your journal entry.");
      return false;
    }
    
    return true;
  };

  const handleSaveJournal = async () => {
    if (!validateForm()) return;
    
    setIsSaving(true);
    let photoUrls = [];
    
    try {
      // Upload photos if any
      if (photos.length > 0) {
        setIsUploading(true);
        for (const photo of photos) {
          const url = await uploadImage(photo);
          if (url) photoUrls.push(url);
        }
        setIsUploading(false);
      }
      
      // Prepare journal data
      const journalData = {
        user_id: user.sub,
        pet_id: selectedPetId || null,
        title: title.trim(),
        content: content.trim(),
        journal_date: journalDate,
        mood: mood || null,
        weather: weather.trim() || null,
        photo_urls: photoUrls,
        is_private: isPrivate,
        tags: tags,
        location: location.trim() || null,
      };
      
      // Save using database function
      const result = await saveJournalData(journalData);
      
      if (result) {
        Alert.alert(
          "Success", 
          "Journal entry saved successfully!",
          [
            {
              text: "OK",
              onPress: () => router.back()
            }
          ]
        );
      } else {
        throw new Error('Failed to save journal entry');
      }
      
    } catch (error) {
      console.error('Error saving journal:', error.message || error);
      Alert.alert("Error", "Failed to save journal entry. Please try again.");
    } finally {
      setIsSaving(false);
      setIsUploading(false);
    }
  };

  const privacyButtons = [
    { value: false, label: 'Public' },
    { value: true, label: 'Private' }
  ];

  return (
    <ThemedView style={styles.container}>
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      > 
        {/* Basic Information Card */}
        <ThemedCard variant="elevated" style={styles.card}>
          <View style={styles.cardContent}>
            <ThemedText type="subtitle" style={styles.sectionTitle}>
              Basic Information
            </ThemedText>
            
            <TextInput
              label="Title"
              value={title}
              onChangeText={setTitle}
              style={styles.input}
              mode="outlined"
              outlineStyle={styles.inputOutline}
              placeholder="What's this entry about?"
            />
            
            <View style={styles.rowInputs}>
              <TextInput
                label="Date"
                value={journalDate}
                onChangeText={setJournalDate}
                style={[styles.input, styles.halfInput]}
                mode="outlined"
                outlineStyle={styles.inputOutline}
                placeholder="YYYY-MM-DD"
              />
              
              <TextInput
                label="Weather"
                value={weather}
                onChangeText={setWeather}
                style={[styles.input, styles.halfInput]}
                mode="outlined"
                outlineStyle={styles.inputOutline}
                placeholder="Sunny, Rainy..."
              />
            </View>
            
            <TextInput
              label="Content"
              value={content}
              onChangeText={setContent}
              style={styles.input}
              mode="outlined"
              outlineStyle={styles.inputOutline}
              multiline
              numberOfLines={5}
              placeholder="Write about your day, your pet's progress, or anything on your mind..."
            />
          </View>
        </ThemedCard>

        {/* Mood Selection Card */}
        <ThemedCard variant="elevated" style={styles.card}>
          <View style={styles.cardContent}>
            <ThemedText type="subtitle" style={styles.sectionTitle}>
              How are you feeling?
            </ThemedText>
            <ReanimatedMoodCarousel
              value={mood}
              onValueChange={setMood}
            />
          </View>
        </ThemedCard>

        {/* Pet & Privacy Card */}
        <ThemedCard variant="elevated" style={styles.card}>
          <View style={styles.cardContent}>
            <ThemedText type="subtitle" style={styles.sectionTitle}>
              Settings
            </ThemedText>
            
            {/* Pet Selection */}
            {userPets.length > 0 && (
              <View style={styles.settingSection}>
                <ThemedText style={styles.settingLabel}>Related Pet</ThemedText>
                <View style={styles.petsContainer}>
                  <Chip
                    selected={selectedPetId === ''}
                    onPress={() => setSelectedPetId('')}
                    style={[
                      styles.petChip,
                      selectedPetId === '' && { backgroundColor: BrandColors.primary + '15' }
                    ]}
                    textStyle={[
                      styles.chipText,
                      selectedPetId === '' && { color: BrandColors.primary }
                    ]}
                  >
                    General
                  </Chip>
                  {userPets.map(pet => (
                    <Chip
                      key={pet.id}
                      selected={selectedPetId === pet.id}
                      onPress={() => setSelectedPetId(pet.id)}
                      style={[
                        styles.petChip,
                        selectedPetId === pet.id && { backgroundColor: BrandColors.primary + '15' }
                      ]}
                      textStyle={[
                        styles.chipText,
                        selectedPetId === pet.id && { color: BrandColors.primary }
                      ]}
                    >
                      {pet.name}
                    </Chip>
                  ))}
                </View>
              </View>
            )}

            {/* Privacy Setting */}
            <View style={styles.settingSection}>
              <ThemedText style={styles.settingLabel}>Privacy</ThemedText>
              <SegmentedButtons
                value={isPrivate}
                onValueChange={setIsPrivate}
                buttons={privacyButtons}
                style={styles.privacyButtons}
              />
            </View>
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
                label="Location"
                value={location}
                onChangeText={setLocation}
                style={styles.input}
                mode="outlined"
                outlineStyle={styles.inputOutline}
                placeholder="Where did this happen?"
              />

              {/* Tags Section */}
              <View style={styles.tagsSection}>
                <ThemedText style={styles.inputLabel}>Tags</ThemedText>
                <View style={styles.tagInputContainer}>
                  <TextInput
                    label="Add tag"
                    value={tagInput}
                    onChangeText={setTagInput}
                    style={[styles.input, styles.tagInput]}
                    mode="outlined"
                    outlineStyle={styles.inputOutline}
                    placeholder="health, training, fun..."
                    onSubmitEditing={addTag}
                  />
                  <IconButton
                    icon="plus"
                    size={20}
                    onPress={addTag}
                    style={[styles.addTagButton, { backgroundColor: colors.surface }]}
                    iconColor={colors.text}
                  />
                </View>
                
                <View style={styles.tagsContainer}>
                  {tags.map((tag, index) => (
                    <Chip
                      key={index}
                      onClose={() => removeTag(tag)}
                      style={[styles.tagChip, { backgroundColor: colors.surface }]}
                      textStyle={[styles.chipText, { color: colors.textSecondary }]}
                    >
                      #{tag}
                    </Chip>
                  ))}
                </View>
              </View>

              {/* Photos Section */}
              <View style={styles.photosSection}>
                <ThemedText style={styles.inputLabel}>Photos</ThemedText>
                <ImagePicker
                  mode="journal"
                  images={photos}
                  onImagesSelected={setPhotos}
                  isUploading={isUploading}
                  maxImages={5}
                  placeholder="Add photos for your journal entry"
                />
              </View>
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
            onPress={handleSaveJournal}
            style={styles.saveButton}
            labelStyle={styles.buttonLabel}
            disabled={isSaving || isUploading}
            loading={isSaving}
          >
            Save Entry
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
    marginBottom: 24,
  },
  card: {
    marginBottom: 20,
    elevation: 1,
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
  },
  rowInputs: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  halfInput: {
    flex: 1,
  },
  settingSection: {
    marginBottom: 20,
  },
  settingLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  petsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  petChip: {
    height: 32,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '500',
  },
  privacyButtons: {
    height: 40,
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
  tagsSection: {
    marginBottom: 20,
  },
  tagInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  tagInput: {
    flex: 1,
  },
  addTagButton: {
    borderRadius: 8,
    width: 40,
    height: 40,
    margin: 0,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  tagChip: {
    height: 28,
  },
  photosSection: {
    marginBottom: 8,
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