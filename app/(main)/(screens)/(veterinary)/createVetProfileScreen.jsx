// app/(main)/(screens)/createVetProfileScreen.jsx
import React, { useState } from 'react';
import { ScrollView, StyleSheet, View, Alert } from 'react-native';
import { 
  TextInput, 
  Button, 
  Text, 
  Divider, 
  List, 
  Card,
  IconButton,
  Chip
} from 'react-native-paper';
import { uploadImage } from '@/services/supabase/storage';
import { saveVeterinaryClinicData } from '@/services/supabase';
import { ThemedView } from '@/components/themes/ThemedView';
import { useColorScheme } from '@/hooks/useColorScheme';
import ImagePicker from '@/components/interfaces/ImagePicker';
import { useAuth } from '@/contexts/AuthContext';
import { router } from 'expo-router';

export default function CreateVetProfileScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
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
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>Create Veterinary Clinic Profile</Text>
        
        {/* Cover Photo Section */}
        <Text style={styles.sectionLabel}>📸 Cover Photo of the Clinic</Text>
        <ImagePicker
          mode="cover"
          images={coverPhoto}
          onImagesSelected={setCoverPhoto}
          isUploading={isUploading}
          placeholder="Tap to add clinic cover photo"
        />
        
        <Divider style={styles.divider} />
        
        {/* Basic Information */}
        <List.Accordion
          title="🏥 Clinic Information"
          expanded={basicInfoExpanded}
          onPress={() => setBasicInfoExpanded(!basicInfoExpanded)}
          style={styles.accordion}
          titleStyle={styles.accordionTitle}
        >
          <View style={styles.accordionContent}>
            <TextInput
              label="Clinic Name *"
              value={clinicName}
              onChangeText={setClinicName}
              style={styles.input}
              mode="outlined"
            />
            
            <Text style={styles.subSectionLabel}>Clinic Address</Text>
            <TextInput
              label="Full Address *"
              value={fullAddress}
              onChangeText={setFullAddress}
              style={styles.input}
              mode="outlined"
              multiline
              numberOfLines={2}
            />
            
            <TextInput
              label="Sub-district/City/Thana"
              value={subDistrict}
              onChangeText={setSubDistrict}
              style={styles.input}
              mode="outlined"
            />
            
            <TextInput
              label="District"
              value={district}
              onChangeText={setDistrict}
              style={styles.input}
              mode="outlined"
            />
            
            <TextInput
              label="Google Map Link (or Coordinates)"
              value={googleMapLink}
              onChangeText={setGoogleMapLink}
              style={styles.input}
              mode="outlined"
              placeholder="https://maps.google.com/..."
            />
            
            <TextInput
              label="Primary Contact Number *"
              value={primaryContact}
              onChangeText={setPrimaryContact}
              style={styles.input}
              mode="outlined"
              keyboardType="phone-pad"
            />
          </View>
        </List.Accordion>
        
        {/* Visiting Time */}
        <List.Accordion
          title="🕒 Visiting Time"
          expanded={visitingTimeExpanded}
          onPress={() => setVisitingTimeExpanded(!visitingTimeExpanded)}
          style={styles.accordion}
          titleStyle={styles.accordionTitle}
        >
          <View style={styles.accordionContent}>
            <Text style={styles.subSectionLabel}>Saturday to Thursday</Text>
            <View style={styles.timeRow}>
              <TextInput
                label="From"
                value={satToThuFrom}
                onChangeText={setSatToThuFrom}
                style={[styles.input, styles.timeInput]}
                mode="outlined"
              />
              <TextInput
                label="To"
                value={satToThuTo}
                onChangeText={setSatToThuTo}
                style={[styles.input, styles.timeInput]}
                mode="outlined"
              />
            </View>
            
            <Text style={styles.subSectionLabel}>Friday</Text>
            <View style={styles.timeRow}>
              <TextInput
                label="From"
                value={fridayFrom}
                onChangeText={setFridayFrom}
                style={[styles.input, styles.timeInput]}
                mode="outlined"
              />
              <TextInput
                label="To"
                value={fridayTo}
                onChangeText={setFridayTo}
                style={[styles.input, styles.timeInput]}
                mode="outlined"
              />
            </View>
          </View>
        </List.Accordion>
        
        {/* Doctors List */}
        <List.Accordion
          title="👩‍⚕️ Doctors List"
          expanded={doctorsExpanded}
          onPress={() => setDoctorsExpanded(!doctorsExpanded)}
          style={styles.accordion}
          titleStyle={styles.accordionTitle}
        >
          <View style={styles.accordionContent}>
            {doctors.map((doctor, index) => (
              <Card key={doctor.id} style={styles.doctorCard}>
                <Card.Content>
                  <View style={styles.cardHeader}>
                    <Text style={styles.cardTitle}>Doctor {index + 1}</Text>
                    {doctors.length > 1 && (
                      <IconButton
                        icon="delete"
                        size={20}
                        iconColor="#E74C3C"
                        onPress={() => removeDoctor(doctor.id)}
                      />
                    )}
                  </View>
                  
                  <Text style={styles.imageLabel}>Photo</Text>
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
                  />
                  
                  <TextInput
                    label="Degree(s)"
                    value={doctor.degrees}
                    onChangeText={(value) => updateDoctor(doctor.id, 'degrees', value)}
                    style={styles.input}
                    mode="outlined"
                    placeholder="DVM, PhD, etc."
                  />
                  
                  <TextInput
                    label="Phone Number"
                    value={doctor.phoneNumber}
                    onChangeText={(value) => updateDoctor(doctor.id, 'phoneNumber', value)}
                    style={styles.input}
                    mode="outlined"
                    keyboardType="phone-pad"
                  />
                </Card.Content>
              </Card>
            ))}
            
            <Button
              mode="outlined"
              onPress={addDoctor}
              style={styles.addButton}
              icon="plus"
            >
              Add Another Doctor
            </Button>
          </View>
        </List.Accordion>
        
        {/* Services Offered */}
        <List.Accordion
          title="💊 Services Offered"
          expanded={servicesExpanded}
          onPress={() => setServicesExpanded(!servicesExpanded)}
          style={styles.accordion}
          titleStyle={styles.accordionTitle}
        >
          <View style={styles.accordionContent}>
            {services.map((service, index) => (
              <Card key={service.id} style={styles.serviceCard}>
                <Card.Content>
                  <View style={styles.cardHeader}>
                    <Text style={styles.cardTitle}>Service {index + 1}</Text>
                    {services.length > 1 && (
                      <IconButton
                        icon="delete"
                        size={20}
                        iconColor="#E74C3C"
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
                  />
                  
                  <TextInput
                    label="Fee (BDT)"
                    value={service.fee}
                    onChangeText={(value) => updateService(service.id, 'fee', value)}
                    style={styles.input}
                    mode="outlined"
                    keyboardType="numeric"
                    placeholder="e.g., 1500"
                  />
                </Card.Content>
              </Card>
            ))}
            
            <Button
              mode="outlined"
              onPress={addService}
              style={styles.addButton}
              icon="plus"
            >
              Add Another Service
            </Button>
          </View>
        </List.Accordion>
        
        {/* Notices */}
        <List.Accordion
          title="📢 Notices (Optional)"
          expanded={noticesExpanded}
          onPress={() => setNoticesExpanded(!noticesExpanded)}
          style={styles.accordion}
          titleStyle={styles.accordionTitle}
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
            />
          </View>
        </List.Accordion>
        
        {/* Submit Button */}
        <View style={styles.submitContainer}>
          <Button 
            mode="contained" 
            onPress={handleSubmitProfile}
            style={styles.submitButton}
            disabled={isSaving || isUploading}
            loading={isSaving}
            icon="check"
          >
            Submit Profile for Review
          </Button>
          
          <Text style={styles.disclaimerText}>
            * Required fields. Your profile will be reviewed and approved within 24-48 hours.
          </Text>
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
  sectionLabel: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    marginTop: 8,
  },
  subSectionLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
    marginTop: 12,
  },
  input: {
    marginBottom: 16,
    backgroundColor: "transparent",
  },
  divider: {
    marginVertical: 20,
    height: 1,
  },
  imageLabel: {
    fontSize: 14,
    marginBottom: 8,
    fontWeight: '500',
  },
  accordion: {
    marginBottom: 8,
    borderRadius: 8,
    overflow: 'hidden',
  },
  accordionTitle: {
    fontWeight: '500',
    fontSize: 16,
  },
  accordionContent: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  timeInput: {
    flex: 1,
    marginHorizontal: 4,
  },
  doctorCard: {
    marginBottom: 16,
    backgroundColor: '#f8f9fa',
  },
  serviceCard: {
    marginBottom: 16,
    backgroundColor: '#f8f9fa',
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
    borderColor: '#0a7ea4',
  },
  submitContainer: {
    marginTop: 24,
    alignItems: 'center',
  },
  submitButton: {
    paddingVertical: 8,
    paddingHorizontal: 32,
    backgroundColor: '#2E86DE',
  },
  disclaimerText: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 12,
    opacity: 0.7,
    fontStyle: 'italic',
  },
});