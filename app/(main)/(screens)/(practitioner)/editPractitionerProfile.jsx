// app/(main)/(screens)/(practitioner)/editPractitionerProfile.jsx
import React, { useState, useEffect } from 'react';
import { ScrollView, StyleSheet, View, Alert, ActivityIndicator } from 'react-native';
import { 
  Card, 
  Text, 
  TextInput, 
  Button,
  Divider
} from 'react-native-paper';
import { ThemedView } from '@/components/themes/ThemedView';
import { useColorScheme } from '@/hooks/useColorScheme.native';
import { useAuth } from '@/contexts/AuthContext';
import { router } from 'expo-router';
import ImagePicker from '@/components/interfaces/ImagePicker';
import { uploadImage, deleteImage } from '@/services/supabase/';
import { 
  getPractitionerProfileByUserId, 
  updatePractitionerProfileData,
  checkBVCRegistrationExists
} from '@/services/supabase';

export default function EditPractitionerProfileScreen() {
  const colorScheme = useColorScheme();
  const { user } = useAuth();
  const isDark = colorScheme === 'dark';

  // Form state
  const [fullName, setFullName] = useState('');
  const [designation, setDesignation] = useState('');
  const [degreesCertificates, setDegreesCertificates] = useState('');
  const [bvcRegistrationNumber, setBvcRegistrationNumber] = useState('');
  const [areasOfExpertise, setAreasOfExpertise] = useState('');
  const [chamberAddress, setChamberAddress] = useState('');
  const [subDistrict, setSubDistrict] = useState('');
  const [district, setDistrict] = useState('');
  const [contactInfo, setContactInfo] = useState('');
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [profilePhoto, setProfilePhoto] = useState(null);

  // Original data for comparison
  const [originalProfile, setOriginalProfile] = useState(null);
  const [originalPhoto, setOriginalPhoto] = useState(null);

  // UI states
  const [loading, setLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});

  useEffect(() => {
    fetchProfile();
  }, [user]);

  const fetchProfile = async () => {
    if (!user?.sub) {
      Alert.alert('Error', 'User not authenticated');
      router.back();
      return;
    }

    try {
      setLoading(true);
      const result = await getPractitionerProfileByUserId(user.sub);
      
      if (result.success && result.data) {
        const profile = result.data;
        setOriginalProfile(profile);
        
        // Populate form with current data
        setFullName(profile.full_name || '');
        setDesignation(profile.designation || '');
        setDegreesCertificates(profile.degrees_certificates || '');
        setBvcRegistrationNumber(profile.bvc_registration_number || '');
        setAreasOfExpertise(profile.areas_of_expertise || '');
        setChamberAddress(profile.chamber_address || '');
        setSubDistrict(profile.sub_district || '');
        setDistrict(profile.district || '');
        setContactInfo(profile.contact_info || '');
        setWhatsappNumber(profile.whatsapp_number || '');
        setProfilePhoto(profile.profile_photo_url);
        setOriginalPhoto(profile.profile_photo_url);
      } else {
        Alert.alert('Error', 'Profile not found');
        router.back();
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      Alert.alert('Error', 'Failed to load profile');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const validateForm = async () => {
    const errors = {};

    // Basic validation
    if (!fullName.trim()) errors.fullName = 'Full name is required';
    if (!designation.trim()) errors.designation = 'Designation is required';
    if (!degreesCertificates.trim()) errors.degreesCertificates = 'Degrees/certificates are required';
    if (!bvcRegistrationNumber.trim()) {
      errors.bvcRegistrationNumber = 'BVC registration number is required';
    } else if (bvcRegistrationNumber !== originalProfile.bvc_registration_number) {
      // Only check uniqueness if BVC number changed
      const exists = await checkBVCRegistrationExists(bvcRegistrationNumber, user.sub);
      if (exists) {
        errors.bvcRegistrationNumber = 'This BVC registration number is already registered';
      }
    }
    if (!areasOfExpertise.trim()) errors.areasOfExpertise = 'Areas of expertise are required';
    if (!chamberAddress.trim()) errors.chamberAddress = 'Chamber address is required';
    if (!subDistrict.trim()) errors.subDistrict = 'Sub-district is required';
    if (!district.trim()) errors.district = 'District is required';
    if (!contactInfo.trim()) errors.contactInfo = 'Contact information is required';

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = async () => {
    const isValid = await validateForm();
    if (!isValid) return;

    setIsSaving(true);
    let imageUrl = originalPhoto; // Default to original photo

    try {
      // Handle image upload if changed
      if (profilePhoto && profilePhoto !== originalPhoto) {
        setIsUploading(true);
        
        // Upload new image
        imageUrl = await uploadImage(profilePhoto);
        
        // Delete old image if it exists and upload was successful
        if (originalPhoto && imageUrl) {
          await deleteImage(originalPhoto);
        }
        
        setIsUploading(false);
      }

      // Prepare update data
      const updateData = {
        full_name: fullName.trim(),
        designation: designation.trim(),
        degrees_certificates: degreesCertificates.trim(),
        bvc_registration_number: bvcRegistrationNumber.trim(),
        areas_of_expertise: areasOfExpertise.trim(),
        chamber_address: chamberAddress.trim(),
        sub_district: subDistrict.trim(),
        district: district.trim(),
        contact_info: contactInfo.trim(),
        whatsapp_number: whatsappNumber.trim() || null,
        profile_photo_url: imageUrl,
        updated_at: new Date().toISOString(),
      };

      // Update in database
      const result = await updatePractitionerProfileData(user.sub, updateData);

      if (result.success && result.data) {
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
      setIsSaving(false);
      setIsUploading(false);
    }
  };

  if (loading) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#27AE60" />
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        
        {/* Header */}
        <Card style={styles.headerCard}>
          <Card.Content>
            <Text variant="headlineSmall" style={styles.title}>
              Edit Profile
            </Text>
            <Text variant="bodyMedium" style={styles.subtitle}>
              Update your professional information
            </Text>
          </Card.Content>
        </Card>

        {/* Profile Photo */}
        <Card style={styles.card}>
          <Card.Title title="Profile Photo" />
          <Card.Content>
            <ImagePicker
              mode="profile"
              images={profilePhoto}
              onImagesSelected={setProfilePhoto}
              isUploading={isUploading}
              placeholder="Tap to change profile photo"
            />
          </Card.Content>
        </Card>

        {/* Professional Information */}
        <Card style={styles.card}>
          <Card.Title title="Professional Information" />
          <Card.Content>
            <TextInput
              label="Full Name *"
              value={fullName}
              onChangeText={setFullName}
              style={styles.input}
              mode="outlined"
              error={!!validationErrors.fullName}
            />
            {validationErrors.fullName && (
              <Text style={styles.errorText}>{validationErrors.fullName}</Text>
            )}

            <TextInput
              label="Designation *"
              value={designation}
              onChangeText={setDesignation}
              style={styles.input}
              mode="outlined"
              placeholder="e.g., Veterinary Doctor"
              error={!!validationErrors.designation}
            />
            {validationErrors.designation && (
              <Text style={styles.errorText}>{validationErrors.designation}</Text>
            )}

            <TextInput
              label="Degrees/Certificates *"
              value={degreesCertificates}
              onChangeText={setDegreesCertificates}
              style={styles.input}
              mode="outlined"
              placeholder="e.g., DVM, MPH"
              error={!!validationErrors.degreesCertificates}
            />
            {validationErrors.degreesCertificates && (
              <Text style={styles.errorText}>{validationErrors.degreesCertificates}</Text>
            )}

            <TextInput
              label="BVC Registration Number *"
              value={bvcRegistrationNumber}
              onChangeText={setBvcRegistrationNumber}
              style={styles.input}
              mode="outlined"
              placeholder="e.g., 4807"
              keyboardType="numeric"
              error={!!validationErrors.bvcRegistrationNumber}
            />
            {validationErrors.bvcRegistrationNumber && (
              <Text style={styles.errorText}>{validationErrors.bvcRegistrationNumber}</Text>
            )}

            <TextInput
              label="Areas of Expertise *"
              value={areasOfExpertise}
              onChangeText={setAreasOfExpertise}
              style={styles.input}
              mode="outlined"
              placeholder="e.g., Pet Animal Medicine"
              multiline
              numberOfLines={3}
              error={!!validationErrors.areasOfExpertise}
            />
            {validationErrors.areasOfExpertise && (
              <Text style={styles.errorText}>{validationErrors.areasOfExpertise}</Text>
            )}
          </Card.Content>
        </Card>

        {/* Location & Contact */}
        <Card style={styles.card}>
          <Card.Title title="Location & Contact" />
          <Card.Content>
            <TextInput
              label="Chamber Address *"
              value={chamberAddress}
              onChangeText={setChamberAddress}
              style={styles.input}
              mode="outlined"
              placeholder="Full address of your chamber"
              multiline
              numberOfLines={3}
              error={!!validationErrors.chamberAddress}
            />
            {validationErrors.chamberAddress && (
              <Text style={styles.errorText}>{validationErrors.chamberAddress}</Text>
            )}

            <TextInput
              label="Sub-district/Thana *"
              value={subDistrict}
              onChangeText={setSubDistrict}
              style={styles.input}
              mode="outlined"
              placeholder="e.g., Khulshi"
              error={!!validationErrors.subDistrict}
            />
            {validationErrors.subDistrict && (
              <Text style={styles.errorText}>{validationErrors.subDistrict}</Text>
            )}

            <TextInput
              label="District *"
              value={district}
              onChangeText={setDistrict}
              style={styles.input}
              mode="outlined"
              placeholder="e.g., Chattogram"
              error={!!validationErrors.district}
            />
            {validationErrors.district && (
              <Text style={styles.errorText}>{validationErrors.district}</Text>
            )}

            <TextInput
              label="Primary Contact Number *"
              value={contactInfo}
              onChangeText={setContactInfo}
              style={styles.input}
              mode="outlined"
              placeholder="e.g., 01705727081"
              keyboardType="phone-pad"
              error={!!validationErrors.contactInfo}
            />
            {validationErrors.contactInfo && (
              <Text style={styles.errorText}>{validationErrors.contactInfo}</Text>
            )}

            <TextInput
              label="WhatsApp Number (Optional)"
              value={whatsappNumber}
              onChangeText={setWhatsappNumber}
              style={styles.input}
              mode="outlined"
              placeholder="WhatsApp number if different"
              keyboardType="phone-pad"
            />
          </Card.Content>
        </Card>

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          <Button
            mode="outlined"
            onPress={() => router.back()}
            style={styles.cancelButton}
            disabled={isSaving}
          >
            Cancel
          </Button>
          
          <Button
            mode="contained"
            onPress={handleSave}
            style={styles.saveButton}
            disabled={isSaving || isUploading}
            loading={isSaving}
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
  scrollView: {
    flex: 1,
    padding: 16,
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
  headerCard: {
    marginBottom: 16,
    elevation: 2,
  },
  title: {
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    textAlign: 'center',
    opacity: 0.7,
  },
  card: {
    marginBottom: 16,
    elevation: 1,
  },
  input: {
    marginBottom: 12,
  },
  errorText: {
    color: '#E74C3C',
    fontSize: 12,
    marginBottom: 12,
    marginLeft: 12,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 24,
    gap: 12,
  },
  cancelButton: {
    flex: 1,
  },
  saveButton: {
    flex: 2,
  },
});