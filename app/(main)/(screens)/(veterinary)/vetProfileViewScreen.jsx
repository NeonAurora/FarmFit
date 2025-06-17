// app/(main)/(screens)/vetProfileViewScreen.jsx
import React, { useState, useEffect } from 'react';
import { ScrollView, StyleSheet, View, ActivityIndicator, Linking, Alert } from 'react-native';
import { 
  Text, 
  Card, 
  Avatar, 
  List, 
  Chip,
  Button,
  Divider,
  IconButton
} from 'react-native-paper';
import { useLocalSearchParams, router } from 'expo-router';
import { ThemedView } from '@/components/themes/ThemedView';
import { ThemedText } from '@/components/themes/ThemedText';
import { useColorScheme } from '@/hooks/useColorScheme';
import { getVeterinaryClinicById } from '@/services/supabase';
import { RatingDisplay } from '@/components/veterinary/RatingDisplay';
import { RatingForm } from '@/components/veterinary/RatingForm';
import { RatingsList } from '@/components/veterinary/RatingsList';
import { useAuth } from '@/contexts/AuthContext';
import { getClinicRatingSummary, getClinicRatings, submitVetRating, hasUserRatedClinic } from '@/services/supabase';

export default function VetProfileViewScreen() {
  const { clinicId } = useLocalSearchParams();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  
  const [clinic, setClinic] = useState(null);
  const [loading, setLoading] = useState(true);
  const [doctorsExpanded, setDoctorsExpanded] = useState(true);
  const [servicesExpanded, setServicesExpanded] = useState(true);
  const [noticesExpanded, setNoticesExpanded] = useState(false);

  const [ratingSummary, setRatingSummary] = useState({ average_rating: 0, total_ratings: 0 });
  const [ratings, setRatings] = useState([]);
  const [showRatingForm, setShowRatingForm] = useState(false);
  const [hasRated, setHasRated] = useState(false);
  const [ratingsExpanded, setRatingsExpanded] = useState(false);

  const { user } = useAuth();
  

  useEffect(() => {
      fetchClinic();
  }, [clinicId]);

  useEffect(() => {
    if (clinic?.id) {
      loadRatingData();
    }
  }, [clinic?.id, user?.sub]);
  
  const fetchClinic = async () => {
    if (!clinicId) return;
    
    setLoading(true);
    try {
      const data = await getVeterinaryClinicById(clinicId);
      setClinic(data);
    } catch (error) {
      console.error('Error fetching clinic:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const handleCall = (phoneNumber) => {
    const phoneUrl = `tel:${phoneNumber}`;
    Linking.openURL(phoneUrl);
  };
  
  const handleMapPress = () => {
    if (clinic?.google_map_link) {
      Linking.openURL(clinic.google_map_link);
    } else {
      // Fallback to Google Maps search
      const address = encodeURIComponent(clinic?.full_address || clinic?.clinic_name);
      const mapUrl = `https://www.google.com/maps/search/?api=1&query=${address}`;
      Linking.openURL(mapUrl);
    }
  };

  // Load rating data
  const loadRatingData = async () => {
    try {
      const [summary, ratingsList, userHasRated] = await Promise.all([
        getClinicRatingSummary(clinic.id),
        getClinicRatings(clinic.id, { limit: 10 }),
        user?.sub ? hasUserRatedClinic(user.sub, clinic.id) : false
      ]);
      
      setRatingSummary(summary);
      setRatings(ratingsList);
      setHasRated(userHasRated);
    } catch (error) {
      console.error('Error loading rating data:', error);
    }
  };

  // Handle rating submission
  const handleSubmitRating = async (ratingData) => {
    try {
      await submitVetRating(ratingData, user);
      setShowRatingForm(false);
      setHasRated(true);
      
      // Reload rating data
      await loadRatingData();
      
      Alert.alert('Success', 'Thank you for your rating!');
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to submit rating');
    }
  };
  
  if (loading) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0a7ea4" />
        <ThemedText style={styles.loadingText}>Loading clinic details...</ThemedText>
      </ThemedView>
    );
  }
  
  if (!clinic) {
    return (
      <ThemedView style={styles.errorContainer}>
        <Avatar.Icon size={80} icon="hospital-building" backgroundColor="#e0e0e0" />
        <ThemedText type="title" style={styles.errorTitle}>Clinic Not Found</ThemedText>
        <ThemedText style={styles.errorText}>
          This veterinary clinic is not available or has been removed.
        </ThemedText>
        <Button mode="contained" onPress={() => router.back()} style={styles.backButton}>
          Go Back
        </Button>
      </ThemedView>
    );
  }
  
  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header with Cover Photo */}
        <Card style={styles.headerCard}>
          {clinic.cover_photo_url ? (
            <Card.Cover source={{ uri: clinic.cover_photo_url }} style={styles.coverPhoto} />
          ) : (
            <View style={[styles.placeholderCover, isDark && styles.placeholderCoverDark]}>
              <Avatar.Icon 
                size={80} 
                icon="hospital-building"
                backgroundColor="transparent"
                color={isDark ? '#fff' : '#666'}
              />
            </View>
          )}
          
          <Card.Content style={styles.headerContent}>
            <ThemedText type="title" style={styles.clinicName}>
              {clinic.clinic_name}
            </ThemedText>
            
            {/* Address with Map Button */}
            <View style={styles.addressContainer}>
              <ThemedText style={styles.address}>
                📍 {clinic.full_address}
              </ThemedText>
              <IconButton
                icon="map"
                size={20}
                onPress={handleMapPress}
                style={styles.mapButton}
              />
            </View>
            
            {clinic.sub_district && (
              <ThemedText style={styles.subLocation}>
                {clinic.sub_district}, {clinic.district}
              </ThemedText>
            )}
          </Card.Content>
        </Card>
        
        {/* Contact Information */}
        <Card style={styles.infoCard}>
          <Card.Title title="📞 Contact Information" />
          <Card.Content>
            <View style={styles.contactRow}>
              <ThemedText style={styles.contactText}>
                Primary Contact: {clinic.primary_contact}
              </ThemedText>
              <Button 
                mode="contained" 
                compact
                onPress={() => handleCall(clinic.primary_contact)}
                style={styles.callButton}
              >
                Call
              </Button>
            </View>
          </Card.Content>
        </Card>
        
        {/* Visiting Hours */}
        <Card style={styles.infoCard}>
          <Card.Title title="🕒 Visiting Hours" />
          <Card.Content>
            <View style={styles.hoursRow}>
              <ThemedText style={styles.hoursLabel}>Saturday - Thursday:</ThemedText>
              <ThemedText style={styles.hoursValue}>
                {clinic.sat_to_thu_from} - {clinic.sat_to_thu_to}
              </ThemedText>
            </View>
            <View style={styles.hoursRow}>
              <ThemedText style={styles.hoursLabel}>Friday:</ThemedText>
              <ThemedText style={styles.hoursValue}>
                {clinic.friday_from} - {clinic.friday_to}
              </ThemedText>
            </View>
          </Card.Content>
        </Card>
        
        {/* Doctors List */}
        {clinic.doctors && clinic.doctors.length > 0 && (
          <List.Accordion
            title="👩‍⚕️ Our Doctors"
            expanded={doctorsExpanded}
            onPress={() => setDoctorsExpanded(!doctorsExpanded)}
            style={styles.accordion}
            titleStyle={styles.accordionTitle}
          >
            {clinic.doctors.map((doctor, index) => (
              <Card key={index} style={styles.doctorCard}>
                <Card.Content>
                  <View style={styles.doctorHeader}>
                    {doctor.photo ? (
                      <Avatar.Image size={60} source={{ uri: doctor.photo }} />
                    ) : (
                      <Avatar.Icon size={60} icon="account-circle" backgroundColor="#e0e0e0" />
                    )}
                    <View style={styles.doctorInfo}>
                      <ThemedText style={styles.doctorName}>{doctor.fullName}</ThemedText>
                      {doctor.degrees && (
                        <ThemedText style={styles.doctorDegrees}>{doctor.degrees}</ThemedText>
                      )}
                      {doctor.phoneNumber && (
                        <View style={styles.doctorContactRow}>
                          <ThemedText style={styles.doctorPhone}>📞 {doctor.phoneNumber}</ThemedText>
                          <Button
                            mode="outlined"
                            compact
                            onPress={() => handleCall(doctor.phoneNumber)}
                            style={styles.doctorCallButton}
                          >
                            Call
                          </Button>
                        </View>
                      )}
                    </View>
                  </View>
                </Card.Content>
              </Card>
            ))}
          </List.Accordion>
        )}
        
        {/* Services Offered */}
        {clinic.services && clinic.services.length > 0 && (
          <List.Accordion
            title="💊 Services & Pricing"
            expanded={servicesExpanded}
            onPress={() => setServicesExpanded(!servicesExpanded)}
            style={styles.accordion}
            titleStyle={styles.accordionTitle}
          >
            <Card style={styles.servicesCard}>
              <Card.Content>
                {clinic.services.map((service, index) => (
                  <View key={index} style={styles.serviceRow}>
                    <View style={styles.serviceInfo}>
                      <ThemedText style={styles.serviceName}>
                        {service.serviceName}
                      </ThemedText>
                    </View>
                    {service.fee && (
                      <Chip style={styles.priceChip}>
                        ৳{service.fee}
                      </Chip>
                    )}
                  </View>
                ))}
              </Card.Content>
            </Card>
          </List.Accordion>
        )}
        
        {/* Notices */}
        {clinic.notices && (
          <List.Accordion
            title="📢 Special Notices"
            expanded={noticesExpanded}
            onPress={() => setNoticesExpanded(!noticesExpanded)}
            style={styles.accordion}
            titleStyle={styles.accordionTitle}
          >
            <Card style={styles.noticesCard}>
              <Card.Content>
                <ThemedText style={styles.noticesText}>{clinic.notices}</ThemedText>
              </Card.Content>
            </Card>
          </List.Accordion>
        )}
        
        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <Button 
            mode="contained" 
            onPress={() => handleCall(clinic.primary_contact)}
            style={styles.primaryButton}
            icon="phone"
          >
            Call Clinic
          </Button>
          
          <Button 
            mode="outlined" 
            onPress={handleMapPress}
            style={styles.secondaryButton}
            icon="map"
          >
            Get Directions
          </Button>
        </View>
        {/* Rating Section */}
        <View style={styles.ratingSection}>
          <RatingDisplay ratingSummary={ratingSummary} />
          
          {user && !hasRated && (
            <Button 
              mode="outlined" 
              onPress={() => setShowRatingForm(true)}
              style={styles.rateButton}
              icon="star"
            >
              Rate This Clinic
            </Button>
          )}
          
          {ratingSummary.total_ratings > 0 && (
            <List.Accordion
              title={`📝 Reviews (${ratingSummary.total_ratings})`}
              expanded={ratingsExpanded}
              onPress={() => setRatingsExpanded(!ratingsExpanded)}
              style={styles.accordion}
              titleStyle={styles.accordionTitle}
            >
              <RatingsList ratings={ratings} />
            </List.Accordion>
          )}
        </View>

        {/* Rating Form Modal */}
        {showRatingForm && (
          <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <RatingForm
              clinicId={clinic.id}
              clinicName={clinic.clinic_name}
              onSubmit={handleSubmitRating}
              onCancel={() => setShowRatingForm(false)}
            />
          </View>
        </View>
        )}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorTitle: {
    marginTop: 16,
    marginBottom: 8,
  },
  errorText: {
    textAlign: 'center',
    opacity: 0.7,
    marginBottom: 16,
  },
  backButton: {
    marginTop: 8,
  },
  headerCard: {
    margin: 0,
    borderRadius: 0,
  },
  coverPhoto: {
    height: 200,
  },
  placeholderCover: {
    height: 200,
    backgroundColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderCoverDark: {
    backgroundColor: '#444',
  },
  headerContent: {
    padding: 16,
  },
  clinicName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  addressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  address: {
    flex: 1,
    fontSize: 16,
    opacity: 0.8,
  },
  mapButton: {
    margin: 0,
  },
  subLocation: {
    fontSize: 14,
    opacity: 0.6,
    marginTop: 4,
  },
  infoCard: {
    margin: 16,
    marginBottom: 8,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  contactText: {
    flex: 1,
    fontSize: 16,
  },
  callButton: {
    marginLeft: 16,
  },
  hoursRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  hoursLabel: {
    fontWeight: '500',
  },
  hoursValue: {
    opacity: 0.8,
  },
  accordion: {
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 8,
    overflow: 'hidden',
  },
  accordionTitle: {
    fontWeight: '500',
    fontSize: 16,
  },
  doctorCard: {
    marginHorizontal: 16,
    marginBottom: 8,
    backgroundColor: '#f8f9fa',
  },
  doctorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  doctorInfo: {
    flex: 1,
    marginLeft: 16,
  },
  doctorName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  doctorDegrees: {
    fontSize: 14,
    opacity: 0.7,
    marginBottom: 4,
  },
  doctorContactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  doctorPhone: {
    fontSize: 14,
    flex: 1,
  },
  doctorCallButton: {
    marginLeft: 8,
  },
  servicesCard: {
    marginHorizontal: 16,
    marginBottom: 8,
    backgroundColor: '#f8f9fa',
  },
  serviceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  serviceInfo: {
    flex: 1,
  },
  serviceName: {
    fontSize: 16,
    fontWeight: '500',
  },
  priceChip: {
    backgroundColor: '#e3f2fd',
  },
  noticesCard: {
    marginHorizontal: 16,
    marginBottom: 8,
    backgroundColor: '#fff3cd',
  },
  noticesText: {
    fontSize: 14,
    lineHeight: 20,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    margin: 16,
    marginTop: 24,
  },
  primaryButton: {
    flex: 1,
    marginRight: 8,
    backgroundColor: '#2E86DE',
  },
  secondaryButton: {
    flex: 1,
    marginLeft: 8,
    borderColor: '#2E86DE',
  },
  ratingSection: {
    marginTop: 16,
  },
  rateButton: {
    marginTop: 8,
    marginHorizontal: 16,
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',        // Takes 90% of screen width
    maxWidth: 400,       // Maximum width for larger screens
    maxHeight: '80%',    // Maximum height to prevent overflow
  },
});