// app/(main)/(screens)/(practitioner)/viewPractitionerProfile.jsx
import React, { useState, useEffect } from 'react';
import { ScrollView, StyleSheet, View, ActivityIndicator, Alert, Linking, Modal } from 'react-native';
import { 
  Text, 
  Avatar, 
  Chip,
  Divider,
  List,
  Badge,
  IconButton
} from 'react-native-paper';
import { ThemedView } from '@/components/themes/ThemedView';
import { ThemedText } from '@/components/themes/ThemedText';
import { ThemedCard } from '@/components/themes/ThemedCard';
import { ThemedButton } from '@/components/themes/ThemedButton';
import { useTheme } from '@/contexts/ThemeContext';
import { 
  useActivityIndicatorColors, 
  useBadgeColors,
  useCardColors 
} from '@/hooks/useThemeColor';
import { useAuth } from '@/contexts/AuthContext';
import { useLocalSearchParams, router } from 'expo-router';
import { getPractitionerProfileById } from '@/services/supabase';

// Import practitioner rating components
import { PractitionerRatingDisplay } from '@/components/practitioners/PractitionerRatingDisplay';
import { PractitionerRatingForm } from '@/components/practitioners/PractitionerRatingForm';
import { PractitionerRatingsList } from '@/components/practitioners/PractitionerRatingsList';
import { PractitionerUserOwnRating } from '@/components/practitioners/PractitionerUserOwnRating';
import { PractitionerRatingEditForm } from '@/components/practitioners/PractitionerRatingEditForm';

// Import practitioner rating services
import { 
  getPractitionerRatingSummary, 
  getPractitionerRatings, 
  submitPractitionerRating, 
  hasUserRatedPractitioner, 
  getUserPractitionerRating,
  updatePractitionerRating,
  deletePractitionerRating,
  reportPractitionerRating
} from '@/services/supabase';

