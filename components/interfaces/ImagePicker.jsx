// components/interfaces/ImagePicker.jsx
import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ActivityIndicator, ScrollView } from 'react-native';
import { IconButton } from 'react-native-paper';
import { useColorScheme } from 'react-native';
import { ImagePickerService } from '@/services/imagePickerService';

export default function ImagePicker({ 
  // Core props
  mode = 'single', // 'single', 'multiple', 'profile', 'pet', 'cover', 'journal', 'post'
  images = null, // For single: string URI, For multiple: array of URIs
  onImagesSelected,
  isUploading = false,
  
  // Customization
  placeholder = "Tap to add an image",
  maxImages = 5,
  postType = 'image', // For post mode
  style,
  imageStyle,
  
  // Service options (passed to ImagePickerService)
  options = {}
}) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  // Normalize images to always be an array for easier handling
  const imageArray = Array.isArray(images) ? images : (images ? [images] : []);
  const isMultipleMode = mode === 'multiple' || mode === 'journal';

  const handlePickImages = async () => {
    if (isUploading) return;
    
    let result = null;
    
    // Route to the appropriate service method based on mode
    switch (mode) {
      case 'profile':
        result = await ImagePickerService.pickProfilePicture(options);
        break;
      case 'pet':
        result = await ImagePickerService.pickPetPhoto(options);
        break;
      case 'cover':
        result = await ImagePickerService.pickCoverPhoto(options);
        break;
      case 'journal':
        result = await ImagePickerService.pickJournalPhotos({ 
          selectionLimit: maxImages, 
          ...options 
        });
        break;
      case 'post':
        result = await ImagePickerService.pickPostMedia(postType, options);
        break;
      case 'multiple':
        result = await ImagePickerService.pickMultipleImages({ 
          selectionLimit: maxImages, 
          ...options 
        });
        break;
      case 'single':
      default:
        result = await ImagePickerService.pickSingleImage(options);
        break;
    }
    
    if (result && onImagesSelected) {
      // For single modes, wrap in array for consistency, then unwrap when calling callback
      if (isMultipleMode) {
        onImagesSelected(result);
      } else {
        onImagesSelected(result);
      }
    }
  };

  const removeImage = (index) => {
    if (!onImagesSelected) return;
    
    if (isMultipleMode) {
      const newImages = imageArray.filter((_, i) => i !== index);
      onImagesSelected(newImages);
    } else {
      onImagesSelected(null);
    }
  };

  if (isMultipleMode) {
    return (
      <View style={[styles.container, style]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {/* Existing images */}
          {imageArray.map((image, index) => (
            <View key={index} style={styles.multipleImageContainer}>
              <Image 
                source={{ uri: image }} 
                style={[styles.multipleImage, imageStyle]} 
                resizeMode="cover"
              />
              <IconButton
                icon="close-circle"
                size={20}
                onPress={() => removeImage(index)}
                style={styles.removeButton}
                iconColor="#E74C3C"
              />
            </View>
          ))}
          
          {/* Add button */}
          {imageArray.length < maxImages && (
            <TouchableOpacity 
              style={[styles.addImageButton, isDark && styles.addImageButtonDark]}
              onPress={handlePickImages}
              disabled={isUploading}
            >
              <Text style={[styles.addImageText, isDark && styles.textLight]}>
                + Add
              </Text>
            </TouchableOpacity>
          )}
        </ScrollView>
        
        {isUploading && (
          <View style={styles.uploadingOverlay}>
            <ActivityIndicator size="large" color="#0a7ea4" />
            <Text style={styles.uploadingText}>Uploading...</Text>
          </View>
        )}
      </View>
    );
  }

  // Single image mode
  return (
    <TouchableOpacity 
      style={[styles.imageSelector, isDark && styles.imageSelectorDark, style]}
      onPress={handlePickImages}
      disabled={isUploading}
    >
      {imageArray.length > 0 ? (
        <>
          <Image 
            source={{ uri: imageArray[0] }} 
            style={[styles.previewImage, imageStyle]} 
            resizeMode="cover"
          />
          <IconButton
            icon="close-circle"
            size={24}
            onPress={() => removeImage(0)}
            style={styles.singleRemoveButton}
            iconColor="#E74C3C"
          />
        </>
      ) : (
        <View style={styles.imagePickerPlaceholder}>
          <Text style={[styles.imagePickerText, isDark && styles.textLight]}>
            {placeholder}
          </Text>
        </View>
      )}
      
      {isUploading && (
        <View style={styles.uploadingOverlay}>
          <ActivityIndicator size="large" color="#0a7ea4" />
          <Text style={styles.uploadingText}>Uploading...</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  imageSelector: {
    height: 160,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    marginBottom: 16,
    overflow: 'hidden',
    backgroundColor: '#f9f9f9',
    position: 'relative',
  },
  imageSelectorDark: {
    borderColor: '#444',
    backgroundColor: '#333',
  },
  imagePickerPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imagePickerText: {
    color: '#888',
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  textLight: {
    color: '#eee',
  },
  uploadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  uploadingText: {
    color: 'white',
    marginTop: 10,
    fontWeight: '500',
  },
  singleRemoveButton: {
    position: 'absolute',
    top: 5,
    right: 5,
    backgroundColor: 'rgba(255,255,255,0.9)',
    margin: 0,
  },
  // Multiple images styles
  multipleImageContainer: {
    position: 'relative',
    marginRight: 10,
  },
  multipleImage: {
    width: 100,
    height: 100,
    borderRadius: 8,
  },
  removeButton: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: 'rgba(255,255,255,0.9)',
    margin: 0,
  },
  addImageButton: {
    width: 100,
    height: 100,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
  },
  addImageButtonDark: {
    borderColor: '#444',
    backgroundColor: '#333',
  },
  addImageText: {
    color: '#888',
    fontSize: 16,
  },
});