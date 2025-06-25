// app/(main)/(screens)/(practitioner)/reviewApplication.jsx
import React, { useState, useEffect } from 'react';
import { ScrollView, StyleSheet, View, Alert, Image, Dimensions, ActivityIndicator } from 'react-native';
import { 
  Text, 
  Avatar, 
  TextInput,
  Divider,
  List,
  Chip,
  Modal,
  Portal
} from 'react-native-paper';
import { ThemedView } from '@/components/themes/ThemedView';
import { ThemedText } from '@/components/themes/ThemedText';
import { ThemedCard } from '@/components/themes/ThemedCard';
import { ThemedButton } from '@/components/themes/ThemedButton';
import { useTheme } from '@/contexts/ThemeContext';
import { 
  useActivityIndicatorColors, 
  useChipColors, 
  useInputColors,
  useCardColors 
} from '@/hooks/useThemeColor';
import { useAuth } from '@/contexts/AuthContext';
import { useLocalSearchParams, router } from 'expo-router';
import { useRoleProtection } from '@/hooks/useRoleProtection';
import { 
  getApplicationDetails, 
  approvePractitionerApplication, 
  rejectPractitionerApplication 
} from '@/services/supabase';

const { width } = Dimensions.get('window');

export default function ReviewApplicationScreen() {
  const { colors, brandColors, isDark } = useTheme();
  const activityIndicatorColors = useActivityIndicatorColors();
  const chipColors = useChipColors();
  const inputColors = useInputColors();
  const cardColors = useCardColors();
  const { user } = useAuth();
  const { profileId } = useLocalSearchParams();

  // Protect route - only admins can access
  const { hasAccess, loading: roleLoading } = useRoleProtection('admin', '/');

  const [application, setApplication] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [approvalNotes, setApprovalNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);

  useEffect(() => {
    if (hasAccess && profileId) {
      fetchApplicationDetails();
    }
  }, [hasAccess, profileId]);

  const fetchApplicationDetails = async () => {
    try {
      setLoading(true);
      const result = await getApplicationDetails(profileId);
      
      if (result.success && result.data) {
        setApplication(result.data);
      } else {
        Alert.alert('Error', 'Application not found');
        router.back();
      }
    } catch (error) {
      console.error('Error fetching application details:', error);
      Alert.alert('Error', 'Failed to load application');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    Alert.alert(
      'Approve Application',
      'Are you sure you want to approve this practitioner application?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Approve', 
          style: 'default',
          onPress: async () => {
            setProcessing(true);
            const result = await approvePractitionerApplication(
              profileId, 
              user.sub, 
              approvalNotes
            );
            
            if (result.success) {
              Alert.alert(
                'Success',
                'Application approved successfully!',
                [
                  { 
                    text: 'OK', 
                    onPress: () => router.back()
                  }
                ]
              );
            } else {
              Alert.alert('Error', 'Failed to approve application');
            }
            setProcessing(false);
          }
        }
      ]
    );
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      Alert.alert('Error', 'Please provide a reason for rejection');
      return;
    }

    setProcessing(true);
    const result = await rejectPractitionerApplication(
      profileId, 
      user.sub, 
      rejectionReason
    );
    
    if (result.success) {
      Alert.alert(
        'Application Rejected',
        'The applicant will be notified of the rejection.',
        [
          { 
            text: 'OK', 
            onPress: () => {
              setShowRejectModal(false);
              router.back();
            }
          }
        ]
      );
    } else {
      Alert.alert('Error', 'Failed to reject application');
    }
    setProcessing(false);
  };

  const openImageModal = (imageUrl) => {
    setSelectedImage(imageUrl);
    setShowImageModal(true);
  };

  if (roleLoading || !hasAccess || loading) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={activityIndicatorColors.primary} />
          <ThemedText style={[styles.loadingText, { color: colors.textSecondary }]}>
            {roleLoading ? 'Checking permissions...' : 'Loading application...'}
          </ThemedText>
        </View>
      </ThemedView>
    );
  }

  if (!application) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.errorContainer}>
          <ThemedText style={[styles.errorText, { color: brandColors.error }]}>
            Application not found
          </ThemedText>
          <ThemedButton variant="primary" onPress={() => router.back()}>
            Go Back
          </ThemedButton>
        </View>
      </ThemedView>
    );
  }

  const verificationDoc = application.verification_documents?.[0];

  return (
    <ThemedView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        
        {/* Application Header */}
        <ThemedCard variant="elevated" elevation={3} style={styles.headerCard}>
          <View style={styles.headerContent}>
            <View style={styles.applicantHeader}>
              {application.profile_photo_url ? (
                <Avatar.Image 
                  size={80} 
                  source={{ uri: application.profile_photo_url }} 
                />
              ) : (
                <Avatar.Text 
                  size={80} 
                  label={application.full_name?.charAt(0)?.toUpperCase() || 'A'} 
                  backgroundColor={brandColors.primary}
                />
              )}
              
              <View style={styles.applicantInfo}>
                <Text variant="headlineSmall" style={[styles.applicantName, { color: colors.text }]}>
                  {application.full_name}
                </Text>
                <Text variant="titleMedium" style={[styles.designation, { color: brandColors.primary }]}>
                  {application.designation}
                </Text>
                <Text variant="bodyMedium" style={[styles.degrees, { color: colors.textSecondary }]}>
                  {application.degrees_certificates}
                </Text>
                
                <Chip 
                  mode="elevated" 
                  style={[
                    styles.statusChip,
                    { 
                      backgroundColor: `${brandColors.warning}20`,
                    }
                  ]}
                  textStyle={{ color: brandColors.warning }}
                >
                  📋 Under Review
                </Chip>
              </View>
            </View>
            
            <ThemedText 
              variant="bodySmall" 
              style={[styles.submissionDate, { color: colors.textSecondary }]}
            >
              Submitted: {new Date(application.created_at).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </ThemedText>
          </View>
        </ThemedCard>

        {/* Professional Details */}
        <ThemedCard variant="elevated" elevation={1} style={styles.infoCard}>
          <View style={styles.cardTitleContainer}>
            <ThemedText type="subtitle" style={styles.cardTitle}>
              Professional Information
            </ThemedText>
          </View>
          <View style={styles.cardContent}>
            <List.Item
              title="BVC Registration Number"
              description={application.bvc_registration_number}
              left={(props) => <List.Icon {...props} icon="certificate" color={colors.textSecondary} />}
              titleStyle={{ color: colors.text }}
              descriptionStyle={{ color: colors.textSecondary }}
            />
            <Divider style={{ backgroundColor: colors.border }} />
            <List.Item
              title="Areas of Expertise"
              description={application.areas_of_expertise}
              left={(props) => <List.Icon {...props} icon="medical-bag" color={colors.textSecondary} />}
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
              description={application.chamber_address}
              left={(props) => <List.Icon {...props} icon="map-marker" color={colors.textSecondary} />}
              titleStyle={{ color: colors.text }}
              descriptionStyle={{ color: colors.textSecondary }}
            />
            <Divider style={{ backgroundColor: colors.border }} />
            <List.Item
              title="Location"
              description={`${application.sub_district}, ${application.district}`}
              left={(props) => <List.Icon {...props} icon="map" color={colors.textSecondary} />}
              titleStyle={{ color: colors.text }}
              descriptionStyle={{ color: colors.textSecondary }}
            />
            <Divider style={{ backgroundColor: colors.border }} />
            <List.Item
              title="Contact Number"
              description={application.contact_info}
              left={(props) => <List.Icon {...props} icon="phone" color={colors.textSecondary} />}
              titleStyle={{ color: colors.text }}
              descriptionStyle={{ color: colors.textSecondary }}
            />
            {application.whatsapp_number && (
              <>
                <Divider style={{ backgroundColor: colors.border }} />
                <List.Item
                  title="WhatsApp"
                  description={application.whatsapp_number}
                  left={(props) => <List.Icon {...props} icon="whatsapp" color={colors.textSecondary} />}
                  titleStyle={{ color: colors.text }}
                  descriptionStyle={{ color: colors.textSecondary }}
                />
              </>
            )}
          </View>
        </ThemedCard>

        {/* Educational Background */}
        {verificationDoc && (
          <ThemedCard variant="elevated" elevation={1} style={styles.infoCard}>
            <View style={styles.cardTitleContainer}>
              <ThemedText type="subtitle" style={styles.cardTitle}>
                Educational Background
              </ThemedText>
            </View>
            <View style={styles.cardContent}>
              <List.Item
                title="University"
                description={verificationDoc.university_name}
                left={(props) => <List.Icon {...props} icon="school" color={colors.textSecondary} />}
                titleStyle={{ color: colors.text }}
                descriptionStyle={{ color: colors.textSecondary }}
              />
              <Divider style={{ backgroundColor: colors.border }} />
              <List.Item
                title="Graduation Session"
                description={verificationDoc.graduation_session}
                left={(props) => <List.Icon {...props} icon="calendar-account" color={colors.textSecondary} />}
                titleStyle={{ color: colors.text }}
                descriptionStyle={{ color: colors.textSecondary }}
              />
            </View>
          </ThemedCard>
        )}

        {/* Verification Documents */}
        {verificationDoc && (
          <ThemedCard variant="elevated" elevation={2} style={[styles.documentsCard, { backgroundColor: colors.backgroundSecondary }]}>
            <View style={styles.cardTitleContainer}>
              <ThemedText type="subtitle" style={[styles.documentsTitle, { color: brandColors.info }]}>
                🔒 Verification Documents
              </ThemedText>
            </View>
            <View style={styles.cardContent}>
              <View style={[styles.documentsNote, { backgroundColor: colors.backgroundTertiary }]}>
                <ThemedText 
                  variant="bodySmall" 
                  style={[styles.documentsNoteText, { color: colors.textSecondary }]}
                >
                  These documents are for verification purposes only and will not be public.
                </ThemedText>
              </View>
              
              {verificationDoc.degree_certificate_url && (
                <View style={styles.documentItem}>
                  <ThemedText 
                    type="defaultSemiBold" 
                    style={[styles.documentLabel, { color: colors.text }]}
                  >
                    Degree Certificate
                  </ThemedText>
                  <ThemedButton
                    variant="outlined"
                    onPress={() => openImageModal(verificationDoc.degree_certificate_url)}
                    style={styles.viewDocButton}
                    icon="file-document"
                  >
                    View Document
                  </ThemedButton>
                </View>
              )}
              
              {verificationDoc.registration_certificate_url && (
                <View style={styles.documentItem}>
                  <ThemedText 
                    type="defaultSemiBold" 
                    style={[styles.documentLabel, { color: colors.text }]}
                  >
                    BVC Registration Certificate
                  </ThemedText>
                  <ThemedButton
                    variant="outlined"
                    onPress={() => openImageModal(verificationDoc.registration_certificate_url)}
                    style={styles.viewDocButton}
                    icon="file-document"
                  >
                    View Document
                  </ThemedButton>
                </View>
              )}
            </View>
          </ThemedCard>
        )}

        {/* Approval Notes */}
        <ThemedCard variant="elevated" elevation={1} style={styles.infoCard}>
          <View style={styles.cardTitleContainer}>
            <ThemedText type="subtitle" style={styles.cardTitle}>
              Admin Notes (Optional)
            </ThemedText>
          </View>
          <View style={styles.cardContent}>
            <TextInput
              label="Notes for approval"
              value={approvalNotes}
              onChangeText={setApprovalNotes}
              style={styles.notesInput}
              mode="outlined"
              multiline
              numberOfLines={3}
              placeholder="Add any notes about this application..."
              outlineColor={inputColors.border}
              activeOutlineColor={inputColors.borderFocused}
              textColor={inputColors.text}
              placeholderTextColor={inputColors.placeholder}
            />
          </View>
        </ThemedCard>

        {/* Action Buttons */}
        <ThemedCard variant="elevated" elevation={2} style={styles.actionsCard}>
          <View style={styles.actionsContent}>
            <View style={styles.actionButtons}>
              <ThemedButton
                onPress={handleApprove}
                style={[styles.approveButton, { backgroundColor: brandColors.success }]}
                labelStyle={{ color: colors.textInverse }}
                disabled={processing}
                loading={processing}
                icon="check-circle"
              >
                Approve Application
              </ThemedButton>
              
              <ThemedButton
                variant="outlined"
                onPress={() => setShowRejectModal(true)}
                style={[styles.rejectButton, { borderColor: brandColors.error }]}
                labelStyle={{ color: brandColors.error }}
                disabled={processing}
                icon="close-circle"
              >
                Reject Application
              </ThemedButton>
            </View>
          </View>
        </ThemedCard>

      </ScrollView>

      {/* Image Modal */}
      <Portal>
        <Modal 
          visible={showImageModal} 
          onDismiss={() => setShowImageModal(false)}
          contentContainerStyle={styles.imageModal}
        >
          <View style={styles.imageContainer}>
            {selectedImage && (
              <Image 
                source={{ uri: selectedImage }} 
                style={styles.modalImage}
                resizeMode="contain"
              />
            )}
            <ThemedButton
              variant="primary"
              onPress={() => setShowImageModal(false)}
              style={styles.closeImageButton}
            >
              Close
            </ThemedButton>
          </View>
        </Modal>
      </Portal>

      {/* Rejection Modal */}
      <Portal>
        <Modal 
          visible={showRejectModal} 
          onDismiss={() => setShowRejectModal(false)}
          contentContainerStyle={styles.rejectModal}
        >
          <ThemedCard>
            <View style={styles.cardTitleContainer}>
              <ThemedText type="subtitle" style={[styles.cardTitle, { color: brandColors.error }]}>
                Reject Application
              </ThemedText>
            </View>
            <View style={styles.cardContent}>
              <ThemedText 
                variant="bodyMedium" 
                style={[styles.rejectModalText, { color: colors.text }]}
              >
                Please provide a reason for rejecting this application:
              </ThemedText>
              
              <TextInput
                label="Rejection Reason *"
                value={rejectionReason}
                onChangeText={setRejectionReason}
                style={styles.rejectionInput}
                mode="outlined"
                multiline
                numberOfLines={4}
                placeholder="Explain why this application is being rejected..."
                outlineColor={inputColors.border}
                activeOutlineColor={brandColors.error}
                textColor={inputColors.text}
                placeholderTextColor={inputColors.placeholder}
              />
              
              <View style={styles.rejectModalActions}>
                <ThemedButton
                  variant="outlined"
                  onPress={() => setShowRejectModal(false)}
                  style={styles.cancelRejectButton}
                  disabled={processing}
                >
                  Cancel
                </ThemedButton>
                
                <ThemedButton
                  onPress={handleReject}
                  style={[styles.confirmRejectButton, { backgroundColor: brandColors.error }]}
                  labelStyle={{ color: colors.textInverse }}
                  disabled={processing}
                  loading={processing}
                >
                  Reject Application
                </ThemedButton>
              </View>
            </View>
          </ThemedCard>
        </Modal>
      </Portal>
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
  headerCard: {
    marginBottom: 16,
  },
  headerContent: {
    padding: 20,
  },
  applicantHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  applicantInfo: {
    marginLeft: 20,
    flex: 1,
  },
  applicantName: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  designation: {
    marginBottom: 4,
    fontWeight: '500',
  },
  degrees: {
    opacity: 0.8,
    marginBottom: 12,
  },
  statusChip: {
    alignSelf: 'flex-start',
  },
  submissionDate: {
    textAlign: 'center',
    opacity: 0.7,
    fontStyle: 'italic',
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
  documentsCard: {
    marginBottom: 16,
  },
  documentsTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  documentsNote: {
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  documentsNoteText: {
    textAlign: 'center',
    fontStyle: 'italic',
    lineHeight: 20,
  },
  documentItem: {
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  documentLabel: {
    marginBottom: 8,
  },
  viewDocButton: {
    alignSelf: 'flex-start',
  },
  notesInput: {
    marginBottom: 8,
  },
  actionsCard: {
    marginBottom: 32,
  },
  actionsContent: {
    padding: 20,
  },
  actionButtons: {
    gap: 16,
  },
  approveButton: {
    paddingVertical: 8,
  },
  rejectButton: {
    paddingVertical: 8,
  },
  imageModal: {
    backgroundColor: 'rgba(0,0,0,0.9)',
    margin: 20,
    borderRadius: 12,
    padding: 20,
  },
  imageContainer: {
    alignItems: 'center',
  },
  modalImage: {
    width: width - 80,
    height: width - 80,
    marginBottom: 20,
    borderRadius: 8,
  },
  closeImageButton: {
    marginTop: 16,
    minWidth: 120,
  },
  rejectModal: {
    backgroundColor: 'transparent',
    margin: 20,
  },
  rejectModalText: {
    marginBottom: 16,
    lineHeight: 22,
  },
  rejectionInput: {
    marginBottom: 20,
  },
  rejectModalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelRejectButton: {
    flex: 1,
  },
  confirmRejectButton: {
    flex: 1,
  },
});