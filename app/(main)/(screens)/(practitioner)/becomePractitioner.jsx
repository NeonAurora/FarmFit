// app/(main)/(screens)/(practitioner)/becomePractitioner.jsx
import React, { useState, useEffect } from 'react';
import { ScrollView, StyleSheet, View, Alert, Dimensions } from 'react-native';
import { 
  Card, 
  Text, 
  TextInput, 
  Button, 
  ProgressBar,
  Surface,
  Divider
} from 'react-native-paper';
import { ThemedView } from '@/components/themes/ThemedView';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { router } from 'expo-router';
import ImagePicker from '@/components/interfaces/ImagePicker';
import { uploadImage } from '@/services/supabase';
import { 
  savePractitionerProfileData, 
  saveVerificationDocuments,
  checkBVCRegistrationExists,
  checkExistingPractitionerProfile,
  applyForPractitionerRole
} from '@/services/supabase';

const { width: screenWidth } = Dimensions.get('window');

export default function BecomePractitionerScreen() {
  const { colors, brandColors, isDark } = useTheme();
  const { user, refreshRoles } = useAuth();

  // Step management
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 3;

  // Basic Information (Step 1)
  const [fullName, setFullName] = useState('');
  const [designation, setDesignation] = useState('');
  const [degreesCertificates, setDegreesCertificates] = useState('');
  const [bvcRegistrationNumber, setBvcRegistrationNumber] = useState('');
  const [areasOfExpertise, setAreasOfExpertise] = useState('');
  const [profilePhoto, setProfilePhoto] = useState(null);

  // Location & Contact (Step 2)
  const [chamberAddress, setChamberAddress] = useState('');
  const [subDistrict, setSubDistrict] = useState('');
  const [district, setDistrict] = useState('');
  const [contactInfo, setContactInfo] = useState('');
  const [whatsappNumber, setWhatsappNumber] = useState('');

  // Verification Documents (Step 3)
  const [universityName, setUniversityName] = useState('');
  const [graduationSession, setGraduationSession] = useState('');
  const [degreeCertificate, setDegreeCertificate] = useState(null);
  const [registrationCertificate, setRegistrationCertificate] = useState(null);

  // UI States
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});

  // Check if user already has a profile
  useEffect(() => {
    checkExistingProfile();
  }, []);

  const checkExistingProfile = async () => {
    if (user?.sub) {
      const existingProfile = await checkExistingPractitionerProfile(user.sub);
      if (existingProfile) {
        Alert.alert(
          'Profile Exists',
          'You already have a practitioner profile.',
          [
            { text: 'View Profile', onPress: () => router.push('/practitionerProfile') },
            { text: 'OK' }
          ]
        );
      }
    }
  };

  // Validation for each step
  const validateStep = async (step) => {
    const errors = {};

    if (step === 1) {
      if (!fullName.trim()) errors.fullName = 'Full name is required';
      if (!designation.trim()) errors.designation = 'Designation is required';
      if (!degreesCertificates.trim()) errors.degreesCertificates = 'Degrees/certificates are required';
      if (!bvcRegistrationNumber.trim()) {
        errors.bvcRegistrationNumber = 'BVC registration number is required';
      } else {
        const exists = await checkBVCRegistrationExists(bvcRegistrationNumber);
        if (exists) {
          errors.bvcRegistrationNumber = 'This BVC registration number is already registered';
        }
      }
      if (!areasOfExpertise.trim()) errors.areasOfExpertise = 'Areas of expertise are required';
    }

    if (step === 2) {
      if (!chamberAddress.trim()) errors.chamberAddress = 'Chamber address is required';
      if (!subDistrict.trim()) errors.subDistrict = 'Sub-district is required';
      if (!district.trim()) errors.district = 'District is required';
      if (!contactInfo.trim()) errors.contactInfo = 'Contact information is required';
    }

    if (step === 3) {
      if (!universityName.trim()) errors.universityName = 'University name is required';
      if (!graduationSession.trim()) errors.graduationSession = 'Graduation session is required';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleNext = async () => {
    const isValid = await validateStep(currentStep);
    if (isValid && currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    const isValid = await validateStep(currentStep);
    if (!isValid) return;

    setIsSaving(true);
    let profilePhotoUrl = null;
    let degreeCertificateUrl = null;
    let registrationCertificateUrl = null;

    try {
      setIsUploading(true);

      if (profilePhoto) {
        profilePhotoUrl = await uploadImage(profilePhoto);
      }

      if (degreeCertificate) {
        degreeCertificateUrl = await uploadImage(degreeCertificate);
      }

      if (registrationCertificate) {
        registrationCertificateUrl = await uploadImage(registrationCertificate);
      }

      setIsUploading(false);

      await applyForPractitionerRole(user.sub);

      const profileData = {
        user_id: user.sub,
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
        profile_photo_url: profilePhotoUrl,
        is_verified: false,
        is_active: true
      };

      const profileResult = await savePractitionerProfileData(profileData);

      if (profileResult && profileResult.length > 0) {
        const profile = profileResult[0];

        const verificationData = {
          university_name: universityName.trim(),
          graduation_session: graduationSession.trim(),
          degree_certificate_url: degreeCertificateUrl,
          registration_certificate_url: registrationCertificateUrl,
          verification_status: 'pending'
        };

        await saveVerificationDocuments(profile.id, verificationData);
        await refreshRoles();

        Alert.alert(
          'Application Submitted',
          'Your practitioner application has been submitted successfully. You will be notified once it\'s reviewed.',
          [
            {
              text: 'OK',
              onPress: () => router.push('/applicationStatus')
            }
          ]
        );
      } else {
        throw new Error('Failed to create profile');
      }

    } catch (error) {
      console.error('Error submitting application:', error);
      Alert.alert('Error', 'Failed to submit application. Please try again.');
    } finally {
      setIsSaving(false);
      setIsUploading(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return renderBasicInformation();
      case 2:
        return renderLocationContact();
      case 3:
        return renderVerificationDocuments();
      default:
        return null;
    }
  };

  const renderBasicInformation = () => (
    <View>
      <Surface style={[styles.surface, { backgroundColor: colors.surface }]}>
        <Text variant="titleMedium" style={[styles.sectionTitle, { color: colors.text }]}>
          Professional Details
        </Text>
        
        <View style={styles.photoSection}>
          <Text variant="bodySmall" style={[styles.fieldLabel, { color: colors.textSecondary }]}>
            Profile Photo (Optional)
          </Text>
          <ImagePicker
            mode="profile"
            images={profilePhoto}
            onImagesSelected={setProfilePhoto}
            isUploading={isUploading}
            placeholder="Add photo"
          />
        </View>

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
    </View>
  );

  const renderLocationContact = () => (
    <View>
      <Surface style={[styles.surface, { backgroundColor: colors.surface }]}>
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
    </View>
  );

  const renderVerificationDocuments = () => (
    <View>
      <Surface style={[styles.surface, { backgroundColor: colors.surface }]}>
        <Text variant="titleMedium" style={[styles.sectionTitle, { color: colors.text }]}>
          Educational Background
        </Text>
        
        <TextInput
          label="University Name"
          value={universityName}
          onChangeText={setUniversityName}
          style={styles.input}
          mode="outlined"
          error={!!validationErrors.universityName}
          outlineColor={colors.border}
          activeOutlineColor={brandColors.primary}
          textColor={colors.text}
          theme={{ colors: { background: colors.input.background } }}
        />

        <TextInput
          label="Graduation Session"
          value={graduationSession}
          onChangeText={setGraduationSession}
          style={styles.input}
          mode="outlined"
          placeholder="e.g., 2009-2010"
          error={!!validationErrors.graduationSession}
          outlineColor={colors.border}
          activeOutlineColor={brandColors.primary}
          textColor={colors.text}
          theme={{ colors: { background: colors.input.background } }}
        />
      </Surface>

      <Surface style={[styles.surface, styles.surfaceMarginTop, { backgroundColor: colors.surface }]}>
        <Text variant="titleMedium" style={[styles.sectionTitle, { color: colors.text }]}>
          Upload Documents
        </Text>
        
        <View style={styles.documentSection}>
          <Text variant="bodySmall" style={[styles.fieldLabel, { color: colors.textSecondary }]}>
            Degree Certificate
          </Text>
          <ImagePicker
            mode="single"
            images={degreeCertificate}
            onImagesSelected={setDegreeCertificate}
            isUploading={isUploading}
            placeholder="Upload certificate"
          />
        </View>

        <Divider style={[styles.divider, { backgroundColor: colors.border }]} />

        <View style={styles.documentSection}>
          <Text variant="bodySmall" style={[styles.fieldLabel, { color: colors.textSecondary }]}>
            BVC Registration Certificate
          </Text>
          <ImagePicker
            mode="single"
            images={registrationCertificate}
            onImagesSelected={setRegistrationCertificate}
            isUploading={isUploading}
            placeholder="Upload certificate"
          />
        </View>

        <Surface style={[styles.infoCard, { backgroundColor: colors.backgroundSecondary }]} elevation={0}>
          <Text variant="bodySmall" style={{ color: colors.textSecondary }}>
            Your documents are secure and will only be used for verification purposes.
          </Text>
        </Surface>
      </Surface>
    </View>
  );

  return (
    <ThemedView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Compact Header */}
        <Surface style={[styles.header, { backgroundColor: colors.surface }]} elevation={1}>
          
          <View style={styles.progressContainer}>
            <Text variant="labelSmall" style={[styles.progressText, { color: colors.textSecondary }]}>
              Step {currentStep} of {totalSteps}
            </Text>
            <ProgressBar 
              progress={currentStep / totalSteps} 
              style={styles.progressBar}
              color={brandColors.primary}
              theme={{ colors: { background: colors.progressBar.background } }}
            />
          </View>
        </Surface>

        {/* Step Content */}
        <View style={styles.content}>
          {renderStepContent()}
        </View>

        {/* Navigation Buttons */}
        <View style={styles.buttonContainer}>
          {currentStep > 1 && (
            <Button
              mode="outlined"
              onPress={handlePrevious}
              style={[styles.button, styles.backButton]}
              disabled={isSaving}
              textColor={brandColors.primary}
              theme={{ colors: { outline: colors.border } }}
            >
              Previous
            </Button>
          )}
          
          {currentStep < totalSteps ? (
            <Button
              mode="contained"
              onPress={handleNext}
              style={[styles.button, styles.primaryButton]}
              disabled={isSaving}
              buttonColor={brandColors.primary}
            >
              Next
            </Button>
          ) : (
            <Button
              mode="contained"
              onPress={handleSubmit}
              style={[styles.button, styles.primaryButton]}
              disabled={isSaving || isUploading}
              loading={isSaving}
              buttonColor={brandColors.primary}
            >
              Submit
            </Button>
          )}
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
    marginBottom: 12,
  },
  progressContainer: {
    marginTop: 8,
  },
  progressText: {
    marginBottom: 6,
    fontWeight: '500',
  },
  progressBar: {
    height: 4,
    borderRadius: 2,
  },
  content: {
    paddingHorizontal: 16,
  },
  surface: {
    padding: 16,
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
  input: {
    marginBottom: 8,
    backgroundColor: 'transparent',
  },
  errorText: {
    fontSize: 12,
    marginBottom: 8,
    marginLeft: 4,
  },
  fieldLabel: {
    marginBottom: 6,
    fontWeight: '500',
  },
  photoSection: {
    marginBottom: 12,
  },
  documentSection: {
    marginBottom: 12,
  },
  divider: {
    marginVertical: 12,
    height: 1,
  },
  infoCard: {
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
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
  backButton: {
    flex: 1,
  },
  primaryButton: {
    flex: 2,
  },
});