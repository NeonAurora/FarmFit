import { supabase } from './config';
import * as FileSystem from 'expo-file-system';
import { decode } from 'base64-arraybuffer';

/**
 * Upload an image to Supabase Storage
 * @param {string} uri - The local URI of the image
 * @param {string} fileName - Optional name for the file (default: random UUID)
 * @returns {Promise<string>} The public URL of the uploaded image
 */
export const uploadImage = async (uri) => {
    try {
      // Extract file extension from the uri
      const fileExtension = uri.split('.').pop();
      
      // Generate a unique filename
      const fileName = `${Date.now()}.${fileExtension}`;
      
      // Read the file as base64
      const fileInfo = await FileSystem.getInfoAsync(uri);
      if (!fileInfo.exists) {
        console.error("File doesn't exist");
        return null;
      }
      
      const base64 = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      
      // Convert to ArrayBuffer
      const arrayBuffer = decode(base64);
      
      console.log("Uploading file:", fileName);
      
      // Upload to Supabase
      const { data, error } = await supabase.storage
        .from('quiz-images')
        .upload(`questions/${fileName}`, arrayBuffer, {
          contentType: `image/${fileExtension}`,
          upsert: true
        });
      
      if (error) {
        console.error('Error uploading:', error);
        return null;
      }
      
      // Get the public URL
      const { data: publicUrlData } = supabase.storage
        .from('quiz-images')
        .getPublicUrl(`questions/${fileName}`);
      
      console.log("Upload successful, URL:", publicUrlData);
      return publicUrlData.publicUrl;
    } catch (error) {
      console.error('Error in upload process:', error);
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
    // Extract the path from the URL
    const path = url.split('quiz-images/')[1];
    
    if (!path) {
      console.error('Invalid URL format');
      return false;
    }
    
    const { error } = await supabase.storage
      .from('quiz-images')
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