export default function ViewPractitionerProfileScreen() {
  const { colors, brandColors, isDark } = useTheme();
  const activityIndicatorColors = useActivityIndicatorColors();
  const badgeColors = useBadgeColors();
  const cardColors = useCardColors();
  const { user, currentRole } = useAuth();
  const { profileId } = useLocalSearchParams();

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Rating-related state
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

  useEffect(() => {
    fetchProfile();
  }, [profileId]);

  useEffect(() => {
    if (profile?.id) {
      loadRatingData();
    }
  }, [profile?.id, user?.sub]);

  const fetchProfile = async () => {
    if (!profileId) {
      setError('No profile ID provided');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const result = await getPractitionerProfileById(profileId);
      
      if (result.success && result.data) {
        setProfile(result.data);
      } else {
        setError('Profile not found or not verified');
      }
    } catch (error) {
      console.error('Error fetching public profile:', error);
      setError('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const loadRatingData = async () => {
    try {
      const [summary, ratingsList, userHasRated, userRating] = await Promise.all([
        getPractitionerRatingSummary(profile.id),
        getPractitionerRatings(profile.id, { limit: 10, sortBy: currentSort }),
        user?.sub ? hasUserRatedPractitioner(user.sub, profile.id) : false,
        user?.sub ? getUserPractitionerRating(user.sub, profile.id) : null
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
      const sortedRatings = await getPractitionerRatings(profile.id, { 
        limit: 10, 
        sortBy: newSort 
      });
      setRatings(sortedRatings);
    } catch (error) {
      console.error('Error sorting ratings:', error);
    }
  };

  const handleSubmitRating = async (ratingData, errorMessage = null) => {
    if (errorMessage) {
      Alert.alert('Error', errorMessage);
      return;
    }

    if (!user) {
      Alert.alert('Sign In Required', 'Please sign in to submit a rating.');
      return;
    }

    try {
      await submitPractitionerRating(ratingData, user);
      
      // Refresh rating data
      await loadRatingData();
      
      setShowRatingForm(false);
      Alert.alert('Success', 'Your rating has been submitted successfully!');
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to submit rating');
    }
  };

  const handleUpdateUserRating = async (updateData, editReason) => {
    if (!editingRating) return;

    setUpdating(true);
    try {
      const updatedRating = await updatePractitionerRating(
        editingRating.id, 
        user.sub, 
        updateData, 
        editReason
      );
      
      // Update the user's own rating
      setUserOwnRating({ ...userOwnRating, ...updatedRating });
      
      // Reload rating data to update summary
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
              await deletePractitionerRating(userOwnRating.id, user.sub);
              await loadRatingData();
              Alert.alert('Success', 'Your rating has been deleted');
            } catch (error) {
              Alert.alert('Error', error.message || 'Failed to delete rating');
            }
          }
        }
      ]
    );
  };

  const handleReportRating = async (ratingId, reportReason, reportDetails) => {
    try {
      await reportPractitionerRating(ratingId, user.sub, reportReason, reportDetails);
    } catch (error) {
      throw error;
    }
  };

  const handleContactPress = (contactNumber) => {
    const phoneNumber = contactNumber.replace(/\s/g, '');
    Linking.openURL(`tel:${phoneNumber}`);
  };

  const handleWhatsAppPress = (whatsappNumber) => {
    const phoneNumber = whatsappNumber.replace(/\s/g, '');
    const message = encodeURIComponent(`Hello ${profile.full_name}, I found your profile on FarmFit and would like to inquire about your veterinary services.`);
    Linking.openURL(`whatsapp://send?phone=+88${phoneNumber}&text=${message}`);
  };

  const handleDirectionsPress = () => {
    const address = encodeURIComponent(`${profile.chamber_address}, ${profile.sub_district}, ${profile.district}`);
    Linking.openURL(`https://maps.google.com/?q=${address}`);
  };

  const handleRequestService = () => {
    Alert.alert(
      'Service Request',
      'Service request feature will be available soon!',
      [{ text: 'OK' }]
    );
  };

  const handleBookAppointment = () => {
    Alert.alert(
      'Book Appointment',
      'Appointment booking feature will be available soon!',
      [{ text: 'OK' }]
    );
  };

  if (loading) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={activityIndicatorColors.primary} />
          <ThemedText style={[styles.loadingText, { color: colors.textSecondary }]}>
            Loading profile...
          </ThemedText>
        </View>
      </ThemedView>
    );
  }

  if (error || !profile) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.errorContainer}>
          <ThemedText style={[styles.errorText, { color: brandColors.error }]}>
            {error || 'Profile not found'}
          </ThemedText>
          <ThemedButton 
            variant="primary"
            onPress={() => router.back()}
            style={styles.backButton}
          >
            Go Back
          </ThemedButton>
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Profile Header */}
        <ThemedCard variant="elevated" elevation={2} style={styles.headerCard}>
          <View style={styles.headerContent}>
            <Avatar.Image 
              size={80} 
              source={{ uri: profile.profile_photo_url || 'https://via.placeholder.com/80' }}
              style={styles.avatar}
            />
            <View style={styles.headerInfo}>
              <Text style={[styles.practitionerName, { color: colors.text }]}>
                {profile.full_name}
              </Text>
              <Text style={[styles.designation, { color: brandColors.primary }]}>
                {profile.designation}
              </Text>
              <Text style={[styles.location, { color: colors.textSecondary }]}>
                {profile.sub_district}, {profile.district}
              </Text>
              <Badge style={[styles.verifiedBadge, { backgroundColor: brandColors.success }]}>
                ✅ Verified Practitioner
              </Badge>
            </View>
          </View>
        </ThemedCard>

        {/* User's Own Rating */}
        {user && userOwnRating && (
          <PractitionerUserOwnRating
            userRating={userOwnRating}
            onEdit={() => {
              setEditingRating(userOwnRating);
              setShowEditForm(true);
            }}
            onDelete={handleDeleteUserRating}
          />
        )}

        {/* Rating Action Buttons */}
        {user && !hasRated && (
          <ThemedCard variant="elevated" elevation={1} style={styles.actionCard}>
            <View style={styles.cardContent}>
              <ThemedButton
                variant="primary"
                onPress={() => setShowRatingForm(true)}
                style={styles.rateButton}
                icon="star"
              >
                Rate This Practitioner
              </ThemedButton>
            </View>
          </ThemedCard>
        )}

        {/* Professional Details */}
        <ThemedCard variant="elevated" elevation={1} style={styles.detailsCard}>
          <View style={styles.cardTitleContainer}>
            <ThemedText type="subtitle" style={styles.cardTitle}>
              Professional Information
            </ThemedText>
          </View>
          <View style={styles.cardContent}>
            <List.Item
              title="Degrees & Certificates"
              description={profile.degrees_certificates}
              left={props => <List.Icon {...props} icon="school" color={colors.textSecondary} />}
              titleStyle={{ color: colors.text }}
              descriptionStyle={{ color: colors.textSecondary }}
            />
            
            <Divider style={{ backgroundColor: colors.border }} />
            
            <List.Item
              title="BVC Registration"
              description={profile.bvc_registration_number}
              left={props => <List.Icon {...props} icon="card-account-details" color={colors.textSecondary} />}
              titleStyle={{ color: colors.text }}
              descriptionStyle={{ color: colors.textSecondary }}
            />
            
            <Divider style={{ backgroundColor: colors.border }} />
            
            <List.Item
              title="Areas of Expertise"
              description={profile.areas_of_expertise}
              left={props => <List.Icon {...props} icon="star" color={colors.textSecondary} />}
              titleStyle={{ color: colors.text }}
              descriptionStyle={{ color: colors.textSecondary }}
            />
          </View>
        </ThemedCard>

        {/* Contact & Location */}
        <ThemedCard variant="elevated" elevation={1} style={styles.contactCard}>
          <View style={styles.cardTitleContainer}>
            <ThemedText type="subtitle" style={styles.cardTitle}>
              Contact & Location
            </ThemedText>
          </View>
          <View style={styles.cardContent}>
            <List.Item
              title="Chamber Address"
              description={`${profile.chamber_address}, ${profile.sub_district}, ${profile.district}`}
              left={props => <List.Icon {...props} icon="map-marker" color={colors.textSecondary} />}
              right={props => (
                <IconButton
                  {...props}
                  icon="directions"
                  iconColor={brandColors.primary}
                  onPress={handleDirectionsPress}
                />
              )}
              titleStyle={{ color: colors.text }}
              descriptionStyle={{ color: colors.textSecondary }}
            />
            
            <Divider style={{ backgroundColor: colors.border }} />
            
            <List.Item
              title="Contact Number"
              description={profile.contact_info}
              left={props => <List.Icon {...props} icon="phone" color={colors.textSecondary} />}
              right={props => (
                <IconButton
                  {...props}
                  icon="phone"
                  iconColor={brandColors.primary}
                  onPress={() => handleContactPress(profile.contact_info)}
                />
              )}
              titleStyle={{ color: colors.text }}
              descriptionStyle={{ color: colors.textSecondary }}
            />
            
            {profile.whatsapp_number && (
              <>
                <Divider style={{ backgroundColor: colors.border }} />
                <List.Item
                  title="WhatsApp"
                  description={profile.whatsapp_number}
                  left={props => <List.Icon {...props} icon="whatsapp" color={colors.textSecondary} />}
                  right={props => (
                    <IconButton
                      {...props}
                      icon="whatsapp"
                      iconColor="#25D366"
                      onPress={() => handleWhatsAppPress(profile.whatsapp_number)}
                    />
                  )}
                  titleStyle={{ color: colors.text }}
                  descriptionStyle={{ color: colors.textSecondary }}
                />
              </>
            )}
          </View>
        </ThemedCard>

        {/* Action Buttons - New Layout */}
        <ThemedCard variant="elevated" elevation={1} style={styles.actionCard}>
          <View style={styles.cardContent}>
            {/* First Row: WhatsApp + Request Service */}
            <View style={styles.actionRow}>
              <ThemedButton
                onPress={() => handleWhatsAppPress(profile.whatsapp_number || profile.contact_info)}
                style={[styles.actionButtonHalf, { backgroundColor: '#25D366' }]}
                labelStyle={{ color: colors.textInverse }}
                icon="whatsapp"
              >
                WhatsApp
              </ThemedButton>
              
              <ThemedButton
                variant="outlined"
                style={styles.actionButtonHalf}
                onPress={handleRequestService}
                icon="medical-bag"
              >
                Request Service
              </ThemedButton>
            </View>
            
            {/* Second Row: Book Appointment */}
            <View style={styles.actionRow}>
              <ThemedButton
                variant="outlined"
                style={styles.actionButtonFull}
                onPress={handleBookAppointment}
                icon="calendar-clock"
              >
                Book Appointment
              </ThemedButton>
            </View>
          </View>
        </ThemedCard>

        {/* Rating Display - Moved Here */}
        <PractitionerRatingDisplay 
          ratingSummary={ratingSummary} 
          showDetails={true}
        />

        {/* Ratings & Reviews */}
        <ThemedCard variant="elevated" elevation={1} style={styles.ratingsCard}>
          <View style={styles.cardContent}>
            <List.Accordion
              title={`Reviews & Ratings (${ratingSummary.total_ratings})`}
              expanded={ratingsExpanded}
              onPress={() => setRatingsExpanded(!ratingsExpanded)}
              titleStyle={{ color: colors.text }}
              descriptionStyle={{ color: colors.textSecondary }}
            >
              <PractitionerRatingsList
                ratings={ratings}
                onReport={handleReportRating}
                onSortChange={handleSortChange}
                currentSort={currentSort}
              />
            </List.Accordion>
          </View>
        </ThemedCard>

        {/* Spacing at bottom */}
        <View style={styles.bottomSpacing} />

        {/* Rating Form Modal */}
        <Modal
          visible={showRatingForm}
          onDismiss={() => setShowRatingForm(false)}
          contentContainerStyle={[styles.modalContainer, { backgroundColor: cardColors.background }]}
        >
          <PractitionerRatingForm
            practitionerId={profile.id}
            practitionerName={profile.full_name}
            onSubmit={handleSubmitRating}
            onCancel={() => setShowRatingForm(false)}
          />
        </Modal>

        {/* Edit Rating Modal */}
        <Modal
          visible={showEditForm}
          onDismiss={() => setShowEditForm(false)}
          contentContainerStyle={[styles.modalContainer, { backgroundColor: cardColors.background }]}
        >
          {editingRating && (
            <PractitionerRatingEditForm
              rating={editingRating}
              practitionerName={profile.full_name}
              onSubmit={handleUpdateUserRating}
              onCancel={() => {
                setShowEditForm(false);
                setEditingRating(null);
              }}
              isUpdating={updating}
            />
          )}
        </Modal>
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
    padding: 32,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
  },
  backButton: {
    minWidth: 120,
  },
  headerCard: {
    margin: 16,
    marginBottom: 8,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
  },
  avatar: {
    marginRight: 16,
  },
  headerInfo: {
    flex: 1,
  },
  practitionerName: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  designation: {
    fontSize: 16,
    marginBottom: 4,
    fontWeight: '500',
  },
  location: {
    fontSize: 14,
    marginBottom: 8,
    opacity: 0.8,
  },
  verifiedBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 4,
    minHeight: 28
  },
  detailsCard: {
    margin: 16,
    marginVertical: 8,
  },
  contactCard: {
    margin: 16,
    marginVertical: 8,
  },
  actionCard: {
    margin: 16,
    marginVertical: 8,
  },
  cardTitleContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  cardContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    marginTop: 16
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  actionButtonHalf: {
    flex: 1,
    paddingVertical: 8,
  },
  actionButtonFull: {
    flex: 1,
    paddingVertical: 8,
  },
  rateButton: {
    alignSelf: 'center',
    minWidth: 200,
    paddingVertical: 8,
  },
  ratingsCard: {
    margin: 16,
    marginVertical: 8,
  },
  bottomSpacing: {
    height: 32,
  },
  modalContainer: {
    margin: 16,
    borderRadius: 12,
    maxHeight: '90%',
  },
});