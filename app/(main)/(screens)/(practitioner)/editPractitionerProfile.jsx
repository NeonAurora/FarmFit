// app/(main)/(screens)/(practitioner)/editPractitionerProfile.jsx
import React, { useState, useEffect } from 'react';
import { ScrollView, StyleSheet, View, Alert, ActivityIndicator, Dimensions } from 'react-native';
import { 
  Text, 
  TextInput, 
  Button,
  Surface,
  Divider
} from 'react-native-paper';
import { ThemedView } from '@/components/themes/ThemedView';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { router } from 'expo-router';
import ImagePicker from '@/components/interfaces/ImagePicker';
import { uploadImage, deleteImage } from '@/services/supabase/';
import { 
  getPractitionerProfileByUserId, 
  updatePractitionerProfileData,
  checkBVCRegistrationExists
} from '@/services/supabase';

const { width: screenWidth } = Dimensions.get('window');

export default function EditPractitionerProfileScreen() {
  const { colors, brandColors, isDark } = useTheme();
  const { user } = useAuth();

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

    if (!fullName.trim()) errors.fullName = 'Full name is required';
    if (!designation.trim()) errors.designation = 'Designation is required';
    if (!degreesCertificates.trim()) errors.degreesCertificates = 'Degrees/certificates are required';
    if (!bvcRegistrationNumber.trim()) {
      errors.bvcRegistrationNumber = 'BVC registration number is required';
    } else if (bvcRegistrationNumber !== originalProfile.bvc_registration_number) {
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
    let imageUrl = originalPhoto;

    try {
      if (profilePhoto && profilePhoto !== originalPhoto) {
        setIsUploading(true);
        imageUrl = await uploadImage(profilePhoto);
        
        if (originalPhoto && imageUrl) {
          await deleteImage(originalPhoto);
        }
        
        setIsUploading(false);
      }

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
          <ActivityIndicator size="large" color={colors.activityIndicator.primary} />
          <Text variant="bodyMedium" style={[styles.loadingText, { color: colors.textSecondary }]}>
            Loading profile...
          </Text>
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        
        {/* Compact Header */}
        <Surface style={[styles.header, { backgroundColor: colors.surface }]} elevation={1}>
        </Surface>

        {/* Profile Photo Section */}
        <Surface style={[styles.surface, { backgroundColor: colors.surface }]}>
          <Text variant="titleMedium" style={[styles.sectionTitle, { color: colors.text }]}>
            Profile Photo
          </Text>
          <View style={styles.photoSection}>
            <ImagePicker
              mode="profile"
              images={profilePhoto}
              onImagesSelected={setProfilePhoto}
              isUploading={isUploading}
              placeholder="Change photo"
            />
          </View>
        </Surface>

        {/* Professional Information */}
        <Surface style={[styles.surface, styles.surfaceMarginTop, { backgroundColor: colors.surface }]}>
          <Text variant="titleMedium" style={[styles.sectionTitle, { color: colors.text }]}>
            Professional Information
          </Text>
          
          <TextInput
            label="Full Name"
            value={fullName}
            onChangeText={setFullName}
            style={styles.input}
            mode="outlined"
            error={!!validationErrors.fullName}
            outlineColor={colors.border}
            activeOutlineColor={brandColors.primary}
            textColor={colors.text}
            theme={{ colors: { background: colors.input.background } }}
          />
          {validationErrors.fullName && (
            <Text variant="bodySmall" style={[styles.errorText, { color: brandColors.error }]}>
              {validationErrors.fullName}
            </Text>
          )}

          <TextInput
            label="Designation"
            value={designation}
            onChangeText={setDesignation}
            style={styles.input}
            mode="outlined"
            placeholder="e.g., Veterinary Doctor"
            error={!!validationErrors.designation}
            outlineColor={colors.border}
            activeOutlineColor={brandColors.primary}
            textColor={colors.text}
            theme={{ colors: { background: colors.input.background } }}
          />
          {validationErrors.designation && (
            <Text variant="bodySmall" style={[styles.errorText, { color: brandColors.error }]}>
              {validationErrors.designation}
            </Text>
          )}

          <TextInput
            label="Degrees/Certificates"
            value={degreesCertificates}
            onChangeText={setDegreesCertificates}
            style={styles.input}
            mode="outlined"
            placeholder="e.g., DVM, MPH"
            error={!!validationErrors.degreesCertificates}
            outlineColor={colors.border}
            activeOutlineColor={brandColors.primary}
            textColor={colors.text}
            theme={{ colors: { background: colors.input.background } }}
          />

          <TextInput
            label="BVC Registration Number"
            value={bvcRegistrationNumber}
            onChangeText={setBvcRegistrationNumber}
            style={styles.input}
            mode="outlined"
            placeholder="e.g., 4807"
            keyboardType="numeric"
            error={!!validationErrors.bvcRegistrationNumber}
            outlineColor={colors.border}
            activeOutlineColor={brandColors.primary}
            textColor={colors.text}
            theme={{ colors: { background: colors.input.background } }}
          />
          {validationErrors.bvcRegistrationNumber && (
            <Text variant="bodySmall" style={[styles.errorText, { color: brandColors.error }]}>
              {validationErrors.bvcRegistrationNumber}
            </Text>
          )}

          <TextInput
            label="Areas of Expertise"
            value={areasOfExpertise}
            onChangeText={setAreasOfExpertise}
            style={styles.input}
            mode="outlined"
            placeholder="e.g., Pet Animal Medicine"
            multiline
            numberOfLines={2}
            error={!!validationErrors.areasOfExpertise}
            outlineColor={colors.border}
            activeOutlineColor={brandColors.primary}
            textColor={colors.text}
            theme={{ colors: { background: colors.input.background } }}
          />
        </Surface>

        {/* Location Information */}
        <Surface style={[styles.surface, styles.surfaceMarginTop, { backgroundColor: colors.surface }]}>
          <Text variant="titleMedium" style={[styles.sectionTitle, { color: colors.text }]}>
            Practice Location
          </Text>
          
          <TextInput
            label="Chamber Address"
            value={chamberAddress}
            onChangeText={setChamberAddress}
            style={styles.input}
            mode="outlined"
            multiline
            numberOfLines={2}
            error={!!validationErrors.chamberAddress}
            outlineColor={colors.border}
            activeOutlineColor={brandColors.primary}
            textColor={colors.text}
            theme={{ colors: { background: colors.input.background } }}
          />

          <TextInput
            label="Sub-district/Thana"
            value={subDistrict}
            onChangeText={setSubDistrict}
            style={styles.input}
            mode="outlined"
            placeholder="e.g., Khulshi"
            error={!!validationErrors.subDistrict}
            outlineColor={colors.border}
            activeOutlineColor={brandColors.primary}
            textColor={colors.text}
            theme={{ colors: { background: colors.input.background } }}
          />

          <TextInput
            label="District"
            value={district}
            onChangeText={setDistrict}
            style={styles.input}
            mode="outlined"
            placeholder="e.g., Chattogram"
            error={!!validationErrors.district}
            outlineColor={colors.border}
            activeOutlineColor={brandColors.primary}
            textColor={colors.text}
            theme={{ colors: { background: colors.input.background } }}
          />
        </Surface>

        {/* Contact Information */}
        <Surface style={[styles.surface, styles.surfaceMarginTop, { backgroundColor: colors.surface }]}>
          <Text variant="titleMedium" style={[styles.sectionTitle, { color: colors.text }]}>
            Contact Information
          </Text>
          
          <TextInput
            label="Primary Contact Number"
            value={contactInfo}
            onChangeText={setContactInfo}
            style={styles.input}
            mode="outlined"
            placeholder="e.g., 01705727081"
            keyboardType="phone-pad"
            error={!!validationErrors.contactInfo}
            outlineColor={colors.border}
            activeOutlineColor={brandColors.primary}
            textColor={colors.text}
            theme={{ colors: { background: colors.input.background } }}
          />
          {validationErrors.contactInfo && (
            <Text variant="bodySmall" style={[styles.errorText, { color: brandColors.error }]}>
              {validationErrors.contactInfo}
            </Text>
          )}

          <TextInput
            label="WhatsApp Number (Optional)"
            value={whatsappNumber}
            onChangeText={setWhatsappNumber}
            style={styles.input}
            mode="outlined"
            placeholder="WhatsApp number if different"
            keyboardType="phone-pad"
            outlineColor={colors.border}
            activeOutlineColor={brandColors.primary}
            textColor={colors.text}
            theme={{ colors: { background: colors.input.background } }}
          />
        </Surface>

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          <Button
            mode="outlined"
            onPress={() => router.back()}
            style={[styles.button, styles.cancelButton]}
            disabled={isSaving}
            textColor={colors.textSecondary}
            theme={{ colors: { outline: colors.border } }}
          >
            Cancel
          </Button>
          
          <Button
            mode="contained"
            onPress={handleSave}
            style={[styles.button, styles.saveButton]}
            disabled={isSaving || isUploading}
            loading={isSaving}
            buttonColor={brandColors.primary}
          >
            Save
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
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 8,
  },
  title: {
    fontWeight: '600',
    marginBottom: 4,
  },
  subtitle: {
    opacity: 0.8,
  },
  surface: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: 16,
    borderRadius: 12,
    elevation: 1,
  },
  surfaceMarginTop: {
    marginTop: 12,
  },
  sectionTitle: {
    fontWeight: '600',
    marginBottom: 12,
  },
  photoSection: {
    marginBottom: 8,
  },
  input: {
    marginBottom: 8,
    backgroundColor: 'transparent',
  },
  errorText: {
    fontSize: 12,
    marginBottom: 8,
    marginLeft: 4,
  },
  buttonContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 12,
  },
  button: {
    minHeight: 48,
    justifyContent: 'center',
  },
  cancelButton: {
    flex: 1,
  },
  saveButton: {
    flex: 2,
  },
});