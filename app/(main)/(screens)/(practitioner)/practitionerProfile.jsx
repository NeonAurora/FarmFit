// app/(main)/(screens)/(practitioner)/practitionerProfile.jsx
import React, { useState, useEffect } from 'react';
import { ScrollView, StyleSheet, View, ActivityIndicator, Alert } from 'react-native';
import { 
  Text, 
  Avatar, 
  Chip,
  Divider,
  List,
  Badge
} from 'react-native-paper';
import { ThemedView } from '@/components/themes/ThemedView';
import { ThemedText } from '@/components/themes/ThemedText';
import { ThemedCard } from '@/components/themes/ThemedCard';
import { ThemedButton } from '@/components/themes/ThemedButton';
import { useTheme } from '@/contexts/ThemeContext';
import { 
  useActivityIndicatorColors, 
  useChipColors, 
  useBadgeColors,
  useCardColors 
} from '@/hooks/useThemeColor';
import { useAuth } from '@/contexts/AuthContext';
import { router } from 'expo-router';
import { getPractitionerProfileByUserId } from '@/services/supabase';

export default function PractitionerProfileScreen() {
  const { colors, brandColors, isDark } = useTheme();
  const activityIndicatorColors = useActivityIndicatorColors();
  const chipColors = useChipColors();
  const badgeColors = useBadgeColors();
  const cardColors = useCardColors();
  const { user, userRoles } = useAuth();

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
        return brandColors.success;
      case 'pending':
        return brandColors.warning;
      case 'rejected':
        return brandColors.error;
      default:
        return colors.textSecondary;
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
          <ActivityIndicator size="large" color={activityIndicatorColors.primary} />
          <ThemedText style={[styles.loadingText, { color: colors.textSecondary }]}>
            Loading your profile...
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
            onPress={() => router.push('/becomePractitioner')}
            style={styles.createButton}
          >
            Create Profile
          </ThemedButton>
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        
        {/* Header Card with Profile Photo and Status */}
        <ThemedCard variant="elevated" elevation={3} style={styles.headerCard}>
          <View style={styles.headerContent}>
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
                  backgroundColor={brandColors.primary}
                />
              )}
              
              {/* Verification Badge */}
              <Badge 
                style={[
                  styles.verificationBadge, 
                  { backgroundColor: getStatusColor(userRoles.practitioner_status) }
                ]}
              >
                {getStatusText(userRoles.practitioner_status)}
              </Badge>
            </View>
            
            <Text variant="headlineSmall" style={[styles.practitionerName, { color: colors.text }]}>
              {profile.full_name}
            </Text>
            <Text variant="titleMedium" style={[styles.designation, { color: brandColors.primary }]}>
              {profile.designation}
            </Text>
            <Text variant="bodyMedium" style={[styles.degrees, { color: colors.textSecondary }]}>
              {profile.degrees_certificates}
            </Text>
            
            {/* Quick Actions */}
            <View style={styles.quickActions}>
              <ThemedButton
                variant="primary"
                onPress={() => router.push('/editPractitionerProfile')}
                style={styles.editButton}
                icon="pencil"
              >
                Edit Profile
              </ThemedButton>
              
              {userRoles.practitioner_status === 'verified' && (
                <ThemedButton
                  variant="outlined"
                  onPress={() => router.push(`/viewPractitionerProfile?profileId=${profile.id}`)}
                  style={styles.viewPublicButton}
                  icon="eye"
                >
                  View Public
                </ThemedButton>
              )}
            </View>
          </View>
        </ThemedCard>

        {/* Professional Information */}
        <ThemedCard variant="elevated" elevation={1} style={styles.infoCard}>
          <View style={styles.cardTitleContainer}>
            <ThemedText type="subtitle" style={styles.cardTitle}>
              Professional Information
            </ThemedText>
          </View>
          <View style={styles.cardContent}>
            <List.Item
              title="BVC Registration"
              description={profile.bvc_registration_number}
              left={(props) => <List.Icon {...props} icon="certificate" color={colors.textSecondary} />}
              titleStyle={{ color: colors.text }}
              descriptionStyle={{ color: colors.textSecondary }}
            />
            <Divider style={{ backgroundColor: colors.border }} />
            <List.Item
              title="Areas of Expertise"
              description={profile.areas_of_expertise}
              left={(props) => <List.Icon {...props} icon="medical-bag" color={colors.textSecondary} />}
              style={styles.expertiseItem}
              titleStyle={{ color: colors.text }}
              descriptionStyle={{ color: colors.textSecondary }}
            />
          </View>
        </ThemedCard>

        {/* Location & Contact */}
        <ThemedCard variant="elevated" elevation={1} style={styles.infoCard}>
          <View style={styles.cardTitleContainer}>
            <ThemedText type="subtitle" style={styles.cardTitle}>
              Location & Contact
            </ThemedText>
          </View>
          <View style={styles.cardContent}>
            <List.Item
              title="Chamber Address"
              description={profile.chamber_address}
              left={(props) => <List.Icon {...props} icon="map-marker" color={colors.textSecondary} />}
              titleStyle={{ color: colors.text }}
              descriptionStyle={{ color: colors.textSecondary }}
            />
            <Divider style={{ backgroundColor: colors.border }} />
            <List.Item
              title="Location"
              description={`${profile.sub_district}, ${profile.district}`}
              left={(props) => <List.Icon {...props} icon="map" color={colors.textSecondary} />}
              titleStyle={{ color: colors.text }}
              descriptionStyle={{ color: colors.textSecondary }}
            />
            <Divider style={{ backgroundColor: colors.border }} />
            <List.Item
              title="Contact"
              description={profile.contact_info}
              left={(props) => <List.Icon {...props} icon="phone" color={colors.textSecondary} />}
              titleStyle={{ color: colors.text }}
              descriptionStyle={{ color: colors.textSecondary }}
            />
            {profile.whatsapp_number && (
              <>
                <Divider style={{ backgroundColor: colors.border }} />
                <List.Item
                  title="WhatsApp"
                  description={profile.whatsapp_number}
                  left={(props) => <List.Icon {...props} icon="whatsapp" color={colors.textSecondary} />}
                  titleStyle={{ color: colors.text }}
                  descriptionStyle={{ color: colors.textSecondary }}
                />
              </>
            )}
          </View>
        </ThemedCard>

        {/* Profile Status Information */}
        <ThemedCard variant="elevated" elevation={1} style={styles.statusCard}>
          <View style={styles.cardTitleContainer}>
            <ThemedText type="subtitle" style={styles.cardTitle}>
              Profile Status
            </ThemedText>
          </View>
          <View style={styles.cardContent}>
            <View style={styles.statusContainer}>
              <Chip
                mode="elevated"
                style={[
                  styles.statusChip, 
                  { 
                    backgroundColor: `${getStatusColor(userRoles.practitioner_status)}20`,
                  }
                ]}
                textStyle={{ color: getStatusColor(userRoles.practitioner_status) }}
              >
                {getStatusText(userRoles.practitioner_status)}
              </Chip>
              
              {userRoles.practitioner_status === 'pending' && (
                <ThemedText style={[styles.statusNote, { color: colors.textSecondary }]}>
                  Your application is under review. You will be notified once it's approved.
                </ThemedText>
              )}
              
              {userRoles.practitioner_status === 'verified' && (
                <ThemedText style={[styles.statusNote, { color: colors.textSecondary }]}>
                  Your profile is verified and visible to pet owners.
                </ThemedText>
              )}
              
              {userRoles.practitioner_status === 'rejected' && (
                <ThemedText style={[styles.statusNote, { color: colors.textSecondary }]}>
                  Your application was rejected. Please contact support for more information.
                </ThemedText>
              )}
            </View>
            
            <Divider style={[styles.statusDivider, { backgroundColor: colors.border }]} />
            
            <List.Item
              title="Profile Created"
              description={new Date(profile.created_at).toLocaleDateString()}
              left={(props) => <List.Icon {...props} icon="calendar-plus" color={colors.textSecondary} />}
              titleStyle={{ color: colors.text }}
              descriptionStyle={{ color: colors.textSecondary }}
            />
            
            {profile.verified_at && (
              <List.Item
                title="Verified On"
                description={new Date(profile.verified_at).toLocaleDateString()}
                left={(props) => <List.Icon {...props} icon="check-circle" color={brandColors.success} />}
                titleStyle={{ color: colors.text }}
                descriptionStyle={{ color: colors.textSecondary }}
              />
            )}
          </View>
        </ThemedCard>

        {/* Additional Actions */}
        <ThemedCard variant="elevated" elevation={1} style={styles.actionsCard}>
          <View style={styles.cardTitleContainer}>
            <ThemedText type="subtitle" style={styles.cardTitle}>
              Additional Actions
            </ThemedText>
          </View>
          <View style={styles.cardContent}>
            <List.Item
              title="Application Status"
              description="View detailed application status"
              left={(props) => <List.Icon {...props} icon="clipboard-list" color={colors.textSecondary} />}
              right={(props) => <List.Icon {...props} icon="chevron-right" color={colors.textSecondary} />}
              onPress={() => router.push('/applicationStatus')}
              titleStyle={{ color: colors.text }}
              descriptionStyle={{ color: colors.textSecondary }}
            />
            
            {userRoles.practitioner_status === 'verified' && (
              <>
                <Divider style={{ backgroundColor: colors.border }} />
                <List.Item
                  title="Practice Settings"
                  description="Configure your practice preferences"
                  left={(props) => <List.Icon {...props} icon="cog" color={colors.textSecondary} />}
                  right={(props) => <List.Icon {...props} icon="chevron-right" color={colors.textSecondary} />}
                  onPress={() => router.push('/practiceSettings')}
                  titleStyle={{ color: colors.text }}
                  descriptionStyle={{ color: colors.textSecondary }}
                />
                <Divider style={{ backgroundColor: colors.border }} />
                <List.Item
                  title="Privacy Settings"
                  description="Manage profile visibility"
                  left={(props) => <List.Icon {...props} icon="shield-account" color={colors.textSecondary} />}
                  right={(props) => <List.Icon {...props} icon="chevron-right" color={colors.textSecondary} />}
                  onPress={() => router.push('/profileVisibilitySettings')}
                  titleStyle={{ color: colors.text }}
                  descriptionStyle={{ color: colors.textSecondary }}
                />
              </>
            )}
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
  },
  createButton: {
    marginTop: 16,
  },
  headerCard: {
    marginBottom: 16,
  },
  headerContent: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 16,
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
    width: '100%',
  },
  editButton: {
    flex: 1,
  },
  viewPublicButton: {
    flex: 1,
  },
  infoCard: {
    marginBottom: 16,
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
    paddingBottom: 8,
  },
  expertiseItem: {
    minHeight: 60,
  },
  statusCard: {
    marginBottom: 16,
  },
  statusContainer: {
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 16,
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
  },
});