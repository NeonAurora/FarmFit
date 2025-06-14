// app/(main)/(screens)/createPostScreen.jsx
import React, { useState, useEffect } from 'react';
import { ScrollView, StyleSheet, View, Alert, Image } from 'react-native';
import { 
  TextInput, 
  Button, 
  Text, 
  Divider, 
  List, 
  Card,
  Chip,
  SegmentedButtons,
  IconButton,
  ActivityIndicator
} from 'react-native-paper';
import * as ExpoImagePicker from 'expo-image-picker';
import { ThemedView } from '@/components/ThemedView';
import { useColorScheme } from '@/hooks/useColorScheme';
import ImagePicker from '@/components/interfaces/ImagePicker';
import { useAuth } from '@/contexts/AuthContext';
import { useLocalSearchParams, router } from 'expo-router';
import { uploadImage, deleteImage } from '@/services/supabase/storage';
import { createPost, updatePost, getPostById } from '@/services/supabase/postService';
import { getPetsByUserId } from '@/services/supabase/petService';

const POST_TYPES = [
  { value: 'text', label: 'Text', emoji: '📝', description: 'Share thoughts and stories' },
  { value: 'image', label: 'Photo', emoji: '📸', description: 'Share photos with your pets' },
  { value: 'video', label: 'Video', emoji: '🎥', description: 'Share videos of your pets' },
  { value: 'article', label: 'Article', emoji: '📰', description: 'Write a detailed article' },
  { value: 'journal', label: 'Journal', emoji: '📔', description: 'Share from your journal' },
  { value: 'mixed', label: 'Mixed', emoji: '🎭', description: 'Text with media' }
];

