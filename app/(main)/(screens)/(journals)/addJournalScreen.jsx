// app/(main)/(screens)/addJournalScreen.jsx
import React, { useState, useEffect } from 'react';
import { ScrollView, StyleSheet, View, Alert } from 'react-native';
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
import { ThemedView } from '@/components/themes/ThemedView';
import { useColorScheme } from '@/hooks/useColorScheme';
import ImagePicker from '@/components/interfaces/ImagePicker';
import HorizontalMoodPicker from '@/components/interfaces/HorizontalMoodPicker';
import { useAuth } from '@/contexts/AuthContext';
import { router } from 'expo-router';
import { uploadImage } from '@/services/supabase/storage';
import { saveJournalData } from '@/services/supabase/journalService';
import { getPetsByUserId } from '@/services/supabase/petService';
import ReanimatedMoodCarousel from '@/components/interfaces/ReanimatedMoodCarousel';

export default function AddJournalScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
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
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>New Journal Entry</Text>
        
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
            <ReanimatedMoodCarousel
            value={mood}
            onValueChange={setMood}
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
                <ImagePicker
                  mode="journal"
                  images={photos}
                  onImagesSelected={setPhotos}
                  isUploading={isUploading}
                  maxImages={5}
                  placeholder="Tap to add photos for your journal entry"
                />
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
            onPress={handleSaveJournal}
            style={styles.saveButton}
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