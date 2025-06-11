// app/(main)/(screens)/editProfileScreen.jsx
import React, { useState, useEffect } from 'react';
import { ScrollView, StyleSheet, View, ActivityIndicator, Alert } from 'react-native';
import { 
  TextInput, 
  Button, 
  Text, 
  Card,
  Avatar
} from 'react-native-paper';
import * as ExpoImagePicker from 'expo-image-picker';
import { useLocalSearchParams, router } from 'expo-router';
import { ThemedView } from '@/components/ThemedView';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useAuth } from '@/contexts/AuthContext';
import ImagePicker from '@/components/interfaces/ImagePicker';
import { uploadImage, deleteImage } from '@/services/supabase/storage';

export default function EditProfileScreen() {
  const { userId } = useLocalSearchParams();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
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
  
  const handlePickImage = async () => {
    const { status } = await ExpoImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Please allow access to your photos.');
      return;
    }
  
    const result = await ExpoImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.7,
      allowsEditing: true,
      aspect: [1, 1], // Square aspect ratio for profile pictures
    });
  
    if (!result.canceled && result.assets?.length > 0) {
      setProfilePicture(result.assets[0].uri);
    }
  };
  
  const handleSaveProfile = async () => {
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
    
    try {
      // Handle image upload if picture changed
      if (profilePicture && profilePicture !== originalPicture) {
        setIsUploading(true);
        
        // Upload new image
        imageUrl = await uploadImage(profilePicture);
        
        // Delete old image if it exists and upload was successful
        if (originalPicture && imageUrl) {
          await deleteImage(originalPicture);
        }
        
        setIsUploading(false);
      }
      
      // Prepare update data
      const updateData = {
        name: name.trim(),
        email: email.trim(),
        bio: bio.trim(),
        location: location.trim(),
        phone_number: phoneNumber.trim(),
        picture: imageUrl,
        updated_at: new Date().toISOString(),
      };
      
      // Update in Supabase
      const result = await updateUserData(updateData);
      
      if (result) {
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
        throw new Error('Failed to update profile');
      }
      
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert('Error', 'Failed to update profile. Please try again.');
    } finally {
      setSaving(false);
      setIsUploading(false);
    }
  };
  
  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>Edit Profile</Text>
        
        {/* Profile Picture Section */}
        <Card style={styles.pictureCard}>
          <Card.Title title="Profile Picture" />
          <Card.Content>
            <View style={styles.pictureContainer}>
              {profilePicture ? (
                <Avatar.Image size={100} source={{ uri: profilePicture }} />
              ) : (
                <Avatar.Text 
                  size={100} 
                  label={(name?.charAt(0) || email?.charAt(0) || 'U').toUpperCase()}
                  backgroundColor={isDark ? '#444' : '#2E86DE'}
                  color="#fff"
                />
              )}
              <Button 
                mode="outlined" 
                onPress={handlePickImage}
                style={styles.changePictureButton}
                icon="camera"
              >
                Change Picture
              </Button>
            </View>
          </Card.Content>
        </Card>
        
        {/* Basic Information */}
        <Card style={styles.infoCard}>
          <Card.Title title="Basic Information" />
          <Card.Content>
            <TextInput
              label="Full Name *"
              value={name}
              onChangeText={setName}
              style={styles.input}
              mode="outlined"
            />
            
            <TextInput
              label="Email Address *"
              value={email}
              onChangeText={setEmail}
              style={styles.input}
              mode="outlined"
              keyboardType="email-address"
              autoCapitalize="none"
            />
            
            <TextInput
              label="Phone Number"
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              style={styles.input}
              mode="outlined"
              keyboardType="phone-pad"
            />
            
            <TextInput
              label="Location"
              value={location}
              onChangeText={setLocation}
              style={styles.input}
              mode="outlined"
              placeholder="City, Country"
            />
            
            <TextInput
              label="Bio"
              value={bio}
              onChangeText={setBio}
              style={styles.input}
              mode="outlined"
              multiline
              numberOfLines={3}
              placeholder="Tell others about yourself..."
            />
          </Card.Content>
        </Card>
        
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
            onPress={handleSaveProfile}
            style={styles.saveButton}
            disabled={saving || isUploading}
            loading={saving}
          >
            Save Changes
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
  pictureCard: {
    marginBottom: 16,
  },
  pictureContainer: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  changePictureButton: {
    marginTop: 16,
  },
  infoCard: {
    marginBottom: 24,
  },
  input: {
    marginBottom: 16,
    backgroundColor: "transparent",
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