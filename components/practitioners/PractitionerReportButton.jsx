// components/practitioner/PractitionerReportButton.jsx
import React, { useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { Button, Portal, Modal, Text, TextInput, RadioButton } from 'react-native-paper';

export const PractitionerReportButton = ({ ratingId, onReport }) => {
  const [showModal, setShowModal] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reportDetails, setReportDetails] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const reportReasons = [
    { value: 'spam', label: 'Spam or fake review' },
    { value: 'inappropriate', label: 'Inappropriate content' },
    { value: 'offensive', label: 'Offensive language' },
    { value: 'irrelevant', label: 'Not relevant to practitioner' },
    { value: 'harassment', label: 'Harassment or bullying' },
    { value: 'other', label: 'Other' },
  ];

  const handleSubmitReport = async () => {
    if (!reportReason) {
      Alert.alert('Error', 'Please select a reason for reporting');
      return;
    }

    setIsSubmitting(true);
    try {
      await onReport(ratingId, reportReason, reportDetails);
      setShowModal(false);
      setReportReason('');
      setReportDetails('');
      Alert.alert('Success', 'Thank you for your report. We will review it shortly.');
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to submit report');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View>
      <Button
        mode="text"
        onPress={() => setShowModal(true)}
        style={styles.reportButton}
        compact
      >
        Report
      </Button>

      <Portal>
        <Modal
          visible={showModal}
          onDismiss={() => setShowModal(false)}
          contentContainerStyle={styles.modalContainer}
        >
          <Text style={styles.modalTitle}>Report Review</Text>
          
          <Text style={styles.sectionLabel}>Reason for reporting:</Text>
          <RadioButton.Group 
            onValueChange={setReportReason} 
            value={reportReason}
          >
            {reportReasons.map((reason) => (
              <View key={reason.value} style={styles.radioItem}>
                <RadioButton value={reason.value} />
                <Text style={styles.radioLabel}>{reason.label}</Text>
              </View>
            ))}
          </RadioButton.Group>

          <TextInput
            label="Additional details (optional)"
            value={reportDetails}
            onChangeText={setReportDetails}
            style={styles.detailsInput}
            mode="outlined"
            multiline
            numberOfLines={3}
            maxLength={500}
          />

          <View style={styles.buttonContainer}>
            <Button
              mode="outlined"
              onPress={() => setShowModal(false)}
              style={styles.cancelButton}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              mode="contained"
              onPress={handleSubmitReport}
              style={styles.submitButton}
              loading={isSubmitting}
              disabled={isSubmitting || !reportReason}
            >
              Submit Report
            </Button>
          </View>
        </Modal>
      </Portal>
    </View>
  );
};

const styles = StyleSheet.create({
  reportButton: {
    // Subtle styling
  },
  modalContainer: {
    backgroundColor: 'white',
    padding: 20,
    margin: 20,
    borderRadius: 8,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 12,
  },
  radioItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  radioLabel: {
    fontSize: 14,
    marginLeft: 8,
    flex: 1,
  },
  detailsInput: {
    marginTop: 16,
    marginBottom: 20,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
  },
  submitButton: {
    flex: 1,
  },
});