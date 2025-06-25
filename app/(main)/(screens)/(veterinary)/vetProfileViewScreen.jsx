// app/(main)/(screens)/vetProfileViewScreen.jsx
import React, { useState, useEffect } from 'react';
import { ScrollView, StyleSheet, View, Linking, Alert, Modal, Pressable } from 'react-native';
import { 
  Avatar, 
  List, 
  Chip,
  Button,
  Divider,
  IconButton,
  Surface,
  FAB,
  ProgressBar,
  Card
} from 'react-native-paper';
import { useLocalSearchParams, router } from 'expo-router';
import { ThemedView } from '@/components/themes/ThemedView';
import { ThemedText } from '@/components/themes/ThemedText';
import { ThemedCard } from '@/components/themes/ThemedCard';
import { ThemedButton } from '@/components/themes/ThemedButton';
import { useTheme } from '@/contexts/ThemeContext';
import { useCardColors, useChipColors, useActivityIndicatorColors } from '@/hooks/useThemeColor';
import { getVeterinaryClinicById } from '@/services/supabase';
import { RatingDisplay } from '@/components/veterinary/RatingDisplay';
import { RatingForm } from '@/components/veterinary/RatingForm';
import { RatingsList } from '@/components/veterinary/RatingsList';
import { UserOwnRating } from '@/components/veterinary/UserOwnRating';
import { RatingEditForm } from '@/components/veterinary/RatingEditForm';
import { reportRating } from '@/services/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { getClinicRatingSummary, getClinicRatings, submitVetRating, hasUserRatedClinic, getUserHelpfulnessVotes } from '@/services/supabase';
import { updateUserRating, deleteUserRating, getUserClinicRating } from '@/services/supabase';
import { Image } from 'react-native';