const VISIBILITY_OPTIONS = [
  { value: 'public', label: 'Public', emoji: '🌍', description: 'Everyone can see this post' },
  { value: 'connections', label: 'Friends', emoji: '👥', description: 'Only your connections can see' },
  { value: 'private', label: 'Private', emoji: '🔒', description: 'Only you can see this post' }
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
  const { postId } = useLocalSearchParams(); // For edit mode
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
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

  const handlePickMedia = async () => {
    const { status } = await ExpoImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Please allow access to your photos and videos.');
      return;
    }

    let mediaTypeOptions = ['images'];
    if (postType === 'video' || postType === 'mixed') {
      mediaTypeOptions.push('videos');
    }

    const result = await ExpoImagePicker.launchImageLibraryAsync({
      mediaTypes: mediaTypeOptions,
      quality: 0.8,
      allowsEditing: true,
      aspect: postType === 'image' ? [16, 9] : undefined,
    });

    if (!result.canceled && result.assets?.length > 0) {
      const asset = result.assets[0];
      setMediaFile(asset.uri);
      
      // Auto-adjust post type based on media
      if (asset.type === 'video' && postType === 'image') {
        setPostType('video');
      } else if (asset.type === 'image' && postType === 'video') {
        setPostType('image');
      }
    }
  };

  const removeMedia = () => {
    setMediaFile(null);
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
    let mediaUrl = originalMediaUrl; // Default to original media URL
    
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
        // Update existing post
        result = await updatePost(postId, user.sub, postData);
      } else {
        // Create new post
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
      <ThemedView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0a7ea4" />
        <Text style={styles.loadingText}>
          {isEditMode ? 'Loading post...' : 'Setting up...'}
        </Text>
      </ThemedView>
    );
  }

  const postTypeButtons = POST_TYPES.map(type => ({
    value: type.value,
    label: `${type.emoji} ${type.label}`
  }));

  const visibilityButtons = VISIBILITY_OPTIONS.map(option => ({
    value: option.value,
    label: `${option.emoji} ${option.label}`
  }));

  const selectedPostTypeInfo = POST_TYPES.find(type => type.value === postType);
  const selectedVisibilityInfo = VISIBILITY_OPTIONS.find(option => option.value === visibility);

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>
          {isEditMode ? 'Edit Post' : 'Share Your Story'}
        </Text>
        
        {/* Post Type Selection */}
        <Card style={styles.card}>
          <Card.Title title="📝 Post Type" />
          <Card.Content>
            <SegmentedButtons
              value={postType}
              onValueChange={setPostType}
              buttons={postTypeButtons.slice(0, 3)} // Show first 3 options
              style={styles.segmentedButtons}
            />
            <SegmentedButtons
              value={postType}
              onValueChange={setPostType}
              buttons={postTypeButtons.slice(3)} // Show remaining options
              style={styles.segmentedButtons}
            />
            {selectedPostTypeInfo && (
              <Text style={styles.typeDescription}>
                {selectedPostTypeInfo.description}
              </Text>
            )}
          </Card.Content>
        </Card>

        {/* Quick Templates */}
        {!isEditMode && (
          <List.Accordion
            title="🎯 Quick Templates"
            expanded={templateExpanded}
            onPress={() => setTemplateExpanded(!templateExpanded)}
            style={styles.accordion}
            titleStyle={styles.accordionTitle}
          >
            <View style={styles.templatesContainer}>
              {POST_TYPES.map(type => (
                <Chip
                  key={type.value}
                  onPress={() => applyTemplate(type.value)}
                  style={styles.templateChip}
                  icon={() => <Text>{type.emoji}</Text>}
                >
                  {type.label}
                </Chip>
              ))}
            </View>
          </List.Accordion>
        )}

        {/* Basic Information */}
        <Card style={styles.card}>
          <Card.Title title="✍️ Content" />
          <Card.Content>
            <TextInput
              label="Title *"
              value={title}
              onChangeText={setTitle}
              style={styles.input}
              mode="outlined"
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
              multiline
              numberOfLines={6}
              placeholder={selectedPostTypeInfo?.description || "Share your thoughts..."}
            />
          </Card.Content>
        </Card>

        {/* Media Upload */}
        {(postType === 'image' || postType === 'video' || postType === 'mixed') && (
          <Card style={styles.card}>
            <Card.Title title="📷 Media" />
            <Card.Content>
              {mediaFile ? (
                <View style={styles.mediaContainer}>
                  {postType === 'video' ? (
                    <View style={styles.videoPreview}>
                      <IconButton 
                        icon="play-circle" 
                        size={50} 
                        iconColor="#fff"
                      />
                      <Text style={styles.videoLabel}>Video selected</Text>
                    </View>
                  ) : (
                    <Image 
                      source={{ uri: mediaFile }} 
                      style={styles.mediaPreview}
                      resizeMode="cover"
                    />
                  )}
                  <IconButton
                    icon="close"
                    size={20}
                    onPress={removeMedia}
                    style={styles.removeMediaButton}
                    iconColor="#E74C3C"
                  />
                </View>
              ) : (
                <Button
                  mode="outlined"
                  onPress={handlePickMedia}
                  icon="camera"
                  style={styles.mediaButton}
                >
                  Add {postType === 'video' ? 'Video' : 'Photo'}
                </Button>
              )}
            </Card.Content>
          </Card>
        )}

        {/* Visibility Settings */}
        <Card style={styles.card}>
          <Card.Title title="👁️ Visibility" />
          <Card.Content>
            <SegmentedButtons
              value={visibility}
              onValueChange={setVisibility}
              buttons={visibilityButtons}
              style={styles.segmentedButtons}
            />
            {selectedVisibilityInfo && (
              <Text style={styles.visibilityDescription}>
                {selectedVisibilityInfo.description}
              </Text>
            )}
          </Card.Content>
        </Card>

        {/* Additional Details */}
        <List.Accordion
          title="🐾 Additional Details"
          expanded={detailsExpanded}
          onPress={() => setDetailsExpanded(!detailsExpanded)}
          style={styles.accordion}
          titleStyle={styles.accordionTitle}
        >
          <Card style={styles.detailsCard}>
            <Card.Content>
              {/* Pet Selection */}
              {userPets.length > 0 && (
                <View style={styles.petsSection}>
                  <Text style={styles.sectionLabel}>About which pet?</Text>
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
                </View>
              )}
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
            onPress={handleSavePost}
            style={styles.saveButton}
            disabled={isSaving || isUploading}
            loading={isSaving}
          >
            {isEditMode ? 'Update Post' : 'Share Post'}
          </Button>
        </View>

        {/* Upload Progress */}
        {isUploading && (
          <View style={styles.uploadProgress}>
            <ActivityIndicator size="small" color="#0a7ea4" />
            <Text style={styles.uploadText}>Uploading media...</Text>
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
  segmentedButtons: {
    marginBottom: 8,
  },
  typeDescription: {
    fontSize: 12,
    opacity: 0.6,
    marginTop: 4,
    textAlign: 'center',
  },
  visibilityDescription: {
    fontSize: 12,
    opacity: 0.6,
    marginTop: 4,
    textAlign: 'center',
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
  templatesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
    gap: 8,
  },
  templateChip: {
    marginRight: 8,
    marginBottom: 8,
  },
  detailsCard: {
    backgroundColor: '#f8f9fa',
    marginBottom: 16,
  },
  mediaContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  mediaPreview: {
    width: '100%',
    height: 200,
    borderRadius: 8,
  },
  videoPreview: {
    width: '100%',
    height: 200,
    backgroundColor: '#000',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoLabel: {
    color: '#fff',
    marginTop: 8,
  },
  removeMediaButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'white',
    borderRadius: 20,
  },
  mediaButton: {
    marginBottom: 8,
  },
  petsSection: {
    marginBottom: 16,
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: '500',
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
  uploadProgress: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
    padding: 12,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
  },
  uploadText: {
    marginLeft: 8,
    fontSize: 14,
    opacity: 0.7,
  },
});