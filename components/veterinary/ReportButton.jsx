
// components/veterinary/ReportButton.jsx
import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Button, Dialog, Portal, Text, RadioButton, TextInput } from 'react-native-paper';

export const ReportButton = ({ ratingId, onReport, style }) => {
  const [showDialog, setShowDialog] = useState(false);
  const [selectedReason, setSelectedReason] = useState('spam');
  const [details, setDetails] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const reportReasons = [
    { value: 'spam', label: 'Spam or fake review' },
    { value: 'inappropriate', label: 'Inappropriate content' },
    { value: 'offensive', label: 'Offensive language' },
    { value: 'fake', label: 'Fake or misleading' },
    { value: 'other', label: 'Other' }
  ];

  const handleSubmitReport = async () => {
    if (!selectedReason) return;
    
    setIsSubmitting(true);
    try {
      await onReport(ratingId, selectedReason, details.trim() || null);
      setShowDialog(false);
      setDetails('');
      setSelectedReason('spam');
    } catch (error) {
      console.error('Error submitting report:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Button
        mode="text"
        onPress={() => setShowDialog(true)}
        style={[styles.reportButton, style]}
        compact
        icon="flag"
      >
        Report
      </Button>

      <Portal>
        <Dialog visible={showDialog} onDismiss={() => setShowDialog(false)}>
          <Dialog.Title>Report Review</Dialog.Title>
          <Dialog.Content>
            <Text style={styles.dialogText}>
              Why are you reporting this review?
            </Text>
            
            <RadioButton.Group 
              onValueChange={setSelectedReason} 
              value={selectedReason}
            >
              {reportReasons.map(reason => (
                <View key={reason.value} style={styles.radioRow}>
                  <RadioButton value={reason.value} />
                  <Text style={styles.radioLabel}>{reason.label}</Text>
                </View>
              ))}
            </RadioButton.Group>

            <TextInput
              label="Additional details (optional)"
              value={details}
              onChangeText={setDetails}
              mode="outlined"
              multiline
              numberOfLines={3}
              style={styles.detailsInput}
              placeholder="Provide more context about why this review should be reviewed..."
            />
          </Dialog.Content>
          
          <Dialog.Actions>
            <Button onPress={() => setShowDialog(false)}>Cancel</Button>
            <Button 
              onPress={handleSubmitReport}
              loading={isSubmitting}
              disabled={isSubmitting || !selectedReason}
            >
              Submit Report
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </>
  );
};

const styles = StyleSheet.create({
  reportButton: {
    marginLeft: 8,
  },
  dialogText: {
    marginBottom: 16,
    fontSize: 14,
  },
  radioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
  },
  radioLabel: {
    fontSize: 14,
    marginLeft: 8,
    flex: 1,
  },
  detailsInput: {
    marginTop: 16,
  },
});