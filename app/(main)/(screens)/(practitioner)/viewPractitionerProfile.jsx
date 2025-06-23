// app/(main)/(screens)/(practitioner)/viewPractitionerProfile.jsx
import React, { useState, useEffect } from 'react';
import { ScrollView, StyleSheet, View, ActivityIndicator, Alert, Linking, Modal } from 'react-native';
import { 
  Card, 
  Text, 
  Avatar, 
  Button, 
  Chip,
  Divider,
  List,
  Badge,
  IconButton
} from 'react-native-paper';
import { ThemedView } from '@/components/themes/ThemedView';
import { useColorScheme } from '@/hooks/useColorScheme.native';
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
  const colorScheme = useColorScheme();
  const { user, currentRole } = useAuth();
  const { profileId } = useLocalSearchParams();
  const isDark = colorScheme === 'dark';

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
          <ActivityIndicator size="large" />
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      </ThemedView>
    );
  }

  if (error || !profile) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error || 'Profile not found'}</Text>
          <Button 
            mode="contained" 
            onPress={() => router.back()}
            style={styles.backButton}
          >
            Go Back
          </Button>
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Profile Header */}
        <Card style={styles.headerCard}>
          <Card.Content>
            <View style={styles.headerContent}>
              <Avatar.Image 
                size={80} 
                source={{ uri: profile.profile_photo_url || 'https://via.placeholder.com/80' }}
                style={styles.avatar}
              />
              <View style={styles.headerInfo}>
                <Text style={styles.practitionerName}>{profile.full_name}</Text>
                <Text style={styles.designation}>{profile.designation}</Text>
                <Text style={styles.location}>
                  {profile.sub_district}, {profile.district}
                </Text>
                <Badge style={styles.verifiedBadge}>
                  ✅ Verified Practitioner
                </Badge>
              </View>
            </View>
          </Card.Content>
        </Card>

        {/* Rating Display */}
        <PractitionerRatingDisplay 
          ratingSummary={ratingSummary} 
          showDetails={true}
        />

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
          <Card style={styles.actionCard}>
            <Card.Content>
              <Button
                mode="contained"
                onPress={() => setShowRatingForm(true)}
                style={styles.rateButton}
              >
                Rate This Practitioner
              </Button>
            </Card.Content>
          </Card>
        )}

        {/* Professional Details */}
        <Card style={styles.detailsCard}>
          <Card.Content>
            <List.Section>
              <List.Subheader>Professional Information</List.Subheader>
              
              <List.Item
                title="Degrees & Certificates"
                description={profile.degrees_certificates}
                left={props => <List.Icon {...props} icon="school" />}
              />
              
              <List.Item
                title="BVC Registration"
                description={profile.bvc_registration_number}
                left={props => <List.Icon {...props} icon="card-account-details" />}
              />
              
              <List.Item
                title="Areas of Expertise"
                description={profile.areas_of_expertise}
                left={props => <List.Icon {...props} icon="star" />}
              />
            </List.Section>
          </Card.Content>
        </Card>

        {/* Contact & Location */}
        <Card style={styles.contactCard}>
          <Card.Content>
            <List.Section>
              <List.Subheader>Contact & Location</List.Subheader>
              
              <List.Item
                title="Chamber Address"
                description={`${profile.chamber_address}, ${profile.sub_district}, ${profile.district}`}
                left={props => <List.Icon {...props} icon="map-marker" />}
                right={props => (
                  <IconButton
                    {...props}
                    icon="directions"
                    onPress={handleDirectionsPress}
                  />
                )}
              />
              
              <List.Item
                title="Contact Number"
                description={profile.contact_info}
                left={props => <List.Icon {...props} icon="phone" />}
                right={props => (
                  <IconButton
                    {...props}
                    icon="phone"
                    onPress={() => handleContactPress(profile.contact_info)}
                  />
                )}
              />
              
              {profile.whatsapp_number && (
                <List.Item
                  title="WhatsApp"
                  description={profile.whatsapp_number}
                  left={props => <List.Icon {...props} icon="whatsapp" />}
                  right={props => (
                    <IconButton
                      {...props}
                      icon="whatsapp"
                      onPress={() => handleWhatsAppPress(profile.whatsapp_number)}
                    />
                  )}
                />
              )}
            </List.Section>
          </Card.Content>
        </Card>

        {/* Action Buttons */}
        <Card style={styles.actionCard}>
          <Card.Content>
            <View style={styles.actionButtons}>
              <Button
                mode="contained"
                style={[styles.actionButton, { backgroundColor: '#25D366' }]}
                onPress={() => handleWhatsAppPress(profile.whatsapp_number || profile.contact_info)}
                icon="whatsapp"
              >
                WhatsApp
              </Button>
              <Button
                mode="outlined"
                style={styles.actionButton}
                onPress={handleRequestService}
                icon="medical-bag"
              >
                Request Service
              </Button>
              <Button
                mode="outlined"
                style={styles.actionButton}
                onPress={handleBookAppointment}
                icon="calendar-clock"
              >
                Book Appointment
              </Button>
            </View>
          </Card.Content>
        </Card>

        {/* Ratings & Reviews */}
        <Card style={styles.ratingsCard}>
          <Card.Content>
            <List.Accordion
              title={`Reviews & Ratings (${ratingSummary.total_ratings})`}
              expanded={ratingsExpanded}
              onPress={() => setRatingsExpanded(!ratingsExpanded)}
            >
              <PractitionerRatingsList
                ratings={ratings}
                onReport={handleReportRating}
                onSortChange={handleSortChange}
                currentSort={currentSort}
              />
            </List.Accordion>
          </Card.Content>
        </Card>

        {/* Spacing at bottom */}
        <View style={styles.bottomSpacing} />

        {/* Rating Form Modal */}
        <Modal
          visible={showRatingForm}
          onDismiss={() => setShowRatingForm(false)}
          contentContainerStyle={styles.modalContainer}
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
          contentContainerStyle={styles.modalContainer}
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
    color: '#666',
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
    color: '#666',
    marginBottom: 4,
  },
  location: {
    fontSize: 14,
    color: '#888',
    marginBottom: 8,
  },
  verifiedBadge: {
    backgroundColor: '#4CAF50',
    alignSelf: 'flex-start',
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
  actionButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    minWidth: 100,
  },
  rateButton: {
    alignSelf: 'center',
    minWidth: 200,
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
    backgroundColor: 'white',
    borderRadius: 8,
    maxHeight: '90%',
  },
});