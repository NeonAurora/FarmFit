// app/(main)/(screens)/editJournalScreen.jsx
import React, { useState, useEffect } from 'react';
import { ScrollView, StyleSheet, View, Alert, ActivityIndicator } from 'react-native';
import { 
  TextInput, 
  Button, 
  Text, 
  Divider, 
  List, 
  Card,
  Chip,
  SegmentedButtons,
  IconButton
} from 'react-native-paper';
import * as ExpoImagePicker from 'expo-image-picker';
import { ThemedView } from '@/components/ThemedView';
import { useColorScheme } from '@/hooks/useColorScheme';
import ImagePicker from '@/components/interfaces/ImagePicker';
import { useAuth } from '@/contexts/AuthContext';
import { useLocalSearchParams, router } from 'expo-router';
import { uploadImage, deleteImage } from '@/services/supabase/storage';
import { updateJournalData, getJournalById } from '@/services/supabase/journalService';
import { getPetsByUserId } from '@/services/supabase/petService';

const MOODS = [
  { value: 'happy', label: '😊 Happy', color: '#4CAF50' },
  { value: 'worried', label: '😟 Worried', color: '#FF9800' },
  { value: 'proud', label: '😤 Proud', color: '#9C27B0' },
  { value: 'sad', label: '😢 Sad', color: '#2196F3' },
  { value: 'tired', label: '😴 Tired', color: '#607D8B' }
];

