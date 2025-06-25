// app/(main)/(screens)/editJournalScreen.jsx
import React, { useState, useEffect } from 'react';
import { ScrollView, StyleSheet, View, Alert, ActivityIndicator } from 'react-native';
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
import { useActivityIndicatorColors } from '@/hooks/useThemeColor';
import { BrandColors } from '@/constants/Colors';
import ImagePicker from '@/components/interfaces/ImagePicker';
import ReanimatedMoodCarousel from '@/components/interfaces/ReanimatedMoodCarousel';
import { useAuth } from '@/contexts/AuthContext';
import { useLocalSearchParams, router } from 'expo-router';
import { uploadImage, deleteImage } from '@/services/supabase';
import { updateJournalData, getJournalById } from '@/services/supabase/journalService';
import { getPetsByUserId } from '@/services/supabase/petService';

export default function EditJournalScreen() {
  const { journalId } = useLocalSearchParams();
  const { colors, isDark } = useTheme();
  const activityIndicatorColors = useActivityIndicatorColors();
  const { user } = useAuth();
  
  // Form state
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [journalDate, setJournalDate] = useState('');
  const [mood, setMood] = useState('');
  const [weather, setWeather] = useState('');
  const [selectedPetId, setSelectedPetId] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState('');
  const [location, setLocation] = useState('');
  const [photos, setPhotos] = useState([]);
  const [originalPhotos, setOriginalPhotos] = useState([]);
  
  // UI state
  const [loading, setLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [detailsExpanded, setDetailsExpanded] = useState(false);
  
  // User pets
  const [userPets, setUserPets] = useState([]);

  useEffect(() => {
    fetchJournalData();
    fetchUserPets();
  }, [journalId, user]);

  const fetchJournalData = async () => {
    if (!journalId || !user?.sub) return;
    
    setLoading(true);
    try {
      const journal = await getJournalById(journalId, user.sub);
      if (!journal) {
        Alert.alert("Error", "Journal not found");
        router.back();
        return;
      }
      
      // Populate form with journal data
      setTitle(journal.title || '');
      setContent(journal.content || '');
      setJournalDate(journal.journal_date || '');
      setMood(journal.mood || '');
      setWeather(journal.weather || '');
      setSelectedPetId(journal.pet_id || '');
      setIsPrivate(journal.is_private || false);
      setTags(journal.tags || []);
      setLocation(journal.location || '');
      setPhotos(journal.photo_urls || []);
      setOriginalPhotos(journal.photo_urls || []);
      
    } catch (error) {
      console.error('Error fetching journal:', error);
      Alert.alert("Error", "Failed to load journal data");
      router.back();
    } finally {
      setLoading(false);
    }
  };

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

  const handleUpdateJournal = async () => {
    if (!validateForm()) return;
    
    setIsSaving(true);
    let photoUrls = [];
    
    try {
      setIsUploading(true);
      
      // Process photos: keep existing URLs and upload new ones
      for (const photo of photos) {
        if (photo.startsWith('http')) {
          // Existing photo URL
          photoUrls.push(photo);
        } else {
          // New photo to upload
          const url = await uploadImage(photo);
          if (url) photoUrls.push(url);
        }
      }
      
      // Delete photos that were removed
      const photosToDelete = originalPhotos.filter(photo => !photos.includes(photo));
      for (const photoUrl of photosToDelete) {
        await deleteImage(photoUrl);
      }
      
      setIsUploading(false);
      
      // Prepare journal data
      const journalData = {
        title: title.trim(),
        content: content.trim(),
        journal_date: journalDate,
        mood: mood || null,
        weather: weather.trim() || null,
        pet_id: selectedPetId || null,
        photo_urls: photoUrls,
        is_private: isPrivate,
        tags: tags,
        location: location.trim() || null,
      };
      
      // Update using database function
      const result = await updateJournalData(journalId, user.sub, journalData);
      
      if (result) {
        Alert.alert(
          "Success", 
          "Journal entry updated successfully!",
          [
            {
              text: "OK",
              onPress: () => router.push({
                pathname: '/journalViewScreen',
                params: { journalId }
              })
            }
          ]
        );
      } else {
        throw new Error('Failed to update journal entry');
      }
      
    } catch (error) {
      console.error('Error updating journal:', error.message || error);
      Alert.alert("Error", "Failed to update journal entry. Please try again.");
    } finally {
      setIsSaving(false);
      setIsUploading(false);
    }
  };

  if (loading) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.centerState}>
          <ActivityIndicator 
            size="large" 
            color={activityIndicatorColors.primary}
          />
          <ThemedText style={[styles.loadingText, { color: colors.textSecondary }]}>
            Loading journal...
          </ThemedText>
        </View>
      </ThemedView>
    );
  }

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
            onPress={handleUpdateJournal}
            style={styles.saveButton}
            labelStyle={styles.buttonLabel}
            disabled={isSaving || isUploading}
            loading={isSaving}
          >
            Update Entry
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
  centerState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  loadingText: {
    textAlign: 'center',
    marginTop: 16,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
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
    minHeight: 32,
    paddingVertical: 2,
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
    minHeight: 28,
    paddingVertical: 1,
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