// app/(main)/(screens)/createPostScreen.jsx
import React, { useState, useEffect } from 'react';
import { ScrollView, StyleSheet, View, Alert } from 'react-native';
import { 
  TextInput, 
  Button, 
  List, 
  Chip,
  SegmentedButtons,
  ActivityIndicator
} from 'react-native-paper';
import { ThemedView } from '@/components/themes/ThemedView';
import { ThemedText } from '@/components/themes/ThemedText';
import { ThemedCard } from '@/components/themes/ThemedCard';
import { useTheme } from '@/contexts/ThemeContext';
import { useActivityIndicatorColors } from '@/hooks/useThemeColor';
import { BrandColors } from '@/constants/Colors';
import ImagePicker from '@/components/interfaces/ImagePicker';
import { useAuth } from '@/contexts/AuthContext';
import { useLocalSearchParams, router } from 'expo-router';
import { uploadImage, deleteImage } from '@/services/supabase';
import { createPost, updatePost, getPostById } from '@/services/supabase/postService';
import { getPetsByUserId } from '@/services/supabase/petService';

const POST_TYPES = [
  { value: 'text', label: 'Text', description: 'Share thoughts and stories' },
  { value: 'image', label: 'Photo', description: 'Share photos with your pets' },
  { value: 'video', label: 'Video', description: 'Share videos of your pets' },
  { value: 'article', label: 'Article', description: 'Write a detailed article' },
  { value: 'journal', label: 'Journal', description: 'Share from your journal' },
  { value: 'mixed', label: 'Mixed', description: 'Text with media' }
];

const VISIBILITY_OPTIONS = [
  { value: 'public', label: 'Public', description: 'Everyone can see this post' },
  { value: 'connections', label: 'Friends', description: 'Only your connections can see' },
  { value: 'private', label: 'Private', description: 'Only you can see this post' }
];

const POST_TEMPLATES = {
  text: {
    title: 'What\'s on your mind?',
    content: 'Share your thoughts about pet care, training tips, or just tell us about your day with your furry friends...'
  },
  image: {
    title: 'Photo of the day!',
    content: 'Look at this adorable moment I captured...'
  },
  video: {
    title: 'Check out this video!',
    content: 'I had to share this amazing moment...'
  },
  article: {
    title: 'Pet Care Guide: [Topic]',
    content: 'Today I want to share my experience with... \n\n## What I learned\n\n## Tips for other pet owners\n\n## Conclusion'
  },
  journal: {
    title: 'Journal Entry: [Date]',
    content: 'Today was a special day with my pet...'
  },
  mixed: {
    title: 'My pet adventure!',
    content: 'I want to share this experience with photos...'
  }
};

