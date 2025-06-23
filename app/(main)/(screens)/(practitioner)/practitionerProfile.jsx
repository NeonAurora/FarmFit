// app/(main)/(screens)/(practitioner)/practitionerProfile.jsx
import React, { useState, useEffect } from 'react';
import { ScrollView, StyleSheet, View, ActivityIndicator, Alert } from 'react-native';
import { 
  Card, 
  Text, 
  Avatar, 
  Button, 
  Chip,
  Divider,
  List,
  Badge
} from 'react-native-paper';
import { ThemedView } from '@/components/themes/ThemedView';
import { useColorScheme } from '@/hooks/useColorScheme.native';
import { useAuth } from '@/contexts/AuthContext';
import { router } from 'expo-router';
import { getPractitionerProfileByUserId } from '@/services/supabase';

export default function PractitionerProfileScreen() {
  const colorScheme = useColorScheme();
  const { user, userRoles } = useAuth();
  const isDark = colorScheme === 'dark';

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchProfile();
  }, [user]);

  const fetchProfile = async () => {
    if (!user?.sub) {
      setError('User not authenticated');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const result = await getPractitionerProfileByUserId(user.sub);
      
      if (result.success && result.data) {
        setProfile(result.data);
      } else {
        setError('Profile not found');
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      setError('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'verified':
        return '#27AE60';
      case 'pending':
        return '#F39C12';
      case 'rejected':
        return '#E74C3C';
      default:
        return '#95A5A6';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'verified':
        return 'Verified ✅';
      case 'pending':
        return 'Under Review ⏳';
      case 'rejected':
        return 'Rejected ❌';
      default:
        return 'Unknown';
    }
  };

  if (loading) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#27AE60" />
          <Text style={styles.loadingText}>Loading your profile...</Text>
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
            onPress={() => router.push('/becomePractitioner')}
            style={styles.createButton}
          >
            Create Profile
          </Button>
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        
        {/* Header Card with Profile Photo and Status */}
        <Card style={styles.headerCard}>
          <Card.Content style={styles.headerContent}>
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
              
              {/* Verification Badge */}
              <Badge 
                style={[styles.verificationBadge, { backgroundColor: getStatusColor(userRoles.practitioner_status) }]}
              >
                {getStatusText(userRoles.practitioner_status)}
              </Badge>
            </View>
            
            <Text variant="headlineSmall" style={styles.practitionerName}>
              {profile.full_name}
            </Text>
            <Text variant="titleMedium" style={styles.designation}>
              {profile.designation}
            </Text>
            <Text variant="bodyMedium" style={styles.degrees}>
              {profile.degrees_certificates}
            </Text>
            
            {/* Quick Actions */}
            <View style={styles.quickActions}>
              <Button
                mode="contained"
                onPress={() => router.push('/editPractitionerProfile')}
                style={styles.editButton}
                icon="pencil"
              >
                Edit Profile
              </Button>
              
              {userRoles.practitioner_status === 'verified' && (
                <Button
                  mode="outlined"
                  onPress={() => router.push(`/viewPractitionerProfile?profileId=${profile.id}`)}
                  style={styles.viewPublicButton}
                  icon="eye"
                >
                  View Public
                </Button>
              )}
            </View>
          </Card.Content>
        </Card>

        {/* Professional Information */}
        <Card style={styles.infoCard}>
          <Card.Title title="Professional Information" />
          <Card.Content>
            <List.Item
              title="BVC Registration"
              description={profile.bvc_registration_number}
              left={(props) => <List.Icon {...props} icon="certificate" />}
            />
            <Divider />
            <List.Item
              title="Areas of Expertise"
              description={profile.areas_of_expertise}
              left={(props) => <List.Icon {...props} icon="medical-bag" />}
              style={styles.expertiseItem}
            />
          </Card.Content>
        </Card>

        {/* Location & Contact */}
        <Card style={styles.infoCard}>
          <Card.Title title="Location & Contact" />
          <Card.Content>
            <List.Item
              title="Chamber Address"
              description={profile.chamber_address}
              left={(props) => <List.Icon {...props} icon="map-marker" />}
            />
            <Divider />
            <List.Item
              title="Location"
              description={`${profile.sub_district}, ${profile.district}`}
              left={(props) => <List.Icon {...props} icon="map" />}
            />
            <Divider />
            <List.Item
              title="Contact"
              description={profile.contact_info}
              left={(props) => <List.Icon {...props} icon="phone" />}
            />
            {profile.whatsapp_number && (
              <>
                <Divider />
                <List.Item
                  title="WhatsApp"
                  description={profile.whatsapp_number}
                  left={(props) => <List.Icon {...props} icon="whatsapp" />}
                />
              </>
            )}
          </Card.Content>
        </Card>

        {/* Profile Status Information */}
        <Card style={styles.statusCard}>
          <Card.Title title="Profile Status" />
          <Card.Content>
            <View style={styles.statusContainer}>
              <Chip
                mode="elevated"
                style={[styles.statusChip, { backgroundColor: `${getStatusColor(userRoles.practitioner_status)}20` }]}
                textStyle={{ color: getStatusColor(userRoles.practitioner_status) }}
              >
                {getStatusText(userRoles.practitioner_status)}
              </Chip>
              
              {userRoles.practitioner_status === 'pending' && (
                <Text style={styles.statusNote}>
                  Your application is under review. You will be notified once it's approved.
                </Text>
              )}
              
              {userRoles.practitioner_status === 'verified' && (
                <Text style={styles.statusNote}>
                  Your profile is verified and visible to pet owners.
                </Text>
              )}
              
              {userRoles.practitioner_status === 'rejected' && (
                <Text style={styles.statusNote}>
                  Your application was rejected. Please contact support for more information.
                </Text>
              )}
            </View>
            
            <Divider style={styles.statusDivider} />
            
            <List.Item
              title="Profile Created"
              description={new Date(profile.created_at).toLocaleDateString()}
              left={(props) => <List.Icon {...props} icon="calendar-plus" />}
            />
            
            {profile.verified_at && (
              <List.Item
                title="Verified On"
                description={new Date(profile.verified_at).toLocaleDateString()}
                left={(props) => <List.Icon {...props} icon="check-circle" />}
              />
            )}
          </Card.Content>
        </Card>

        {/* Additional Actions */}
        <Card style={styles.actionsCard}>
          <Card.Title title="Additional Actions" />
          <Card.Content>
            <List.Item
              title="Application Status"
              description="View detailed application status"
              left={(props) => <List.Icon {...props} icon="clipboard-list" />}
              right={(props) => <List.Icon {...props} icon="chevron-right" />}
              onPress={() => router.push('/applicationStatus')}
            />
            
            {userRoles.practitioner_status === 'verified' && (
              <>
                <Divider />
                <List.Item
                  title="Practice Settings"
                  description="Configure your practice preferences"
                  left={(props) => <List.Icon {...props} icon="cog" />}
                  right={(props) => <List.Icon {...props} icon="chevron-right" />}
                  onPress={() => router.push('/practiceSettings')}
                />
                <Divider />
                <List.Item
                  title="Privacy Settings"
                  description="Manage profile visibility"
                  left={(props) => <List.Icon {...props} icon="shield-account" />}
                  right={(props) => <List.Icon {...props} icon="chevron-right" />}
                  onPress={() => router.push('/profileVisibilitySettings')}
                />
              </>
            )}
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
  createButton: {
    marginTop: 16,
  },
  headerCard: {
    marginBottom: 16,
    elevation: 3,
  },
  headerContent: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  profilePhotoContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  verificationBadge: {
    position: 'absolute',
    bottom: -8,
    right: -8,
    paddingHorizontal: 8,
    paddingVertical: 1,
    paddingBottom: 0,
    paddingTop: 0,
    paddingLeft: 10,
  },
  practitionerName: {
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 4,
  },
  designation: {
    textAlign: 'center',
    marginBottom: 4,
    color: '#27AE60',
    fontWeight: '500',
  },
  degrees: {
    textAlign: 'center',
    marginBottom: 20,
    opacity: 0.7,
  },
  quickActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  editButton: {
    flex: 1,
  },
  viewPublicButton: {
    flex: 1,
  },
  infoCard: {
    marginBottom: 16,
    elevation: 1,
  },
  expertiseItem: {
    minHeight: 60,
  },
  statusCard: {
    marginBottom: 16,
    elevation: 1,
  },
  statusContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  statusChip: {
    marginBottom: 12,
  },
  statusNote: {
    textAlign: 'center',
    fontSize: 14,
    opacity: 0.8,
    paddingHorizontal: 16,
  },
  statusDivider: {
    marginVertical: 16,
  },
  actionsCard: {
    marginBottom: 32,
    elevation: 1,
  },
});