import { supabase } from './config';
import * as FileSystem from 'expo-file-system';
import { decode } from 'base64-arraybuffer';
import { Platform } from 'react-native';

/**
 * Upload an image to Supabase Storage
 * @param {string|File} uri - The local URI (mobile) or File object (web)
 * @param {string} fileName - Optional name for the file (default: random UUID)
 * @returns {Promise<string>} The public URL of the uploaded image
 */
export const uploadImage = async (imageData) => {
  try {
    console.log('uploadImage called with:', imageData);
    
    if (Platform.OS === 'web') {
      return await uploadImageWeb(imageData);
    } else {
      return await uploadImageMobile(imageData);
    }
  } catch (error) {
    console.error('Error in upload process:', error);
    return null;
  }
};

const uploadImageWeb = async (uri) => {
  try {
    console.log('uploadImageWeb called with URI:', uri);
    
    if (!uri) {
      console.error('No URI provided for web upload');
      return null;
    }
    
    // Check if it's a base64 data URI
    if (uri.startsWith('data:')) {
      // Extract the base64 part
      const base64Data = uri.split(',')[1];
      const mimeType = uri.match(/data:([^;]+)/)[1];
      
      // Convert base64 to blob
      const byteCharacters = atob(base64Data);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: mimeType });
      
      // Get file extension from mime type
      const fileExtension = mimeType.split('/')[1] || 'jpg';
      const fileName = `${Date.now()}.${fileExtension}`;
      
      console.log("Uploading file:", fileName, "Type:", mimeType);
      
      // Upload the blob directly
      const { data, error } = await supabase.storage
        .from('farmfit')
        .upload(`profile/${fileName}`, blob, {
          contentType: mimeType,
          upsert: true
        });
      
      if (error) {
        console.error('Error uploading:', error);
        return null;
      }
      
      const { data: publicUrlData } = supabase.storage
        .from('farmfit')
        .getPublicUrl(`profile/${fileName}`);
      
      console.log("Upload successful, URL:", publicUrlData);
      return publicUrlData.publicUrl;
    } else {
      console.error('Expected base64 data URI on web, got:', uri);
      return null;
    }
  } catch (error) {
    console.error('Error in web upload process:', error);
    return null;
  }
};

const uploadImageMobile = async (uri) => {
  try {
    console.log('uploadImageMobile called with URI:', uri);
    
    if (!uri) {
      console.error('No URI provided for mobile upload');
      return null;
    }
    
    const fileExtension = uri.split('.').pop();
    const fileName = `${Date.now()}.${fileExtension}`;
    
    const fileInfo = await FileSystem.getInfoAsync(uri);
    if (!fileInfo.exists) {
      console.error("File doesn't exist");
      return null;
    }
    
    const base64 = await FileSystem.readAsStringAsync(uri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    
    const arrayBuffer = decode(base64);
    
    console.log("Uploading file:", fileName);
    
    const { data, error } = await supabase.storage
      .from('farmfit')
      .upload(`profile/${fileName}`, arrayBuffer, {
        contentType: `image/${fileExtension}`,
        upsert: true
      });
    
    if (error) {
      console.error('Error uploading:', error);
      return null;
    }
    
    const { data: publicUrlData } = supabase.storage
      .from('farmfit')
      .getPublicUrl(`profile/${fileName}`);
    
    console.log("Upload successful, URL:", publicUrlData);
    return publicUrlData.publicUrl;
  } catch (error) {
    console.error('Error in mobile upload process:', error);
    return null;
  }
};

/**
 * Delete an image from Supabase Storage
 * @param {string} url - The public URL of the image
 * @returns {Promise<boolean>} Success status
 */
export const deleteImage = async (url) => {
  try {
    // Check if this is a Supabase storage URL
    if (!url.includes('farmfit/') || !url.includes(supabase.storage.url)) {
      console.log('Skipping deletion of external URL:', url);
      return true; // Return true to indicate "successful" handling
    }
    
    // Extract the path from the URL
    const path = url.split('farmfit/')[1];
    
    if (!path) {
      console.error('Invalid URL format for Supabase storage');
      return false;
    }
    
    const { error } = await supabase.storage
      .from('farmfit')
      .remove([path]);
    
    if (error) {
      console.error('Error deleting:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error in delete process:', error);
    return false;
  }
};