export default function CreatePostScreen() {
  const { postId } = useLocalSearchParams();
  const { colors, isDark } = useTheme();
  const activityIndicatorColors = useActivityIndicatorColors();
  const { user } = useAuth();
  
  const isEditMode = !!postId;
  
  // Form state
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [postType, setPostType] = useState('text');
  const [visibility, setVisibility] = useState('public');
  const [selectedPetId, setSelectedPetId] = useState('');
  const [mediaFile, setMediaFile] = useState(null);
  const [originalMediaUrl, setOriginalMediaUrl] = useState(null);
  
  // UI state
  const [loading, setLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [detailsExpanded, setDetailsExpanded] = useState(false);
  const [templateExpanded, setTemplateExpanded] = useState(false);
  
  // User pets
  const [userPets, setUserPets] = useState([]);

  useEffect(() => {
    fetchUserPets();
    if (isEditMode) {
      fetchPostData();
    }
  }, [postId, user]);

  const fetchPostData = async () => {
    if (!postId || !user?.sub) return;
    
    setLoading(true);
    try {
      const post = await getPostById(postId, user.sub);
      if (!post) {
        Alert.alert("Error", "Post not found or you don't have permission to edit it");
        router.back();
        return;
      }
      
      // Populate form with post data
      setTitle(post.title || '');
      setContent(post.content || '');
      setPostType(post.post_type || 'text');
      setVisibility(post.visibility || 'public');
      setSelectedPetId(post.pet_id || '');
      setOriginalMediaUrl(post.media_url || null);
      setMediaFile(post.media_url || null);
      
    } catch (error) {
      console.error('Error fetching post:', error);
      Alert.alert("Error", "Failed to load post data");
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

  const applyTemplate = (templateType) => {
    const template = POST_TEMPLATES[templateType];
    if (template) {
      setTitle(template.title);
      setContent(template.content);
      setPostType(templateType);
    }
    setTemplateExpanded(false);
  };

  const validateForm = () => {
    if (!title.trim()) {
      Alert.alert("Validation Error", "Please enter a title for your post.");
      return false;
    }
    
    if (title.trim().length > 255) {
      Alert.alert("Validation Error", "Title must be 255 characters or less.");
      return false;
    }
    
    if (!content.trim() && !mediaFile) {
      Alert.alert("Validation Error", "Please add some content or media to your post.");
      return false;
    }
    
    return true;
  };

  const handleSavePost = async () => {
    if (!validateForm()) return;
    
    setIsSaving(true);
    let mediaUrl = originalMediaUrl;
    
    try {
      // Handle media upload if there's a new file
      if (mediaFile && mediaFile !== originalMediaUrl) {
        setIsUploading(true);
        
        // Upload new media
        mediaUrl = await uploadImage(mediaFile);
        
        // Delete old media if it exists and upload was successful
        if (originalMediaUrl && mediaUrl) {
          await deleteImage(originalMediaUrl);
        }
        
        setIsUploading(false);
      }
      
      // Prepare post data
      const postData = {
        title: title.trim(),
        content: content.trim() || null,
        media_url: mediaUrl,
        post_type: postType,
        visibility: visibility,
        pet_id: selectedPetId || null,
      };

      let result;
      if (isEditMode) {
        result = await updatePost(postId, user.sub, postData);
      } else {
        postData.user_id = user.sub;
        result = await createPost(postData);
      }
      
      if (result) {
        Alert.alert(
          "Success", 
          isEditMode ? "Post updated successfully!" : "Post created successfully!",
          [
            {
              text: "OK",
              onPress: () => {
                if (isEditMode) {
                  router.push({
                    pathname: '/postViewScreen',
                    params: { postId }
                  });
                } else {
                  router.push('/postFeedScreen');
                }
              }
            }
          ]
        );
      } else {
        throw new Error(`Failed to ${isEditMode ? 'update' : 'create'} post`);
      }
      
    } catch (error) {
      console.error(`Error ${isEditMode ? 'updating' : 'creating'} post:`, error.message || error);
      Alert.alert("Error", `Failed to ${isEditMode ? 'update' : 'create'} post. Please try again.`);
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
            {isEditMode ? 'Loading post...' : 'Setting up...'}
          </ThemedText>
        </View>
      </ThemedView>
    );
  }

  const postTypeButtons = POST_TYPES.map(type => ({
    value: type.value,
    label: type.label
  }));

  const visibilityButtons = VISIBILITY_OPTIONS.map(option => ({
    value: option.value,
    label: option.label
  }));

  const selectedPostTypeInfo = POST_TYPES.find(type => type.value === postType);
  const selectedVisibilityInfo = VISIBILITY_OPTIONS.find(option => option.value === visibility);

  return (
    <ThemedView style={styles.container}>
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Content Card */}
        <ThemedCard variant="elevated" style={styles.card}>
          <View style={styles.cardContent}>
            <ThemedText type="subtitle" style={styles.sectionTitle}>
              Content
            </ThemedText>
            
            <TextInput
              label="Title"
              value={title}
              onChangeText={setTitle}
              style={styles.input}
              mode="outlined"
              outlineStyle={styles.inputOutline}
              placeholder="What's this post about?"
              maxLength={255}
              right={<TextInput.Affix text={`${title.length}/255`} />}
            />
            
            <TextInput
              label="Content"
              value={content}
              onChangeText={setContent}
              style={styles.input}
              mode="outlined"
              outlineStyle={styles.inputOutline}
              multiline
              numberOfLines={5}
              placeholder={selectedPostTypeInfo?.description || "Share your thoughts..."}
            />
          </View>
        </ThemedCard>

        {/* Post Type & Visibility Card */}
        <ThemedCard variant="elevated" style={styles.card}>
          <View style={styles.cardContent}>
            <ThemedText type="subtitle" style={styles.sectionTitle}>
              Settings
            </ThemedText>
            
            {/* Post Type */}
            <View style={styles.settingSection}>
              <ThemedText style={styles.settingLabel}>Post Type</ThemedText>
              <SegmentedButtons
                value={postType}
                onValueChange={setPostType}
                buttons={postTypeButtons.slice(0, 3)}
                style={styles.segmentedButtons}
              />
              <SegmentedButtons
                value={postType}
                onValueChange={setPostType}
                buttons={postTypeButtons.slice(3)}
                style={styles.segmentedButtons}
              />
              {selectedPostTypeInfo && (
                <ThemedText style={[styles.settingDescription, { color: colors.textSecondary }]}>
                  {selectedPostTypeInfo.description}
                </ThemedText>
              )}
            </View>

            {/* Visibility */}
            <View style={styles.settingSection}>
              <ThemedText style={styles.settingLabel}>Visibility</ThemedText>
              <SegmentedButtons
                value={visibility}
                onValueChange={setVisibility}
                buttons={visibilityButtons}
                style={styles.segmentedButtons}
              />
              {selectedVisibilityInfo && (
                <ThemedText style={[styles.settingDescription, { color: colors.textSecondary }]}>
                  {selectedVisibilityInfo.description}
                </ThemedText>
              )}
            </View>
          </View>
        </ThemedCard>

        {/* Media Upload Card */}
        {(postType === 'image' || postType === 'video' || postType === 'mixed') && (
          <ThemedCard variant="elevated" style={styles.card}>
            <View style={styles.cardContent}>
              <ThemedText type="subtitle" style={styles.sectionTitle}>
                Media
              </ThemedText>
              <ImagePicker
                mode="post"
                postType={postType}
                images={mediaFile}
                onImagesSelected={setMediaFile}
                isUploading={isUploading}
                placeholder={`Add ${postType === 'video' ? 'video' : 'photo'}`}
              />
            </View>
          </ThemedCard>
        )}

        {/* Quick Templates Card */}
        {!isEditMode && (
          <ThemedCard variant="elevated" style={styles.card}>
            <List.Accordion
              title="Quick Templates"
              expanded={templateExpanded}
              onPress={() => setTemplateExpanded(!templateExpanded)}
              style={styles.accordion}
              titleStyle={[styles.accordionTitle, { color: colors.text }]}
              left={props => <List.Icon {...props} icon="chevron-down" />}
            >
              <View style={styles.accordionContent}>
                <View style={styles.templatesContainer}>
                  {POST_TYPES.map(type => (
                    <Chip
                      key={type.value}
                      onPress={() => applyTemplate(type.value)}
                      style={[styles.templateChip, { backgroundColor: colors.surface }]}
                      textStyle={[styles.chipText, { color: colors.textSecondary }]}
                    >
                      {type.label}
                    </Chip>
                  ))}
                </View>
              </View>
            </List.Accordion>
          </ThemedCard>
        )}

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
              {/* Pet Selection */}
              {userPets.length > 0 && (
                <View style={styles.petsSection}>
                  <ThemedText style={styles.inputLabel}>Related Pet</ThemedText>
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
            onPress={handleSavePost}
            style={styles.saveButton}
            labelStyle={styles.buttonLabel}
            disabled={isSaving || isUploading}
            loading={isSaving}
          >
            {isEditMode ? 'Update Post' : 'Share Post'}
          </Button>
        </View>

        {/* Upload Progress */}
        {isUploading && (
          <View style={[styles.uploadProgress, { backgroundColor: colors.surface }]}>
            <ActivityIndicator 
              size="small" 
              color={activityIndicatorColors.primary}
            />
            <ThemedText style={[styles.uploadText, { color: colors.textSecondary }]}>
              Uploading media...
            </ThemedText>
          </View>
        )}
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
  settingSection: {
    marginBottom: 20,
  },
  settingLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  settingDescription: {
    fontSize: 12,
    marginTop: 4,
    textAlign: 'center',
  },
  segmentedButtons: {
    marginBottom: 8,
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
  templatesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  templateChip: {
    marginBottom: 8,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '500',
  },
  petsSection: {
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
  uploadProgress: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
    padding: 12,
    borderRadius: 8,
  },
  uploadText: {
    marginLeft: 8,
    fontSize: 14,
  },
});