export default function VetProfileViewScreen() {
  const { clinicId } = useLocalSearchParams();
  const { colors, isDark } = useTheme();
  const cardColors = useCardColors();
  const chipColors = useChipColors();
  const activityIndicatorColors = useActivityIndicatorColors();
  
  const [clinic, setClinic] = useState(null);
  const [loading, setLoading] = useState(true);
  const [doctorsExpanded, setDoctorsExpanded] = useState(false);
  const [servicesExpanded, setServicesExpanded] = useState(false);
  const [noticesExpanded, setNoticesExpanded] = useState(false);

  const [ratingSummary, setRatingSummary] = useState({ average_rating: 0, total_ratings: 0 });
  const [ratings, setRatings] = useState([]);
  const [showRatingForm, setShowRatingForm] = useState(false);
  const [hasRated, setHasRated] = useState(false);
  const [ratingsExpanded, setRatingsExpanded] = useState(false);
  const [currentSort, setCurrentSort] = useState('created_at');

  const [userOwnRating, setUserOwnRating] = useState(null);
  const [editingRating, setEditingRating] = useState(null);
  const [showEditForm, setShowEditForm] = useState(false);
  const [updating, setUpdating] = useState(false);

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
      const address = encodeURIComponent(clinic?.full_address || clinic?.clinic_name);
      const mapUrl = `https://www.google.com/maps/search/?api=1&query=${address}`;
      Linking.openURL(mapUrl);
    }
  };

  const loadRatingData = async () => {
    try {
      const [summary, ratingsList, userHasRated, userRating] = await Promise.all([
        getClinicRatingSummary(clinic.id),
        getClinicRatings(clinic.id, { limit: 10, sortBy: currentSort }),
        user?.sub ? hasUserRatedClinic(user.sub, clinic.id) : false,
        user?.sub ? getUserClinicRating(user.sub, clinic.id) : null
      ]);
      
      setRatingSummary(summary);
      setRatings(ratingsList);
      setHasRated(userHasRated);
      setUserOwnRating(userRating);
    } catch (error) {
      console.error('Error loading rating data:', error);
    }
  };

  const handleSortChange = async (newSort) => {
    setCurrentSort(newSort);
    try {
      const sortedRatings = await getClinicRatings(clinic.id, { 
        limit: 10, 
        sortBy: newSort 
      });
      setRatings(sortedRatings);
    } catch (error) {
      console.error('Error sorting ratings:', error);
    }
  };

  const handleUpdateUserRating = async (updateData, editReason) => {
    if (!editingRating) return;

    setUpdating(true);
    try {
      const updatedRating = await updateUserRating(
        editingRating.id, 
        user.sub, 
        updateData, 
        editReason
      );
      
      setUserOwnRating({ ...userOwnRating, ...updatedRating });
      await loadRatingData();

      setShowEditForm(false);
      setEditingRating(null);
      Alert.alert('Success', 'Your rating has been updated successfully');
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to update rating');
    } finally {
      setUpdating(false);
    }
  };

  const handleDeleteUserRating = () => {
    Alert.alert(
      'Delete Rating',
      'Are you sure you want to delete your rating? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteUserRating(userOwnRating.id, user.sub);
              setUserOwnRating(null);
              setHasRated(false);
              await loadRatingData();
              Alert.alert('Success', 'Rating deleted successfully');
            } catch (error) {
              Alert.alert('Error', error.message || 'Failed to delete rating');
            }
          }
        }
      ]
    );
  };

  const handleSubmitRating = async (ratingData, errorMessage) => {
    if (!ratingData && errorMessage) {
      Alert.alert('Rating Required', errorMessage);
      return;
    }

    try {
      const ipAddress = await getUserIP();
      const userAgent = navigator?.userAgent || null;
      
      const newRating = await submitVetRating(ratingData, user, ipAddress, userAgent);
      setShowRatingForm(false);
      setHasRated(true);
      setUserOwnRating(newRating);
      
      await loadRatingData();
      Alert.alert('Success', 'Thank you for your rating!');
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to submit rating');
    }
  };

  const handleReportRating = async (ratingId, reason, details) => {
    try {
      await reportRating(ratingId, user.sub, reason, details);
      Alert.alert('Report Submitted', 'Thank you for your report. We will review it shortly.');
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to submit report');
    }
  };

  const handleEditUserRating = () => {
    setEditingRating(userOwnRating);
    setShowEditForm(true);
  };

  const getUserIP = async () => {
    try {
      return null;
    } catch (error) {
      return null;
    }
  };
  
  if (loading) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <ProgressBar indeterminate color={colors.primary} style={styles.progressBar} />
        <ThemedText style={styles.loadingText}>Loading clinic details...</ThemedText>
      </ThemedView>
    );
  }
  
  if (!clinic) {
    return (
      <ThemedView style={styles.errorContainer}>
        <Avatar.Icon size={64} icon="hospital-building" backgroundColor={chipColors.background} />
        <ThemedText type="title" style={styles.errorTitle}>Clinic Not Found</ThemedText>
        <ThemedText style={styles.errorText}>
          This veterinary clinic is not available or has been removed.
        </ThemedText>
        <ThemedButton onPress={() => router.back()} style={styles.backButton}>
          Go Back
        </ThemedButton>
      </ThemedView>
    );
  }
  
  return (
    <ThemedView style={styles.container}>
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Clinic Header Card */}
        <ThemedCard style={styles.headerCard} variant="elevated">
          {clinic.cover_photo_url ? (
          <Card.Cover 
            source={{ uri: clinic.cover_photo_url }} 
            style={styles.coverPhoto}
          />
        ) : (
          <View style={[styles.placeholderCover, { backgroundColor: colors.backgroundSecondary }]}>
            <Avatar.Icon 
              size={80} 
              icon="hospital-building"
              backgroundColor="transparent"
              color={colors.primary}
            />
          </View>
        )}
          
          <View style={styles.headerContent}>
            <ThemedText type="title" style={styles.clinicName}>
              {clinic.clinic_name}
            </ThemedText>
            
            <Pressable onPress={handleMapPress} style={styles.addressContainer}>
              <ThemedText style={styles.address}>
                {clinic.full_address}
              </ThemedText>
              <IconButton
                icon="map-marker"
                size={20}
                iconColor={colors.primary}
                style={styles.mapButton}
              />
            </Pressable>
            
            {clinic.sub_district && (
              <ThemedText style={styles.subLocation}>
                {clinic.sub_district}, {clinic.district}
              </ThemedText>
            )}
          </View>
        </ThemedCard>
        
        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <ThemedButton 
            variant="primary"
            onPress={() => handleCall(clinic.primary_contact)}
            style={styles.primaryAction}
            icon="phone"
          >
            Call Now
          </ThemedButton>
          
          <ThemedButton 
            variant="outlined"
            onPress={handleMapPress}
            style={styles.secondaryAction}
            icon="map-marker"
          >
            Directions
          </ThemedButton>
        </View>
        
        {/* Essential Info Grid */}
        <View style={styles.infoGrid}>
          <ThemedCard style={styles.infoCard} variant="flat">
            <View style={styles.infoCardContent}>
              <IconButton 
                icon="phone" 
                size={20} 
                iconColor={colors.primary}
                style={styles.infoIcon}
              />
              <View style={styles.infoText}>
                <ThemedText style={styles.infoLabel}>Contact</ThemedText>
                <ThemedText style={styles.infoValue}>{clinic.primary_contact}</ThemedText>
              </View>
            </View>
          </ThemedCard>
          
          <ThemedCard style={styles.infoCard} variant="flat">
            <View style={styles.infoCardContent}>
              <IconButton 
                icon="clock" 
                size={20} 
                iconColor={colors.primary}
                style={styles.infoIcon}
              />
              <View style={styles.infoText}>
                <ThemedText style={styles.infoLabel}>Hours Today</ThemedText>
                <ThemedText style={styles.infoValue}>
                  {clinic.sat_to_thu_from} - {clinic.sat_to_thu_to}
                </ThemedText>
              </View>
            </View>
          </ThemedCard>
        </View>

        {/* Rating Section */}
        <ThemedCard style={styles.ratingCard} variant="elevated">
          <View style={styles.ratingContent}>
            <RatingDisplay 
              ratingSummary={ratingSummary} 
              showDetails={true}
            />
            
            {user && !hasRated && (
              <ThemedButton 
                variant="outlined"
                onPress={() => setShowRatingForm(true)}
                style={styles.rateButton}
                icon="star"
              >
                Rate This Clinic
              </ThemedButton>
            )}
          </View>
        </ThemedCard>

        {/* User's Own Rating */}
        {user && userOwnRating && (
          <UserOwnRating
            userRating={userOwnRating}
            onEdit={handleEditUserRating}
            onDelete={handleDeleteUserRating}
          />
        )}
        
        {/* Expandable Sections */}
        {clinic.doctors && clinic.doctors.length > 0 && (
          <ThemedCard style={styles.sectionCard} variant="outlined">
            <List.Accordion
              title="Our Doctors"
              left={props => <List.Icon {...props} icon="doctor" color={colors.primary} />}
              expanded={doctorsExpanded}
              onPress={() => setDoctorsExpanded(!doctorsExpanded)}
              style={styles.accordion}
              titleStyle={[styles.accordionTitle, { color: colors.text }]}
            >
              {clinic.doctors.map((doctor, index) => (
                <Surface key={index} style={styles.doctorItem}>
                  <View style={styles.doctorHeader}>
                    <Avatar.Image 
                      size={48} 
                      source={doctor.photo ? { uri: doctor.photo } : null}
                    />
                    <View style={styles.doctorInfo}>
                      <ThemedText style={styles.doctorName}>{doctor.fullName}</ThemedText>
                      {doctor.degrees && (
                        <ThemedText style={styles.doctorDegrees}>{doctor.degrees}</ThemedText>
                      )}
                      {doctor.phoneNumber && (
                        <Pressable 
                          onPress={() => handleCall(doctor.phoneNumber)}
                          style={styles.doctorPhone}
                        >
                          <ThemedText style={styles.phoneText}>{doctor.phoneNumber}</ThemedText>
                          <IconButton 
                            icon="phone" 
                            size={16} 
                            iconColor={colors.primary}
                            style={styles.phoneIcon}
                          />
                        </Pressable>
                      )}
                    </View>
                  </View>
                </Surface>
              ))}
            </List.Accordion>
          </ThemedCard>
        )}
        
        {clinic.services && clinic.services.length > 0 && (
          <ThemedCard style={styles.sectionCard} variant="outlined">
            <List.Accordion
              title="Services & Pricing"
              left={props => <List.Icon {...props} icon="medical-bag" color={colors.primary} />}
              expanded={servicesExpanded}
              onPress={() => setServicesExpanded(!servicesExpanded)}
              style={styles.accordion}
              titleStyle={[styles.accordionTitle, { color: colors.text }]}
            >
              <View style={styles.servicesContainer}>
                {clinic.services.map((service, index) => (
                  <View key={index} style={styles.serviceRow}>
                    <ThemedText style={styles.serviceName}>
                      {service.serviceName}
                    </ThemedText>
                    {service.fee && (
                      <Chip 
                        style={[styles.priceChip, { backgroundColor: chipColors.background }]}
                        textStyle={{ color: chipColors.text }}
                      >
                        ৳{service.fee}
                      </Chip>
                    )}
                  </View>
                ))}
              </View>
            </List.Accordion>
          </ThemedCard>
        )}
        
        {clinic.notices && (
          <ThemedCard style={styles.sectionCard} variant="outlined">
            <List.Accordion
              title="Special Notices"
              left={props => <List.Icon {...props} icon="bell" color={colors.primary} />}
              expanded={noticesExpanded}
              onPress={() => setNoticesExpanded(!noticesExpanded)}
              style={styles.accordion}
              titleStyle={[styles.accordionTitle, { color: colors.text }]}
            >
              <View style={styles.noticesContainer}>
                <ThemedText style={styles.noticesText}>{clinic.notices}</ThemedText>
              </View>
            </List.Accordion>
          </ThemedCard>
        )}

        {/* Other Reviews */}
        {ratingSummary.total_ratings > 0 && (
          <ThemedCard style={styles.sectionCard} variant="outlined">
            <List.Accordion
              title={`Reviews (${Math.max(0, ratingSummary.total_ratings - (hasRated ? 1 : 0))})`}
              left={props => <List.Icon {...props} icon="comment-multiple" color={colors.primary} />}
              expanded={ratingsExpanded}
              onPress={() => setRatingsExpanded(!ratingsExpanded)}
              style={styles.accordion}
              titleStyle={[styles.accordionTitle, { color: colors.text }]}
            >
              <RatingsList
                ratings={ratings}
                onReport={handleReportRating}
                onSortChange={handleSortChange}
                currentSort={currentSort}
              />
            </List.Accordion>
          </ThemedCard>
        )}
      </ScrollView>

      {/* Floating Action Button */}
      <FAB
        icon="phone"
        style={[styles.fab, { backgroundColor: colors.primary }]}
        onPress={() => handleCall(clinic.primary_contact)}
        label="Call"
        visible={true}
      />

      {/* Rating Form Modal */}
      <Modal
        visible={showRatingForm}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowRatingForm(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: cardColors.background }]}>
            <RatingForm
              clinicId={clinic.id}
              clinicName={clinic.clinic_name}
              onSubmit={handleSubmitRating}
              onCancel={() => setShowRatingForm(false)}
            />
          </View>
        </View>
      </Modal>

      {/* Edit Form Modal */}
      <Modal
        visible={showEditForm}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowEditForm(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: cardColors.background }]}>
            {editingRating && (
              <RatingEditForm
                rating={editingRating}
                onSubmit={handleUpdateUserRating}
                onCancel={() => {
                  setShowEditForm(false);
                  setEditingRating(null);
                }}
                loading={updating}
              />
            )}
          </View>
        </View>
      </Modal>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100, // Space for FAB
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  progressBar: {
    width: '60%',
    marginBottom: 16,
  },
  loadingText: {
    marginTop: 8,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
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
  
  // Header Section
  headerCard: {
    margin: 0,
    borderRadius: 0,
    overflow: 'hidden',
  },
  coverPhoto: {
    minHeight: 160,
    width: "100%",
    borderRadius: 0,  
  },
  coverImageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderCover: {
    height: 160,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  headerContent: {
    padding: 16,
  },
  clinicName: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  addressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  address: {
    flex: 1,
    fontSize: 14,
    opacity: 0.8,
  },
  mapButton: {
    margin: 0,
  },
  subLocation: {
    fontSize: 12,
    opacity: 0.6,
  },
  
  // Quick Actions
  quickActions: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  primaryAction: {
    flex: 2,
  },
  secondaryAction: {
    flex: 1,
  },
  
  // Info Grid
  infoGrid: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 8,
    marginBottom: 8,
  },
  infoCard: {
    flex: 1,
    padding: 12,
  },
  infoCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoIcon: {
    margin: 0,
    marginRight: 8,
  },
  infoText: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 11,
    opacity: 0.6,
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 13,
    fontWeight: '500',
  },
  
  // Rating Section
  ratingCard: {
    marginHorizontal: 16,
    marginBottom: 8,
  },
  ratingContent: {
    padding: 16,
  },
  rateButton: {
    marginTop: 12,
  },
  
  // Expandable Sections
  sectionCard: {
    marginHorizontal: 16,
    marginBottom: 8,
  },
  accordion: {
    backgroundColor: 'transparent',
  },
  accordionTitle: {
    fontWeight: '600',
    fontSize: 15,
  },
  
  // Doctors Section
  doctorItem: {
    marginHorizontal: 16,
    marginBottom: 8,
    padding: 12,
    borderRadius: 8,
  },
  doctorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  doctorInfo: {
    flex: 1,
    marginLeft: 12,
  },
  doctorName: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  doctorDegrees: {
    fontSize: 12,
    opacity: 0.7,
    marginBottom: 4,
  },
  doctorPhone: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  phoneText: {
    fontSize: 12,
    flex: 1,
  },
  phoneIcon: {
    margin: 0,
  },
  
  // Services Section
  servicesContainer: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  serviceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  serviceName: {
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  priceChip: {
    marginLeft: 8,
  },
  
  // Notices Section
  noticesContainer: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  noticesText: {
    fontSize: 13,
    lineHeight: 18,
    opacity: 0.8,
  },
  
  // FAB
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
  
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  modalContent: {
    width: '100%',
    maxWidth: 400,
    maxHeight: '90%',
    borderRadius: 12,
  },
});