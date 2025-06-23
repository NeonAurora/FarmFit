
// app/(main)/(screens)/(practitioner)/reviewApplication.jsx
import React, { useState, useEffect } from 'react';
import { ScrollView, StyleSheet, View, Alert, Image, Dimensions, ActivityIndicator } from 'react-native';
import { 
  Card, 
  Text, 
  Avatar, 
  Button,
  TextInput,
  Divider,
  List,
  Chip,
  Modal,
  Portal
} from 'react-native-paper';
import { ThemedView } from '@/components/themes/ThemedView';
import { useColorScheme } from '@/hooks/useColorScheme.native';
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
  const colorScheme = useColorScheme();
  const { user } = useAuth();
  const { profileId } = useLocalSearchParams();
  const isDark = colorScheme === 'dark';

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
          <ActivityIndicator size="large" color="#E74C3C" />
          <Text style={styles.loadingText}>
            {roleLoading ? 'Checking permissions...' : 'Loading application...'}
          </Text>
        </View>
      </ThemedView>
    );
  }

  if (!application) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Application not found</Text>
          <Button mode="contained" onPress={() => router.back()}>
            Go Back
          </Button>
        </View>
      </ThemedView>
    );
  }

  const verificationDoc = application.verification_documents?.[0];

  return (
    <ThemedView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        
        {/* Application Header */}
        <Card style={styles.headerCard}>
          <Card.Content>
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
                  backgroundColor="#27AE60"
                />
              )}
              
              <View style={styles.applicantInfo}>
                <Text variant="headlineSmall" style={styles.applicantName}>
                  {application.full_name}
                </Text>
                <Text variant="titleMedium" style={styles.designation}>
                  {application.designation}
                </Text>
                <Text variant="bodyMedium" style={styles.degrees}>
                  {application.degrees_certificates}
                </Text>
                
                <Chip 
                  mode="elevated" 
                  style={styles.statusChip}
                >
                  📋 Under Review
                </Chip>
              </View>
            </View>
            
            <Text variant="bodySmall" style={styles.submissionDate}>
              Submitted: {new Date(application.created_at).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </Text>
          </Card.Content>
        </Card>

        {/* Professional Details */}
        <Card style={styles.infoCard}>
          <Card.Title title="Professional Information" />
          <Card.Content>
            <List.Item
              title="BVC Registration Number"
              description={application.bvc_registration_number}
              left={(props) => <List.Icon {...props} icon="certificate" />}
            />
            <Divider />
            <List.Item
              title="Areas of Expertise"
              description={application.areas_of_expertise}
              left={(props) => <List.Icon {...props} icon="medical-bag" />}
            />
          </Card.Content>
        </Card>

        {/* Location & Contact */}
        <Card style={styles.infoCard}>
          <Card.Title title="Location & Contact" />
          <Card.Content>
            <List.Item
              title="Chamber Address"
              description={application.chamber_address}
              left={(props) => <List.Icon {...props} icon="map-marker" />}
            />
            <Divider />
            <List.Item
              title="Location"
              description={`${application.sub_district}, ${application.district}`}
              left={(props) => <List.Icon {...props} icon="map" />}
            />
            <Divider />
            <List.Item
              title="Contact Number"
              description={application.contact_info}
              left={(props) => <List.Icon {...props} icon="phone" />}
            />
            {application.whatsapp_number && (
              <>
                <Divider />
                <List.Item
                  title="WhatsApp"
                  description={application.whatsapp_number}
                  left={(props) => <List.Icon {...props} icon="whatsapp" />}
                />
              </>
            )}
          </Card.Content>
        </Card>

        {/* Educational Background */}
        {verificationDoc && (
          <Card style={styles.infoCard}>
            <Card.Title title="Educational Background" />
            <Card.Content>
              <List.Item
                title="University"
                description={verificationDoc.university_name}
                left={(props) => <List.Icon {...props} icon="school" />}
              />
              <Divider />
              <List.Item
                title="Graduation Session"
                description={verificationDoc.graduation_session}
                left={(props) => <List.Icon {...props} icon="calendar-account" />}
              />
            </Card.Content>
          </Card>
        )}

        {/* Verification Documents */}
        {verificationDoc && (
          <Card style={styles.documentsCard}>
            <Card.Title title="🔒 Verification Documents" titleStyle={styles.documentsTitle} />
            <Card.Content>
              <Text variant="bodySmall" style={styles.documentsNote}>
                These documents are for verification purposes only and will not be public.
              </Text>
              
              {verificationDoc.degree_certificate_url && (
                <View style={styles.documentItem}>
                  <Text variant="titleSmall" style={styles.documentLabel}>
                    Degree Certificate
                  </Text>
                  <Button
                    mode="outlined"
                    onPress={() => openImageModal(verificationDoc.degree_certificate_url)}
                    style={styles.viewDocButton}
                    icon="file-document"
                  >
                    View Document
                  </Button>
                </View>
              )}
              
              {verificationDoc.registration_certificate_url && (
                <View style={styles.documentItem}>
                  <Text variant="titleSmall" style={styles.documentLabel}>
                    BVC Registration Certificate
                  </Text>
                  <Button
                    mode="outlined"
                    onPress={() => openImageModal(verificationDoc.registration_certificate_url)}
                    style={styles.viewDocButton}
                    icon="file-document"
                  >
                    View Document
                  </Button>
                </View>
              )}
            </Card.Content>
          </Card>
        )}

        {/* Approval Notes */}
        <Card style={styles.infoCard}>
          <Card.Title title="Admin Notes (Optional)" />
          <Card.Content>
            <TextInput
              label="Notes for approval"
              value={approvalNotes}
              onChangeText={setApprovalNotes}
              style={styles.notesInput}
              mode="outlined"
              multiline
              numberOfLines={3}
              placeholder="Add any notes about this application..."
            />
          </Card.Content>
        </Card>

        {/* Action Buttons */}
        <Card style={styles.actionsCard}>
          <Card.Content>
            <View style={styles.actionButtons}>
              <Button
                mode="contained"
                onPress={handleApprove}
                style={styles.approveButton}
                disabled={processing}
                loading={processing}
                icon="check-circle"
              >
                Approve
              </Button>
              
              <Button
                mode="outlined"
                onPress={() => setShowRejectModal(true)}
                style={styles.rejectButton}
                disabled={processing}
                icon="close-circle"
                textColor="#E74C3C"
              >
                Reject
              </Button>
            </View>
          </Card.Content>
        </Card>

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
            <Button
              mode="contained"
              onPress={() => setShowImageModal(false)}
              style={styles.closeImageButton}
            >
              Close
            </Button>
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
          <Card>
            <Card.Title title="Reject Application" />
            <Card.Content>
              <Text variant="bodyMedium" style={styles.rejectModalText}>
                Please provide a reason for rejecting this application:
              </Text>
              
              <TextInput
                label="Rejection Reason *"
                value={rejectionReason}
                onChangeText={setRejectionReason}
                style={styles.rejectionInput}
                mode="outlined"
                multiline
                numberOfLines={4}
                placeholder="Explain why this application is being rejected..."
              />
              
              <View style={styles.rejectModalActions}>
                <Button
                  mode="outlined"
                  onPress={() => setShowRejectModal(false)}
                  style={styles.cancelRejectButton}
                  disabled={processing}
                >
                  Cancel
                </Button>
                
                <Button
                  mode="contained"
                  onPress={handleReject}
                  style={styles.confirmRejectButton}
                  disabled={processing}
                  loading={processing}
                  buttonColor="#E74C3C"
                >
                  Reject Application
                </Button>
              </View>
            </Card.Content>
          </Card>
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
  headerCard: {
    marginBottom: 16,
    elevation: 3,
  },
  applicantHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
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
    color: '#27AE60',
    marginBottom: 4,
  },
  degrees: {
    opacity: 0.7,
    marginBottom: 8,
  },
  statusChip: {
    alignSelf: 'flex-start',
    backgroundColor: '#FFF3E0',
  },
  submissionDate: {
    textAlign: 'center',
    opacity: 0.6,
    fontStyle: 'italic',
  },
  infoCard: {
    marginBottom: 16,
    elevation: 1,
  },
  documentsCard: {
    marginBottom: 16,
    elevation: 2,
    backgroundColor: '#FFF8F5',
  },
  documentsTitle: {
    color: '#E74C3C',
  },
  documentsNote: {
    backgroundColor: '#FFF3E0',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  documentItem: {
    marginBottom: 12,
  },
  documentLabel: {
    marginBottom: 8,
    fontWeight: '500',
  },
  viewDocButton: {
    alignSelf: 'flex-start',
  },
  notesInput: {
    marginBottom: 8,
  },
  actionsCard: {
    marginBottom: 32,
    elevation: 2,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  approveButton: {
    flex: 1,
    backgroundColor: '#27AE60',
  },
  rejectButton: {
    flex: 1,
  },
  imageModal: {
    backgroundColor: 'rgba(0,0,0,0.9)',
    margin: 20,
    borderRadius: 8,
    padding: 20,
  },
  imageContainer: {
    alignItems: 'center',
  },
  modalImage: {
    width: width - 80,
    height: width - 80,
    marginBottom: 20,
  },
  closeImageButton: {
    marginTop: 16,
  },
  rejectModal: {
    backgroundColor: 'white',
    margin: 20,
    borderRadius: 8,
  },
  rejectModalText: {
    marginBottom: 16,
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