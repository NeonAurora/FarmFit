// services/imagePickerService.js
import * as ExpoImagePicker from 'expo-image-picker';
import { Platform, Alert } from 'react-native';

/**
 * Comprehensive Image Picker Service
 * Handles all image/media picking scenarios across the app
 */

export const ImagePickerService = {
  /**
   * Pick a single image
   * @param {Object} options - Configuration options
   * @returns {Promise<string|null>} - Returns image URI or null
   */
  pickSingleImage: async (options = {}) => {
    const {
      quality = 0.7,
      allowsEditing = true,
      aspect,
      showAlert = true,
      permissionMessage = "Please allow access to your photos."
    } = options;

    try {
      // Request permissions (only needed on mobile)
      if (Platform.OS !== 'web') {
        const { status } = await ExpoImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          if (showAlert) {
            Alert.alert('Permission Required', permissionMessage);
          }
          return null;
        }
      }

      // Launch picker
      const result = await ExpoImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality,
        allowsEditing,
        aspect,
        allowsMultipleSelection: false,
      });

      // Handle selection
      if (!result.canceled && result.assets?.length > 0) {
        return result.assets[0].uri;
      }
      
      return null;
    } catch (error) {
      console.error('Error picking single image:', error);
      return null;
    }
  },

  /**
   * Pick multiple images
   * @param {Object} options - Configuration options
   * @returns {Promise<string[]>} - Returns array of image URIs
   */
  pickMultipleImages: async (options = {}) => {
    const {
      quality = 0.7,
      selectionLimit = 5,
      showAlert = true,
      permissionMessage = "Please allow access to your photos."
    } = options;

    try {
      // Request permissions (only needed on mobile)
      if (Platform.OS !== 'web') {
        const { status } = await ExpoImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          if (showAlert) {
            Alert.alert('Permission Required', permissionMessage);
          }
          return [];
        }
      }

      // Launch picker
      const result = await ExpoImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality,
        allowsEditing: false, // Disable editing for multiple selection
        allowsMultipleSelection: true,
        selectionLimit,
      });

      // Handle selection
      if (!result.canceled && result.assets?.length > 0) {
        return result.assets.map(asset => asset.uri);
      }
      
      return [];
    } catch (error) {
      console.error('Error picking multiple images:', error);
      return [];
    }
  },

  /**
   * Pick media (images and/or videos)
   * @param {Object} options - Configuration options
   * @returns {Promise<string|null>} - Returns media URI or null
   */
  pickMedia: async (options = {}) => {
    const {
      quality = 0.8,
      allowsEditing = true,
      aspect,
      includeVideos = false,
      showAlert = true,
      permissionMessage = "Please allow access to your photos and videos."
    } = options;

    try {
      // Request permissions (only needed on mobile)
      if (Platform.OS !== 'web') {
        const { status } = await ExpoImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          if (showAlert) {
            Alert.alert('Permission Required', permissionMessage);
          }
          return null;
        }
      }

      // Determine media types
      let mediaTypes = ['images'];
      if (includeVideos) {
        mediaTypes.push('videos');
      }

      // Launch picker
      const result = await ExpoImagePicker.launchImageLibraryAsync({
        mediaTypes,
        quality,
        allowsEditing,
        aspect,
        allowsMultipleSelection: false,
      });

      // Handle selection
      if (!result.canceled && result.assets?.length > 0) {
        return result.assets[0].uri;
      }
      
      return null;
    } catch (error) {
      console.error('Error picking media:', error);
      return null;
    }
  },

  /**
   * Pick profile picture (optimized for profile images)
   * @param {Object} options - Configuration options
   * @returns {Promise<string|null>} - Returns image URI or null
   */
  pickProfilePicture: async (options = {}) => {
    return await ImagePickerService.pickSingleImage({
      quality: 0.8,
      allowsEditing: true,
      aspect: [1, 1], // Square aspect ratio for profile pictures
      permissionMessage: "Please allow access to your photos to update your profile picture.",
      ...options
    });
  },

  /**
   * Pick pet photo (optimized for pet images)
   * @param {Object} options - Configuration options
   * @returns {Promise<string|null>} - Returns image URI or null
   */
  pickPetPhoto: async (options = {}) => {
    return await ImagePickerService.pickSingleImage({
      quality: 0.7,
      allowsEditing: true,
      permissionMessage: "Please allow access to your photos to add a pet picture.",
      ...options
    });
  },

  /**
   * Pick cover photo (optimized for cover images)
   * @param {Object} options - Configuration options
   * @returns {Promise<string|null>} - Returns image URI or null
   */
  pickCoverPhoto: async (options = {}) => {
    return await ImagePickerService.pickSingleImage({
      quality: 0.8,
      allowsEditing: true,
      aspect: [16, 9], // Widescreen aspect ratio for cover photos
      permissionMessage: "Please allow access to your photos to add a cover picture.",
      ...options
    });
  },

  /**
   * Pick journal photos (multiple images for journal entries)
   * @param {Object} options - Configuration options
   * @returns {Promise<string[]>} - Returns array of image URIs
   */
  pickJournalPhotos: async (options = {}) => {
    return await ImagePickerService.pickMultipleImages({
      quality: 0.7,
      selectionLimit: 5,
      permissionMessage: "Please allow access to your photos to add images to your journal.",
      ...options
    });
  },

  /**
   * Pick post media (supports images and videos for social posts)
   * @param {string} postType - Type of post ('image', 'video', 'mixed')
   * @param {Object} options - Configuration options
   * @returns {Promise<string|null>} - Returns media URI or null
   */
  pickPostMedia: async (postType = 'image', options = {}) => {
    const includeVideos = postType === 'video' || postType === 'mixed';
    const aspect = postType === 'image' ? [16, 9] : undefined;

    return await ImagePickerService.pickMedia({
      quality: 0.8,
      allowsEditing: true,
      aspect,
      includeVideos,
      permissionMessage: "Please allow access to your photos and videos.",
      ...options
    });
  },

  /**
   * Get full asset information (useful for getting additional metadata)
   * @param {Object} options - Configuration options
   * @returns {Promise<Object|null>} - Returns full asset object or null
   */
  pickImageWithAsset: async (options = {}) => {
    const {
      quality = 0.7,
      allowsEditing = true,
      aspect,
      showAlert = true,
      permissionMessage = "Please allow access to your photos."
    } = options;

    try {
      // Request permissions (only needed on mobile)
      if (Platform.OS !== 'web') {
        const { status } = await ExpoImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          if (showAlert) {
            Alert.alert('Permission Required', permissionMessage);
          }
          return null;
        }
      }

      // Launch picker
      const result = await ExpoImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality,
        allowsEditing,
        aspect,
        allowsMultipleSelection: false,
      });

      // Handle selection
      if (!result.canceled && result.assets?.length > 0) {
        return result.assets[0]; // Return full asset object
      }
      
      return null;
    } catch (error) {
      console.error('Error picking image with asset:', error);
      return null;
    }
  }
};

/**
 * Legacy function names for backwards compatibility
 * You can use these if you prefer the old naming convention
 */
export const pickSingleImage = ImagePickerService.pickSingleImage;
export const pickMultipleImages = ImagePickerService.pickMultipleImages;
export const pickMedia = ImagePickerService.pickMedia;
export const pickProfilePicture = ImagePickerService.pickProfilePicture;
export const pickPetPhoto = ImagePickerService.pickPetPhoto;
export const pickCoverPhoto = ImagePickerService.pickCoverPhoto;
export const pickJournalPhotos = ImagePickerService.pickJournalPhotos;
export const pickPostMedia = ImagePickerService.pickPostMedia;

export default ImagePickerService;