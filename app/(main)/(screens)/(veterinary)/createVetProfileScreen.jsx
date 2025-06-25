// app/(main)/(screens)/createVetProfileScreen.jsx
import React, { useState } from 'react';
import { ScrollView, StyleSheet, View, Alert } from 'react-native';
import { 
  TextInput, 
  Text, 
  Divider, 
  List, 
  IconButton
} from 'react-native-paper';
import { uploadImage } from '@/services/supabase';
import { saveVeterinaryClinicData } from '@/services/supabase';
import { ThemedView } from '@/components/themes/ThemedView';
import { ThemedText } from '@/components/themes/ThemedText';
import { ThemedCard } from '@/components/themes/ThemedCard';
import { ThemedButton } from '@/components/themes/ThemedButton';
import { useTheme } from '@/contexts/ThemeContext';
import { 
  useInputColors,
  useCardColors 
} from '@/hooks/useThemeColor';
import ImagePicker from '@/components/interfaces/ImagePicker';
import { useAuth } from '@/contexts/AuthContext';
import { router } from 'expo-router';

export default function CreateVetProfileScreen() {
  const { colors, brandColors, isDark } = useTheme();
  const inputColors = useInputColors();
  const cardColors = useCardColors();
  const { user } = useAuth();
  
  // Basic clinic information
  const [clinicName, setClinicName] = useState('');
  const [fullAddress, setFullAddress] = useState('');
  const [subDistrict, setSubDistrict] = useState('');
  const [district, setDistrict] = useState('');
  const [googleMapLink, setGoogleMapLink] = useState('');
  const [primaryContact, setPrimaryContact] = useState('');
  const [coverPhoto, setCoverPhoto] = useState(null);
  
  // Visiting times
  const [satToThuFrom, setSatToThuFrom] = useState('10:00 AM');
  const [satToThuTo, setSatToThuTo] = useState('09:00 PM');
  const [fridayFrom, setFridayFrom] = useState('03:00 PM');
  const [fridayTo, setFridayTo] = useState('10:00 PM');
  
  // Doctors list
  const [doctors, setDoctors] = useState([{
    id: Date.now(),
    photo: null,
    fullName: '',
    degrees: '',
    phoneNumber: ''
  }]);
  
  // Services offered
  const [services, setServices] = useState([{
    id: Date.now(),
    serviceName: '',
    fee: ''
  }]);
  
  // Notices
  const [notices, setNotices] = useState('');
  
  // Expandable sections
  const [basicInfoExpanded, setBasicInfoExpanded] = useState(true);
  const [visitingTimeExpanded, setVisitingTimeExpanded] = useState(true);
  const [doctorsExpanded, setDoctorsExpanded] = useState(true);
  const [servicesExpanded, setServicesExpanded] = useState(true);
  const [noticesExpanded, setNoticesExpanded] = useState(false);
  
  // UI states
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const addDoctor = () => {
    setDoctors(prev => [...prev, {
      id: Date.now(),
      photo: null,
      fullName: '',
      degrees: '',
      phoneNumber: ''
    }]);
  };
  
  const removeDoctor = (doctorId) => {
    if (doctors.length > 1) {
      setDoctors(prev => prev.filter(doctor => doctor.id !== doctorId));
    }
  };
  
  const updateDoctor = (doctorId, field, value) => {
    setDoctors(prev => 
      prev.map(doctor => 
        doctor.id === doctorId 
          ? { ...doctor, [field]: value }
          : doctor
      )
    );
  };
  
  const addService = () => {
    setServices(prev => [...prev, {
      id: Date.now(),
      serviceName: '',
      fee: ''
    }]);
  };
  
  const removeService = (serviceId) => {
    if (services.length > 1) {
      setServices(prev => prev.filter(service => service.id !== serviceId));
    }
  };
  
  const updateService = (serviceId, field, value) => {
    setServices(prev => 
      prev.map(service => 
        service.id === serviceId 
          ? { ...service, [field]: value }
          : service
      )
    );
  };
  
  const validateForm = () => {
    if (!clinicName.trim()) {
      Alert.alert("Validation Error", "Clinic name is required.");
      return false;
    }
    
    if (!fullAddress.trim()) {
      Alert.alert("Validation Error", "Full address is required.");
      return false;
    }
    
    if (!primaryContact.trim()) {
      Alert.alert("Validation Error", "Primary contact number is required.");
      return false;
    }
    
    // Check if at least one doctor has a name
    const hasValidDoctor = doctors.some(doctor => doctor.fullName.trim());
    if (!hasValidDoctor) {
      Alert.alert("Validation Error", "At least one doctor with a name is required.");
      return false;
    }
    
    // Check if at least one service has a name
    const hasValidService = services.some(service => service.serviceName.trim());
    if (!hasValidService) {
      Alert.alert("Validation Error", "At least one service with a name is required.");
      return false;
    }
    
    return true;
  };
  
  const handleSubmitProfile = async () => {
    if (!validateForm()) return;
    
    setIsSaving(true);
    let coverImageUrl = null;
    let doctorPhotos = {};
    
    try {
      // Upload cover photo if present
      if (coverPhoto) {
        setIsUploading(true);
        coverImageUrl = await uploadImage(coverPhoto);
      }
      
      // Upload doctor photos
      for (const doctor of doctors) {
        if (doctor.photo) {
          const photoUrl = await uploadImage(doctor.photo);
          doctorPhotos[doctor.id] = photoUrl;
        }
      }
      
      setIsUploading(false);
      
      // Prepare veterinary clinic data
      const vetData = {
        user_id: user?.sub,
        clinic_name: clinicName,
        full_address: fullAddress,
        sub_district: subDistrict,
        district: district,
        google_map_link: googleMapLink,
        primary_contact: primaryContact,
        cover_photo_url: coverImageUrl,
        
        // Visiting times
        sat_to_thu_from: satToThuFrom,
        sat_to_thu_to: satToThuTo,
        friday_from: fridayFrom,
        friday_to: fridayTo,
        
        // Store complex data as JSON
        doctors: doctors.map(doctor => ({
          ...doctor,
          photo: doctorPhotos[doctor.id] || null
        })),
        services: services,
        notices: notices,
        
        created_at: new Date().toISOString(),
        is_approved: false, // Admin approval required
        is_active: true
      };
      
      // Save using database function
      const result = await saveVeterinaryClinicData(vetData);
      
      if (result) {
        Alert.alert(
          "Success", 
          "Veterinary clinic profile submitted successfully! It will be reviewed and approved within 24-48 hours.",
          [
            {
              text: "OK",
              onPress: () => router.back()
            }
          ]
        );
      } else {
        throw new Error('Failed to create veterinary profile');
      }
      
    } catch (error) {
      console.error('Error creating vet profile:', error.message || error);
      Alert.alert("Error", "Failed to create veterinary profile. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };
  
  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <ThemedText type="title" style={[styles.title, { color: colors.text }]}>
          Create Veterinary Clinic Profile
        </ThemedText>
        
        {/* Cover Photo Section */}
        <ThemedCard variant="elevated" elevation={1} style={styles.photoCard}>
          <View style={styles.cardContent}>
            <ThemedText type="defaultSemiBold" style={[styles.sectionLabel, { color: colors.text }]}>
              📸 Clinic Cover Photo
            </ThemedText>
            <ImagePicker
              mode="cover"
              images={coverPhoto}
              onImagesSelected={setCoverPhoto}
              isUploading={isUploading}
              placeholder="Tap to add clinic cover photo"
            />
          </View>
        </ThemedCard>
        
        {/* Basic Information */}
        <ThemedCard variant="elevated" elevation={1} style={styles.sectionCard}>
          <List.Accordion
            title="🏥 Clinic Information"
            expanded={basicInfoExpanded}
            onPress={() => setBasicInfoExpanded(!basicInfoExpanded)}
            titleStyle={[styles.accordionTitle, { color: colors.text }]}
          >
            <View style={styles.accordionContent}>
              <TextInput
                label="Clinic Name *"
                value={clinicName}
                onChangeText={setClinicName}
                style={styles.input}
                mode="outlined"
                outlineColor={inputColors.border}
                activeOutlineColor={inputColors.borderFocused}
                textColor={inputColors.text}
                placeholderTextColor={inputColors.placeholder}
              />
              
              <ThemedText type="defaultSemiBold" style={[styles.subSectionLabel, { color: colors.text }]}>
                Clinic Address
              </ThemedText>
              <TextInput
                label="Full Address *"
                value={fullAddress}
                onChangeText={setFullAddress}
                style={styles.input}
                mode="outlined"
                multiline
                numberOfLines={2}
                outlineColor={inputColors.border}
                activeOutlineColor={inputColors.borderFocused}
                textColor={inputColors.text}
                placeholderTextColor={inputColors.placeholder}
              />
              
              <TextInput
                label="Sub-district/City/Thana"
                value={subDistrict}
                onChangeText={setSubDistrict}
                style={styles.input}
                mode="outlined"
                outlineColor={inputColors.border}
                activeOutlineColor={inputColors.borderFocused}
                textColor={inputColors.text}
                placeholderTextColor={inputColors.placeholder}
              />
              
              <TextInput
                label="District"
                value={district}
                onChangeText={setDistrict}
                style={styles.input}
                mode="outlined"
                outlineColor={inputColors.border}
                activeOutlineColor={inputColors.borderFocused}
                textColor={inputColors.text}
                placeholderTextColor={inputColors.placeholder}
              />
              
              <TextInput
                label="Google Map Link (or Coordinates)"
                value={googleMapLink}
                onChangeText={setGoogleMapLink}
                style={styles.input}
                mode="outlined"
                placeholder="https://maps.google.com/..."
                outlineColor={inputColors.border}
                activeOutlineColor={inputColors.borderFocused}
                textColor={inputColors.text}
                placeholderTextColor={inputColors.placeholder}
              />
              
              <TextInput
                label="Primary Contact Number *"
                value={primaryContact}
                onChangeText={setPrimaryContact}
                style={styles.input}
                mode="outlined"
                keyboardType="phone-pad"
                outlineColor={inputColors.border}
                activeOutlineColor={inputColors.borderFocused}
                textColor={inputColors.text}
                placeholderTextColor={inputColors.placeholder}
              />
            </View>
          </List.Accordion>
        </ThemedCard>
        
        {/* Visiting Time */}
        <ThemedCard variant="elevated" elevation={1} style={styles.sectionCard}>
          <List.Accordion
            title="🕒 Visiting Time"
            expanded={visitingTimeExpanded}
            onPress={() => setVisitingTimeExpanded(!visitingTimeExpanded)}
            titleStyle={[styles.accordionTitle, { color: colors.text }]}
          >
            <View style={styles.accordionContent}>
              <ThemedText type="defaultSemiBold" style={[styles.subSectionLabel, { color: colors.text }]}>
                Saturday to Thursday
              </ThemedText>
              <View style={styles.timeRow}>
                <TextInput
                  label="From"
                  value={satToThuFrom}
                  onChangeText={setSatToThuFrom}
                  style={[styles.input, styles.timeInput]}
                  mode="outlined"
                  outlineColor={inputColors.border}
                  activeOutlineColor={inputColors.borderFocused}
                  textColor={inputColors.text}
                />
                <TextInput
                  label="To"
                  value={satToThuTo}
                  onChangeText={setSatToThuTo}
                  style={[styles.input, styles.timeInput]}
                  mode="outlined"
                  outlineColor={inputColors.border}
                  activeOutlineColor={inputColors.borderFocused}
                  textColor={inputColors.text}
                />
              </View>
              
              <ThemedText type="defaultSemiBold" style={[styles.subSectionLabel, { color: colors.text }]}>
                Friday
              </ThemedText>
              <View style={styles.timeRow}>
                <TextInput
                  label="From"
                  value={fridayFrom}
                  onChangeText={setFridayFrom}
                  style={[styles.input, styles.timeInput]}
                  mode="outlined"
                  outlineColor={inputColors.border}
                  activeOutlineColor={inputColors.borderFocused}
                  textColor={inputColors.text}
                />
                <TextInput
                  label="To"
                  value={fridayTo}
                  onChangeText={setFridayTo}
                  style={[styles.input, styles.timeInput]}
                  mode="outlined"
                  outlineColor={inputColors.border}
                  activeOutlineColor={inputColors.borderFocused}
                  textColor={inputColors.text}
                />
              </View>
            </View>
          </List.Accordion>
        </ThemedCard>
        
        {/* Doctors List */}
        <ThemedCard variant="elevated" elevation={1} style={styles.sectionCard}>
          <List.Accordion
            title="👩‍⚕️ Doctors List"
            expanded={doctorsExpanded}
            onPress={() => setDoctorsExpanded(!doctorsExpanded)}
            titleStyle={[styles.accordionTitle, { color: colors.text }]}
          >
            <View style={styles.accordionContent}>
              {doctors.map((doctor, index) => (
                <ThemedCard 
                  key={doctor.id} 
                  variant="flat" 
                  style={[styles.itemCard, { backgroundColor: colors.backgroundSecondary }]}
                >
                  <View style={styles.cardContent}>
                    <View style={styles.cardHeader}>
                      <ThemedText type="defaultSemiBold" style={[styles.cardTitle, { color: colors.text }]}>
                        Doctor {index + 1}
                      </ThemedText>
                      {doctors.length > 1 && (
                        <IconButton
                          icon="delete"
                          size={20}
                          iconColor={brandColors.error}
                          onPress={() => removeDoctor(doctor.id)}
                        />
                      )}
                    </View>
                    
                    <ThemedText type="defaultSemiBold" style={[styles.imageLabel, { color: colors.text }]}>
                      Photo
                    </ThemedText>
                    <ImagePicker
                      mode="single"
                      images={doctor.photo}
                      onImagesSelected={(photoUri) => {
                        setDoctors(prev => 
                          prev.map(doc => 
                            doc.id === doctor.id 
                              ? { ...doc, photo: photoUri }
                              : doc
                          )
                        );
                      }}
                      isUploading={isUploading}
                      placeholder="Tap to add doctor photo"
                    />
                    
                    <TextInput
                      label="Full Name *"
                      value={doctor.fullName}
                      onChangeText={(value) => updateDoctor(doctor.id, 'fullName', value)}
                      style={styles.input}
                      mode="outlined"
                      outlineColor={inputColors.border}
                      activeOutlineColor={inputColors.borderFocused}
                      textColor={inputColors.text}
                      placeholderTextColor={inputColors.placeholder}
                    />
                    
                    <TextInput
                      label="Degree(s)"
                      value={doctor.degrees}
                      onChangeText={(value) => updateDoctor(doctor.id, 'degrees', value)}
                      style={styles.input}
                      mode="outlined"
                      placeholder="DVM, PhD, etc."
                      outlineColor={inputColors.border}
                      activeOutlineColor={inputColors.borderFocused}
                      textColor={inputColors.text}
                      placeholderTextColor={inputColors.placeholder}
                    />
                    
                    <TextInput
                      label="Phone Number"
                      value={doctor.phoneNumber}
                      onChangeText={(value) => updateDoctor(doctor.id, 'phoneNumber', value)}
                      style={styles.input}
                      mode="outlined"
                      keyboardType="phone-pad"
                      outlineColor={inputColors.border}
                      activeOutlineColor={inputColors.borderFocused}
                      textColor={inputColors.text}
                      placeholderTextColor={inputColors.placeholder}
                    />
                  </View>
                </ThemedCard>
              ))}
              
              <ThemedButton
                variant="outlined"
                onPress={addDoctor}
                style={styles.addButton}
                icon="plus"
              >
                Add Another Doctor
              </ThemedButton>
            </View>
          </List.Accordion>
        </ThemedCard>
        
        {/* Services Offered */}
        <ThemedCard variant="elevated" elevation={1} style={styles.sectionCard}>
          <List.Accordion
            title="💊 Services Offered"
            expanded={servicesExpanded}
            onPress={() => setServicesExpanded(!servicesExpanded)}
            titleStyle={[styles.accordionTitle, { color: colors.text }]}
          >
            <View style={styles.accordionContent}>
              {services.map((service, index) => (
                <ThemedCard 
                  key={service.id} 
                  variant="flat" 
                  style={[styles.itemCard, { backgroundColor: colors.backgroundSecondary }]}
                >
                  <View style={styles.cardContent}>
                    <View style={styles.cardHeader}>
                      <ThemedText type="defaultSemiBold" style={[styles.cardTitle, { color: colors.text }]}>
                        Service {index + 1}
                      </ThemedText>
                      {services.length > 1 && (
                        <IconButton
                          icon="delete"
                          size={20}
                          iconColor={brandColors.error}
                          onPress={() => removeService(service.id)}
                        />
                      )}
                    </View>
                    
                    <TextInput
                      label="Service Name *"
                      value={service.serviceName}
                      onChangeText={(value) => updateService(service.id, 'serviceName', value)}
                      style={styles.input}
                      mode="outlined"
                      placeholder="e.g., Spaying, Vaccination, Check-up"
                      outlineColor={inputColors.border}
                      activeOutlineColor={inputColors.borderFocused}
                      textColor={inputColors.text}
                      placeholderTextColor={inputColors.placeholder}
                    />
                    
                    <TextInput
                      label="Fee (BDT)"
                      value={service.fee}
                      onChangeText={(value) => updateService(service.id, 'fee', value)}
                      style={styles.input}
                      mode="outlined"
                      keyboardType="numeric"
                      placeholder="e.g., 1500"
                      outlineColor={inputColors.border}
                      activeOutlineColor={inputColors.borderFocused}
                      textColor={inputColors.text}
                      placeholderTextColor={inputColors.placeholder}
                    />
                  </View>
                </ThemedCard>
              ))}
              
              <ThemedButton
                variant="outlined"
                onPress={addService}
                style={styles.addButton}
                icon="plus"
              >
                Add Another Service
              </ThemedButton>
            </View>
          </List.Accordion>
        </ThemedCard>
        
        {/* Notices */}
        <ThemedCard variant="elevated" elevation={1} style={styles.sectionCard}>
          <List.Accordion
            title="📢 Notices (Optional)"
            expanded={noticesExpanded}
            onPress={() => setNoticesExpanded(!noticesExpanded)}
            titleStyle={[styles.accordionTitle, { color: colors.text }]}
          >
            <View style={styles.accordionContent}>
              <TextInput
                label="Special notices or announcements"
                value={notices}
                onChangeText={setNotices}
                style={styles.input}
                mode="outlined"
                multiline
                numberOfLines={4}
                placeholder="e.g., World Veterinary Day discount, emergency contact info, special timings..."
                outlineColor={inputColors.border}
                activeOutlineColor={inputColors.borderFocused}
                textColor={inputColors.text}
                placeholderTextColor={inputColors.placeholder}
              />
            </View>
          </List.Accordion>
        </ThemedCard>
        
        {/* Submit Button */}
        <ThemedCard variant="elevated" elevation={2} style={styles.submitCard}>
          <View style={styles.submitContainer}>
            <ThemedButton 
              variant="primary"
              onPress={handleSubmitProfile}
              style={styles.submitButton}
              disabled={isSaving || isUploading}
              loading={isSaving}
              icon="check"
            >
              Submit Profile for Review
            </ThemedButton>
            
            <ThemedText 
              variant="bodySmall" 
              style={[styles.disclaimerText, { color: colors.textMuted }]}
            >
              * Required fields. Your profile will be reviewed and approved within 24-48 hours.
            </ThemedText>
          </View>
        </ThemedCard>
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
    paddingBottom: 32,
  },
  title: {
    textAlign: 'center',
    marginBottom: 20,
    fontSize: 22,
    fontWeight: '700',
  },
  photoCard: {
    marginBottom: 12,
  },
  sectionCard: {
    marginBottom: 8,
  },
  cardContent: {
    padding: 16,
  },
  sectionLabel: {
    marginBottom: 12,
    fontSize: 18,
    fontWeight: '600',
  },
  subSectionLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
    marginTop: 8,
  },
  input: {
    marginBottom: 12,
    backgroundColor: "transparent",
  },
  imageLabel: {
    fontSize: 14,
    marginBottom: 8,
    fontWeight: '500',
  },
  accordionTitle: {
    fontWeight: '500',
    fontSize: 16,
  },
  accordionContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  timeRow: {
    flexDirection: 'row',
    gap: 12,
  },
  timeInput: {
    flex: 1,
  },
  itemCard: {
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  addButton: {
    marginTop: 8,
  },
  submitCard: {
    marginTop: 16,
  },
  submitContainer: {
    padding: 20,
    alignItems: 'center',
  },
  submitButton: {
    paddingVertical: 8,
    paddingHorizontal: 32,
    minWidth: 200,
  },
  disclaimerText: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 12,
    opacity: 0.8,
    fontStyle: 'italic',
    lineHeight: 18,
  },
});