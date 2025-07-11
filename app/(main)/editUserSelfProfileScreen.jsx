// app/(main)/(screens)/editProfileScreen.jsx
import React, { useState, useEffect } from 'react';
import { ScrollView, StyleSheet, View, ActivityIndicator, Alert } from 'react-native';
import { 
  TextInput, 
  Avatar
} from 'react-native-paper';
import { useLocalSearchParams, router } from 'expo-router';
import { ThemedView } from '@/components/themes/ThemedView';
import { ThemedText } from '@/components/themes/ThemedText';
import { ThemedCard } from '@/components/themes/ThemedCard';
import { ThemedButton } from '@/components/themes/ThemedButton';
import { useTheme } from '@/contexts/ThemeContext';
import { useInputColors, useActivityIndicatorColors } from '@/hooks/useThemeColor';
import { useAuth } from '@/contexts/AuthContext';
import ImagePicker from '@/components/interfaces/ImagePicker';
import { uploadImage, deleteImage } from '@/services/supabase';

export default function EditProfileScreen() {
  const { userId } = useLocalSearchParams();
  const { colors, isDark } = useTheme();
  const inputColors = useInputColors();
  const activityIndicatorColors = useActivityIndicatorColors();
  const { user: currentUser, userData, updateUserData } = useAuth();
  
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  
  // Form fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [bio, setBio] = useState('');
  const [location, setLocation] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [profilePicture, setProfilePicture] = useState(null);
  const [originalPicture, setOriginalPicture] = useState(null);
  
  useEffect(() => {
    // Populate form with current user data
    if (userData) {
      setName(userData.name || '');
      setEmail(userData.email || '');
      setBio(userData.bio || '');
      setLocation(userData.location || '');
      setPhoneNumber(userData.phone_number || '');
      setProfilePicture(userData.picture || null);
      setOriginalPicture(userData.picture || null);
    } else if (currentUser) {
      // Fallback to Auth0 data
      setName(currentUser.name || '');
      setEmail(currentUser.email || '');
      setProfilePicture(currentUser.picture || null);
      setOriginalPicture(currentUser.picture || null);
    }
  }, [userData, currentUser]);
  
  const handleSaveProfile = async () => {
  // Validation
  if (!name.trim()) {
    Alert.alert('Validation Error', 'Name is required');
    return;
  }
  
  if (!email.trim()) {
    Alert.alert('Validation Error', 'Email is required');
    return;
  }
  
  setSaving(true);
  let imageUrl = originalPicture; // Default to original picture
  let imageUploadSuccess = false;
  
  try {
    // Handle image upload if picture changed
    if (profilePicture && profilePicture !== originalPicture) {
      console.log('Image changed, starting upload process...');
      console.log('Original picture:', originalPicture);
      console.log('New picture:', profilePicture);
      
      setIsUploading(true);
      
      try {
        // Upload new image
        const uploadedUrl = await uploadImage(profilePicture);
        console.log('Upload result:', uploadedUrl);
        
        // Validate the upload result
        if (!uploadedUrl || typeof uploadedUrl !== 'string') {
          throw new Error('Image upload failed - no URL returned');
        }
        
        if (!uploadedUrl.startsWith('https://')) {
          throw new Error('Image upload returned invalid URL format');
        }
        
        // Upload successful
        imageUrl = uploadedUrl;
        imageUploadSuccess = true;
        console.log('Image upload successful. New URL:', imageUrl);
        
      } catch (uploadError) {
        console.error('Image upload error:', uploadError);
        setIsUploading(false);
        Alert.alert('Upload Error', 'Failed to upload image. Please try again.');
        return; // Stop execution if upload fails
      }
      
      setIsUploading(false);
    }
    
    // Prepare update data
    const updateData = {
      name: name.trim(),
      email: email.trim(),
      bio: bio.trim() || null,
      location: location.trim() || null,
      phone_number: phoneNumber.trim() || null,
      picture: imageUrl, // This will be the new uploaded URL or original
      updated_at: new Date().toISOString(),
    };
    
    console.log('Updating user profile with data:', updateData);
    
    // Update in Supabase using the AuthContext function
    const result = await updateUserData(updateData);
    console.log('Database update result:', result);
    
    if (result) {
      console.log('Profile update successful');
      
      // Only delete old image after successful database update
      // and only if it's a Supabase storage URL
      if (imageUploadSuccess && originalPicture) {
        console.log('Attempting to delete old image:', originalPicture);
        
        // Check if the original picture is from Supabase storage
        if (originalPicture.includes('supabase.co/storage') && originalPicture.includes('farmfit/')) {
          try {
            const deleteResult = await deleteImage(originalPicture);
            console.log('Old image deletion result:', deleteResult);
          } catch (deleteError) {
            console.warn('Failed to delete old image (non-critical):', deleteError);
            // Don't fail the entire operation if old image deletion fails
          }
        } else {
          console.log('Skipping deletion of external image (Auth0/Google):', originalPicture);
        }
      }
      
      Alert.alert(
        'Success', 
        'Profile updated successfully!',
        [
          {
            text: 'OK',
            onPress: () => router.back()
          }
        ]
      );
    } else {
      throw new Error('Database update failed - no result returned');
    }
    
  } catch (error) {
    console.error('Error updating profile:', error);
    
    // If database update failed but image was uploaded, we should clean up the uploaded image
    if (imageUploadSuccess && imageUrl !== originalPicture) {
      console.log('Cleaning up uploaded image due to profile update failure...');
      try {
        await deleteImage(imageUrl);
      } catch (cleanupError) {
        console.warn('Failed to cleanup uploaded image:', cleanupError);
      }
    }
    
    Alert.alert(
      'Error', 
      `Failed to update profile: ${error.message || 'Please try again.'}`
    );
  } finally {
    setSaving(false);
    setIsUploading(false);
  }
};

  const dynamicStyles = createDynamicStyles(colors, inputColors);
  
  if (loading) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator 
            size="large" 
            color={activityIndicatorColors.primary} 
          />
          <ThemedText style={[styles.loadingText, { color: colors.textSecondary }]}>
            Loading profile...
          </ThemedText>
        </View>
      </ThemedView>
    );
  }
  
  return (
    <ThemedView style={styles.container}>
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <ThemedText type="title" style={styles.title}>
          Edit Profile
        </ThemedText>
        
        {/* Profile Picture Section */}
        <ThemedCard variant="elevated" style={styles.pictureCard}>
          <View style={styles.cardHeader}>
            <ThemedText type="defaultSemiBold" style={styles.cardTitle}>
              Profile Picture
            </ThemedText>
          </View>
          <View style={styles.cardContent}>
            <ImagePicker
              mode="profile"
              images={profilePicture}
              onImagesSelected={setProfilePicture}
              isUploading={isUploading}
              placeholder="Tap to add profile picture"
              style={styles.profileImagePicker}
            />
            {isUploading && (
              <View style={styles.uploadingContainer}>
                <ActivityIndicator 
                  size="small" 
                  color={activityIndicatorColors.primary} 
                />
                <ThemedText style={[styles.uploadingText, { color: colors.textSecondary }]}>
                  Uploading image...
                </ThemedText>
              </View>
            )}
          </View>
        </ThemedCard>
        
        {/* Basic Information */}
        <ThemedCard variant="elevated" style={styles.infoCard}>
          <View style={styles.cardHeader}>
            <ThemedText type="defaultSemiBold" style={styles.cardTitle}>
              Basic Information
            </ThemedText>
          </View>
          <View style={styles.cardContent}>
            <TextInput
              label="Full Name *"
              value={name}
              onChangeText={setName}
              style={[styles.input, dynamicStyles.input]}
              mode="outlined"
              outlineColor={inputColors.border}
              activeOutlineColor={inputColors.borderFocused}
              textColor={inputColors.text}
              placeholderTextColor={inputColors.placeholder}
            />
            
            <TextInput
              label="Email Address *"
              value={email}
              onChangeText={setEmail}
              style={[styles.input, dynamicStyles.input]}
              mode="outlined"
              keyboardType="email-address"
              autoCapitalize="none"
              outlineColor={inputColors.border}
              activeOutlineColor={inputColors.borderFocused}
              textColor={inputColors.text}
              placeholderTextColor={inputColors.placeholder}
            />
            
            <TextInput
              label="Phone Number"
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              style={[styles.input, dynamicStyles.input]}
              mode="outlined"
              keyboardType="phone-pad"
              outlineColor={inputColors.border}
              activeOutlineColor={inputColors.borderFocused}
              textColor={inputColors.text}
              placeholderTextColor={inputColors.placeholder}
            />
            
            <TextInput
              label="Location"
              value={location}
              onChangeText={setLocation}
              style={[styles.input, dynamicStyles.input]}
              mode="outlined"
              placeholder="City, Country"
              outlineColor={inputColors.border}
              activeOutlineColor={inputColors.borderFocused}
              textColor={inputColors.text}
              placeholderTextColor={inputColors.placeholder}
            />
            
            <TextInput
              label="Bio"
              value={bio}
              onChangeText={setBio}
              style={[styles.input, styles.bioInput, dynamicStyles.input]}
              mode="outlined"
              multiline
              numberOfLines={3}
              placeholder="Tell others about yourself..."
              outlineColor={inputColors.border}
              activeOutlineColor={inputColors.borderFocused}
              textColor={inputColors.text}
              placeholderTextColor={inputColors.placeholder}
            />
          </View>
        </ThemedCard>
        
        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          <ThemedButton 
            variant="outlined" 
            onPress={() => router.back()}
            style={styles.cancelButton}
            disabled={saving || isUploading}
          >
            Cancel
          </ThemedButton>
          
          <ThemedButton 
            variant="primary" 
            onPress={handleSaveProfile}
            style={styles.saveButton}
            disabled={saving || isUploading}
            loading={saving}
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </ThemedButton>
        </View>
        
        {/* Status Indicator */}
        {(saving || isUploading) && (
          <View style={styles.statusContainer}>
            <ActivityIndicator 
              size="small" 
              color={activityIndicatorColors.primary} 
            />
            <ThemedText style={[styles.statusText, { color: colors.textSecondary }]}>
              {isUploading ? 'Uploading image...' : 'Saving profile...'}
            </ThemedText>
          </View>
        )}
      </ScrollView>
    </ThemedView>
  );
}

// Create dynamic styles that respond to theme changes
const createDynamicStyles = (colors, inputColors) => StyleSheet.create({
  input: {
    backgroundColor: inputColors.background,
  },
});

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
    marginTop: 16,
    fontSize: 16,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  title: {
    marginBottom: 24,
    textAlign: 'center',
  },
  pictureCard: {
    marginBottom: 16,
  },
  infoCard: {
    marginBottom: 24,
  },
  cardHeader: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  cardTitle: {
    fontSize: 16,
  },
  cardContent: {
    padding: 16,
    paddingTop: 8,
  },
  profileImagePicker: {
    height: 140,
    marginVertical: 8,
  },
  uploadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  uploadingText: {
    marginLeft: 8,
    fontSize: 14,
  },
  input: {
    marginBottom: 16,
  },
  bioInput: {
    minHeight: 80,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
    gap: 12,
  },
  saveButton: {
    flex: 1,
    borderRadius: 8,
  },
  cancelButton: {
    flex: 1,
    borderRadius: 8,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    padding: 12,
  },
  statusText: {
    marginLeft: 8,
    fontSize: 14,
  },
});