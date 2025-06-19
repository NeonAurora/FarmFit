// app/(main)/(screens)/(practitioner)/viewPractitionerProfile.jsx
import React, { useState, useEffect } from 'react';
import { ScrollView, StyleSheet, View, ActivityIndicator, Alert, Linking } from 'react-native';
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
import { useColorScheme } from '@/hooks/useColorScheme';
import { useAuth } from '@/contexts/AuthContext';
import { useLocalSearchParams, router } from 'expo-router';
import { getPractitionerProfileById } from '@/services/supabase';

export default function ViewPractitionerProfileScreen() {
  const colorScheme = useColorScheme();
  const { user, currentRole } = useAuth();
  const { profileId } = useLocalSearchParams();
  const isDark = colorScheme === 'dark';

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchProfile();
  }, [profileId]);

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
    // Hook for Layer 6 - Service Request System
    Alert.alert(
      'Service Request',
      'Service request feature will be available soon!',
      [
        { text: 'OK' }
      ]
    );
  };

  const handleBookAppointment = () => {
    // Hook for Layer 7 - Appointment System
    Alert.alert(
      'Book Appointment',
      'Appointment booking feature will be available soon!',
      [
        { text: 'OK' }
      ]
    );
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
        
        {/* Header Card with Profile Photo and Basic Info */}
        <Card style={styles.headerCard}>
          <Card.Content style={styles.headerContent}>
            <View style={styles.profileSection}>
              <View style={styles.profilePhotoContainer}>
                {profile.profile_photo_url ? (
                  <Avatar.Image 
                    size={120} 
                    source={{ uri: profile.profile_photo_url }} 
                  />
                ) : (
                  <Avatar.Text 
                    size={120} 
                    label={profile.full_name?.charAt(0)?.toUpperCase() || 'P'} 
                    backgroundColor="#27AE60"
                  />
                )}
                
                {/* Verified Badge */}
                <Badge style={styles.verifiedBadge}>
                  Verified ✅
                </Badge>
              </View>
              
              <View style={styles.profileInfo}>
                <Text variant="headlineSmall" style={styles.practitionerName}>
                  {profile.full_name}
                </Text>
                <Text variant="titleMedium" style={styles.designation}>
                  {profile.designation}
                </Text>
                <Text variant="bodyMedium" style={styles.degrees}>
                  {profile.degrees_certificates}
                </Text>
                
                {/* Location Chip */}
                <Chip 
                  mode="outlined" 
                  style={styles.locationChip}
                  icon="map-marker"
                >
                  {profile.sub_district}, {profile.district}
                </Chip>
              </View>
            </View>
            
            {/* Quick Contact Actions */}
            <View style={styles.quickContactContainer}>
              <IconButton
                icon="phone"
                mode="contained"
                size={30}
                iconColor="#fff"
                containerColor="#27AE60"
                onPress={() => handleContactPress(profile.contact_info)}
                style={styles.contactIcon}
              />
              
              {profile.whatsapp_number && (
                <IconButton
                  icon="whatsapp"
                  mode="contained"
                  size={30}
                  iconColor="#fff"
                  containerColor="#25D366"
                  onPress={() => handleWhatsAppPress(profile.whatsapp_number)}
                  style={styles.contactIcon}
                />
              )}
              
              <IconButton
                icon="map"
                mode="contained"
                size={30}
                iconColor="#fff"
                containerColor="#3498DB"
                onPress={handleDirectionsPress}
                style={styles.contactIcon}
              />
            </View>
          </Card.Content>
        </Card>

        {/* Action Buttons - Only for Pet Owners */}
        {currentRole === 'pet_owner' && (
          <Card style={styles.actionsCard}>
            <Card.Content>
              <View style={styles.actionButtons}>
                <Button
                  mode="contained"
                  onPress={handleRequestService}
                  style={styles.primaryAction}
                  icon="clipboard-plus"
                >
                  Request Service
                </Button>
                
                <Button
                  mode="outlined"
                  onPress={handleBookAppointment}
                  style={styles.secondaryAction}
                  icon="calendar-plus"
                >
                  Book Appointment
                </Button>
              </View>
            </Card.Content>
          </Card>
        )}

        {/* Professional Credentials */}
        <Card style={styles.infoCard}>
          <Card.Title 
            title="Professional Credentials" 
            left={(props) => <List.Icon {...props} icon="certificate" />}
          />
          <Card.Content>
            <List.Item
              title="BVC Registration"
              description={`Registration #${profile.bvc_registration_number}`}
              left={(props) => <List.Icon {...props} icon="badge-account" />}
            />
            <Divider />
            <List.Item
              title="Qualifications"
              description={profile.degrees_certificates}
              left={(props) => <List.Icon {...props} icon="school" />}
            />
          </Card.Content>
        </Card>

        {/* Areas of Expertise */}
        <Card style={styles.infoCard}>
          <Card.Title 
            title="Areas of Expertise" 
            left={(props) => <List.Icon {...props} icon="medical-bag" />}
          />
          <Card.Content>
            <Text style={styles.expertiseText}>
              {profile.areas_of_expertise}
            </Text>
            
            {/* Hook for Layer 6 - Service Offerings */}
            <View style={styles.servicesPlaceholder}>
              <Text variant="bodySmall" style={styles.placeholderText}>
                📋 Detailed services and pricing will be displayed here
              </Text>
            </View>
          </Card.Content>
        </Card>

        {/* Location & Practice Information */}
        <Card style={styles.infoCard}>
          <Card.Title 
            title="Practice Location" 
            left={(props) => <List.Icon {...props} icon="map-marker" />}
          />
          <Card.Content>
            <List.Item
              title="Chamber Address"
              description={profile.chamber_address}
              left={(props) => <List.Icon {...props} icon="home-city" />}
              right={(props) => (
                <IconButton
                  {...props}
                  icon="directions"
                  onPress={handleDirectionsPress}
                />
              )}
            />
            <Divider />
            <List.Item
              title="Area"
              description={`${profile.sub_district}, ${profile.district}`}
              left={(props) => <List.Icon {...props} icon="map" />}
            />
          </Card.Content>
        </Card>

        {/* Contact Information */}
        <Card style={styles.infoCard}>
          <Card.Title 
            title="Contact Information" 
            left={(props) => <List.Icon {...props} icon="phone" />}
          />
          <Card.Content>
            <List.Item
              title="Primary Contact"
              description={profile.contact_info}
              left={(props) => <List.Icon {...props} icon="phone" />}
              right={(props) => (
                <IconButton
                  {...props}
                  icon="phone-dial"
                  onPress={() => handleContactPress(profile.contact_info)}
                />
              )}
            />
            
            {profile.whatsapp_number && (
              <>
                <Divider />
                <List.Item
                  title="WhatsApp"
                  description={profile.whatsapp_number}
                  left={(props) => <List.Icon {...props} icon="whatsapp" />}
                  right={(props) => (
                    <IconButton
                      {...props}
                      icon="whatsapp"
                      onPress={() => handleWhatsAppPress(profile.whatsapp_number)}
                    />
                  )}
                />
              </>
            )}
          </Card.Content>
        </Card>

        {/* Hook for Layer 7 - Availability Display */}
        <Card style={styles.infoCard}>
          <Card.Title 
            title="Availability" 
            left={(props) => <List.Icon {...props} icon="clock-outline" />}
          />
          <Card.Content>
            <View style={styles.availabilityPlaceholder}>
              <Text variant="bodySmall" style={styles.placeholderText}>
                🕒 Practice hours and availability will be displayed here
              </Text>
            </View>
          </Card.Content>
        </Card>

        {/* Hook for Layer 6 - Rating & Reviews Display */}
        <Card style={styles.infoCard}>
          <Card.Title 
            title="Reviews & Ratings" 
            left={(props) => <List.Icon {...props} icon="star" />}
          />
          <Card.Content>
            <View style={styles.reviewsPlaceholder}>
              <Text variant="bodySmall" style={styles.placeholderText}>
                ⭐ Patient reviews and ratings will be displayed here
              </Text>
            </View>
          </Card.Content>
        </Card>

        {/* Professional Network - Only for other practitioners */}
        {currentRole === 'practitioner' && (
          <Card style={styles.infoCard}>
            <Card.Title title="Professional Actions" />
            <Card.Content>
              <Button
                mode="outlined"
                onPress={() => Alert.alert('Professional Network', 'Connect with fellow practitioners')}
                style={styles.networkButton}
                icon="account-plus"
              >
                Connect as Colleague
              </Button>
            </Card.Content>
          </Card>
        )}

        {/* Report/Feedback */}
        <Card style={styles.footerCard}>
          <Card.Content>
            <Text variant="bodySmall" style={styles.footerText}>
              Profile verified on {new Date(profile.verified_at || profile.created_at).toLocaleDateString()}
            </Text>
            <Button
              mode="text"
              onPress={() => Alert.alert('Report', 'Report functionality will be added')}
              style={styles.reportButton}
              textColor="#E74C3C"
            >
              Report Profile
            </Button>
          </Card.Content>
        </Card>

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
    color: '#E74C3C',
  },
  backButton: {
    marginTop: 16,
  },
  headerCard: {
    marginBottom: 16,
    elevation: 3,
  },
  headerContent: {
    paddingVertical: 24,
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  profilePhotoContainer: {
    position: 'relative',
    marginRight: 20,
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: -8,
    right: -8,
    backgroundColor: '#27AE60',
  },
  profileInfo: {
    flex: 1,
  },
  practitionerName: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  designation: {
    color: '#27AE60',
    fontWeight: '500',
    marginBottom: 4,
  },
  degrees: {
    opacity: 0.7,
    marginBottom: 8,
  },
  locationChip: {
    alignSelf: 'flex-start',
  },
  quickContactContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
  },
  contactIcon: {
    marginHorizontal: 4,
  },
  actionsCard: {
    marginBottom: 16,
    elevation: 2,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  primaryAction: {
    flex: 2,
  },
  secondaryAction: {
    flex: 1,
  },
  infoCard: {
    marginBottom: 16,
    elevation: 1,
  },
  expertiseText: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 16,
  },
  servicesPlaceholder: {
    backgroundColor: '#E8F5E8',
    padding: 16,
    borderRadius: 8,
    marginTop: 8,
  },
  availabilityPlaceholder: {
    backgroundColor: '#E3F2FD',
    padding: 16,
    borderRadius: 8,
  },
  reviewsPlaceholder: {
    backgroundColor: '#FFF3E0',
    padding: 16,
    borderRadius: 8,
  },
  placeholderText: {
    textAlign: 'center',
    fontStyle: 'italic',
    opacity: 0.8,
  },
  networkButton: {
    marginTop: 8,
  },
  footerCard: {
    marginBottom: 32,
    elevation: 1,
  },
  footerText: {
    textAlign: 'center',
    opacity: 0.6,
    marginBottom: 8,
  },
  reportButton: {
    alignSelf: 'center',
  },
});