export default function EditJournalScreen() {
  const { journalId } = useLocalSearchParams();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
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

  const handlePickImages = async () => {
    const { status } = await ExpoImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Please allow access to your photos.');
      return;
    }

    const result = await ExpoImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.7,
      allowsEditing: false,
      allowsMultipleSelection: true,
      selectionLimit: 5
    });

    if (!result.canceled && result.assets?.length > 0) {
      setPhotos(prev => [...prev, ...result.assets.map(asset => asset.uri)]);
    }
  };

  const removePhoto = async (index) => {
    const photoToRemove = photos[index];
    
    // If it's an original photo (URL), we'll mark it for deletion
    if (originalPhotos.includes(photoToRemove)) {
      // We'll handle deletion during save
    }
    
    setPhotos(prev => prev.filter((_, i) => i !== index));
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
      <ThemedView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0a7ea4" />
        <Text style={styles.loadingText}>Loading journal...</Text>
      </ThemedView>
    );
  }

  const moodButtons = MOODS.map(m => ({
    value: m.value,
    label: m.label
  }));

  const privacyButtons = [
    { value: false, label: 'Public' },
    { value: true, label: 'Private' }
  ];

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>Edit Journal Entry</Text>
        
        {/* Basic Information */}
        <Card style={styles.card}>
          <Card.Title title="📝 Basic Information" />
          <Card.Content>
            <TextInput
              label="Title *"
              value={title}
              onChangeText={setTitle}
              style={styles.input}
              mode="outlined"
              placeholder="What's this entry about?"
            />
            
            <TextInput
              label="Journal Date"
              value={journalDate}
              onChangeText={setJournalDate}
              style={styles.input}
              mode="outlined"
              placeholder="YYYY-MM-DD"
            />
            
            <TextInput
              label="Content *"
              value={content}
              onChangeText={setContent}
              style={styles.input}
              mode="outlined"
              multiline
              numberOfLines={6}
              placeholder="Write about your day, your pet's progress, or anything on your mind..."
            />
          </Card.Content>
        </Card>

        {/* Mood Selection */}
        <Card style={styles.card}>
          <Card.Title title="😊 How are you feeling?" />
          <Card.Content>
            <SegmentedButtons
              value={mood}
              onValueChange={setMood}
              buttons={moodButtons}
              style={styles.moodButtons}
            />
          </Card.Content>
        </Card>

        {/* Pet Selection */}
        {userPets.length > 0 && (
          <Card style={styles.card}>
            <Card.Title title="🐾 About which pet?" />
            <Card.Content>
              <View style={styles.petsContainer}>
                <Chip
                  selected={selectedPetId === ''}
                  onPress={() => setSelectedPetId('')}
                  style={styles.petChip}
                >
                  General
                </Chip>
                {userPets.map(pet => (
                  <Chip
                    key={pet.id}
                    selected={selectedPetId === pet.id}
                    onPress={() => setSelectedPetId(pet.id)}
                    style={styles.petChip}
                    avatar={pet.image_url ? undefined : 'paw'}
                  >
                    {pet.name}
                  </Chip>
                ))}
              </View>
            </Card.Content>
          </Card>
        )}

        {/* Privacy Setting */}
        <Card style={styles.card}>
          <Card.Title title="🔒 Privacy" />
          <Card.Content>
            <SegmentedButtons
              value={isPrivate}
              onValueChange={setIsPrivate}
              buttons={privacyButtons}
              style={styles.privacyButtons}
            />
          </Card.Content>
        </Card>

        {/* Additional Details */}
        <List.Accordion
          title="📋 Additional Details"
          expanded={detailsExpanded}
          onPress={() => setDetailsExpanded(!detailsExpanded)}
          style={styles.accordion}
          titleStyle={styles.accordionTitle}
        >
          <Card style={styles.detailsCard}>
            <Card.Content>
              <TextInput
                label="Weather"
                value={weather}
                onChangeText={setWeather}
                style={styles.input}
                mode="outlined"
                placeholder="Sunny, Rainy, Cloudy..."
              />
              
              <TextInput
                label="Location"
                value={location}
                onChangeText={setLocation}
                style={styles.input}
                mode="outlined"
                placeholder="Where did this happen?"
              />

              {/* Tags */}
              <View style={styles.tagsSection}>
                <Text style={styles.sectionLabel}>Tags</Text>
                <View style={styles.tagInputContainer}>
                  <TextInput
                    label="Add tag"
                    value={tagInput}
                    onChangeText={setTagInput}
                    style={[styles.input, styles.tagInput]}
                    mode="outlined"
                    placeholder="health, training, fun..."
                    onSubmitEditing={addTag}
                  />
                  <IconButton
                    icon="plus"
                    size={20}
                    onPress={addTag}
                    style={styles.addTagButton}
                  />
                </View>
                
                <View style={styles.tagsContainer}>
                  {tags.map((tag, index) => (
                    <Chip
                      key={index}
                      onClose={() => removeTag(tag)}
                      style={styles.tagChip}
                    >
                      #{tag}
                    </Chip>
                  ))}
                </View>
              </View>

              {/* Photos */}
              <View style={styles.photosSection}>
                <Text style={styles.sectionLabel}>Photos</Text>
                <Button
                  mode="outlined"
                  onPress={handlePickImages}
                  icon="camera"
                  style={styles.photoButton}
                >
                  Add Photos ({photos.length}/5)
                </Button>
                
                <View style={styles.photosContainer}>
                  {photos.map((photo, index) => (
                    <View key={index} style={styles.photoContainer}>
                      <ImagePicker
                        image={photo}
                        onPickImage={() => {}}
                        isUploading={false}
                      />
                      <IconButton
                        icon="close"
                        size={16}
                        onPress={() => removePhoto(index)}
                        style={styles.removePhotoButton}
                        iconColor="#E74C3C"
                      />
                    </View>
                  ))}
                </View>
              </View>
            </Card.Content>
          </Card>
        </List.Accordion>
        
        {/* Action Buttons */}
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
            onPress={handleUpdateJournal}
            style={styles.saveButton}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
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
  card: {
    marginBottom: 16,
  },
  input: {
    marginBottom: 16,
    backgroundColor: "transparent",
  },
  moodButtons: {
    marginBottom: 8,
  },
  petsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  petChip: {
    marginRight: 8,
    marginBottom: 8,
  },
  privacyButtons: {
    marginBottom: 8,
  },
  accordion: {
    marginBottom: 8,
    borderRadius: 8,
    overflow: 'hidden',
  },
  accordionTitle: {
    fontWeight: '500',
    fontSize: 16,
  },
  detailsCard: {
    backgroundColor: '#f8f9fa',
    marginBottom: 16,
  },
  tagsSection: {
    marginBottom: 16,
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
  },
  tagInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tagInput: {
    flex: 1,
  },
  addTagButton: {
    marginLeft: 8,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  tagChip: {
    marginRight: 8,
    marginBottom: 8,
  },
  photosSection: {
    marginBottom: 16,
  },
  photoButton: {
    marginBottom: 16,
  },
  photosContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  photoContainer: {
    position: 'relative',
    width: 100,
    height: 100,
  },
  removePhotoButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: 'white',
    borderRadius: 12,
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
    backgroundColor: '#2E86DE',
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