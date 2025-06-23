// app/(main)/(screens)/(practitioner)/becomePractitioner.jsx
import React, { useState, useEffect } from 'react';
import { ScrollView, StyleSheet, View, Alert } from 'react-native';
import { 
  Card, 
  Text, 
  TextInput, 
  Button, 
  List, 
  Divider,
  ProgressBar,
  Chip
} from 'react-native-paper';
import { ThemedView } from '@/components/themes/ThemedView';
import { useColorScheme } from '@/hooks/useColorScheme.native';
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
import { validatePractitionerProfile, BANGLADESH_DISTRICTS, VETERINARY_EXPERTISE } from '@/utils/practitionerValidation';

export default function BecomePractitionerScreen() {
  const colorScheme = useColorScheme();
  const { user, refreshRoles } = useAuth();
  const isDark = colorScheme === 'dark';

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
        // Check if BVC number already exists
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

      // Upload profile photo
      if (profilePhoto) {
        profilePhotoUrl = await uploadImage(profilePhoto);
      }

      // Upload degree certificate
      if (degreeCertificate) {
        degreeCertificateUrl = await uploadImage(degreeCertificate);
      }

      // Upload registration certificate
      if (registrationCertificate) {
        registrationCertificateUrl = await uploadImage(registrationCertificate);
      }

      setIsUploading(false);

      // First, apply for practitioner role
      await applyForPractitionerRole(user.sub);

      // Create practitioner profile
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

      console.log('Profile data being saved:', {
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
      });

      console.log('User object:', user);

      if (!user?.sub) {
        Alert.alert('Error', 'User authentication issue. Please sign out and sign in again.');
        return;
      }

      const profileResult = await savePractitionerProfileData(profileData);

      if (profileResult && profileResult.length > 0) {
        const profile = profileResult[0];

        // Save verification documents
        const verificationData = {
          university_name: universityName.trim(),
          graduation_session: graduationSession.trim(),
          degree_certificate_url: degreeCertificateUrl,
          registration_certificate_url: registrationCertificateUrl,
          verification_status: 'pending'
        };

        await saveVerificationDocuments(profile.id, verificationData);

        // Refresh user roles
        await refreshRoles();

        Alert.alert(
          'Application Submitted!',
          'Your practitioner application has been submitted successfully. You will be notified once it\'s reviewed (typically within 24-48 hours).',
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
      <Text variant="titleLarge" style={styles.stepTitle}>Basic Information</Text>
      
      {/* Profile Photo */}
      <Card style={styles.card}>
        <Card.Title title="Profile Photo (Optional)" />
        <Card.Content>
          <ImagePicker
            mode="profile"
            images={profilePhoto}
            onImagesSelected={setProfilePhoto}
            isUploading={isUploading}
            placeholder="Tap to add profile photo"
          />
        </Card.Content>
      </Card>

      {/* Basic Details */}
      <Card style={styles.card}>
        <Card.Title title="Professional Details" />
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
    </View>
  );

  const renderLocationContact = () => (
    <View>
      <Text variant="titleLarge" style={styles.stepTitle}>Location & Contact</Text>
      
      <Card style={styles.card}>
        <Card.Title title="Practice Location" />
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
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Title title="Contact Information" />
        <Card.Content>
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
    </View>
  );

  const renderVerificationDocuments = () => (
    <View>
      <Text variant="titleLarge" style={styles.stepTitle}>Verification Documents</Text>
      
      <Card style={styles.card}>
        <Card.Title title="Educational Background" />
        <Card.Content>
          <TextInput
            label="University of Undergraduate Degree *"
            value={universityName}
            onChangeText={setUniversityName}
            style={styles.input}
            mode="outlined"
            placeholder="e.g., Chattogram Veterinary and Animal Sciences University"
            error={!!validationErrors.universityName}
          />
          {validationErrors.universityName && (
            <Text style={styles.errorText}>{validationErrors.universityName}</Text>
          )}

          <TextInput
            label="Session of Undergraduate Study *"
            value={graduationSession}
            onChangeText={setGraduationSession}
            style={styles.input}
            mode="outlined"
            placeholder="e.g., 2009-2010"
            error={!!validationErrors.graduationSession}
          />
          {validationErrors.graduationSession && (
            <Text style={styles.errorText}>{validationErrors.graduationSession}</Text>
          )}
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Title title="Upload Documents" />
        <Card.Content>
          <Text style={styles.documentNote}>
            📄 Upload clear photos of your certificates for verification
          </Text>

          <View style={styles.documentSection}>
            <Text variant="titleSmall" style={styles.documentTitle}>Degree Certificate</Text>
            <ImagePicker
              mode="single"
              images={degreeCertificate}
              onImagesSelected={setDegreeCertificate}
              isUploading={isUploading}
              placeholder="Upload degree certificate"
              style={styles.documentPicker}
            />
          </View>

          <View style={styles.documentSection}>
            <Text variant="titleSmall" style={styles.documentTitle}>BVC Registration Certificate</Text>
            <ImagePicker
              mode="single"
              images={registrationCertificate}
              onImagesSelected={setRegistrationCertificate}
              isUploading={isUploading}
              placeholder="Upload registration certificate"
              style={styles.documentPicker}
            />
          </View>

          <Card style={styles.privacyCard}>
            <Card.Content>
              <Text variant="bodySmall" style={styles.privacyText}>
                🔒 Your documents are secure and will only be used for verification purposes. 
                They will not be visible in your public profile.
              </Text>
            </Card.Content>
          </Card>
        </Card.Content>
      </Card>
    </View>
  );

  return (
    <ThemedView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        
        {/* Header */}
        <Card style={styles.headerCard}>
          <Card.Content>
            <Text variant="headlineSmall" style={styles.title}>
              Become a Practitioner
            </Text>
            <Text variant="bodyMedium" style={styles.subtitle}>
              Join our network of verified veterinary professionals
            </Text>
            
            {/* Progress Bar */}
            <View style={styles.progressContainer}>
              <Text variant="bodySmall" style={styles.progressText}>
                Step {currentStep} of {totalSteps}
              </Text>
              <ProgressBar 
                progress={currentStep / totalSteps} 
                style={styles.progressBar}
                color="#27AE60"
              />
            </View>
          </Card.Content>
        </Card>

        {/* Step Content */}
        {renderStepContent()}

        {/* Navigation Buttons */}
        <View style={styles.buttonContainer}>
          {currentStep > 1 && (
            <Button
              mode="outlined"
              onPress={handlePrevious}
              style={styles.backButton}
              disabled={isSaving}
            >
              Previous
            </Button>
          )}
          
          {currentStep < totalSteps ? (
            <Button
              mode="contained"
              onPress={handleNext}
              style={styles.nextButton}
              disabled={isSaving}
            >
              Next
            </Button>
          ) : (
            <Button
              mode="contained"
              onPress={handleSubmit}
              style={styles.submitButton}
              disabled={isSaving || isUploading}
              loading={isSaving}
            >
              Submit Application
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
    padding: 16,
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
    marginBottom: 16,
  },
  progressContainer: {
    marginBottom: 8,
  },
  progressText: {
    textAlign: 'center',
    marginBottom: 8,
    fontWeight: '500',
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
  },
  stepTitle: {
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#2E86DE',
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
  documentNote: {
    backgroundColor: '#E8F5E8',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    textAlign: 'center',
  },
  documentSection: {
    marginBottom: 16,
  },
  documentTitle: {
    marginBottom: 8,
    fontWeight: '500',
  },
  documentPicker: {
    height: 120,
  },
  privacyCard: {
    backgroundColor: '#F8F9FA',
    marginTop: 16,
  },
  privacyText: {
    textAlign: 'center',
    fontStyle: 'italic',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 24,
    gap: 12,
  },
  backButton: {
    flex: 1,
  },
  nextButton: {
    flex: 2,
  },
  submitButton: {
    flex: 1,
  },
});