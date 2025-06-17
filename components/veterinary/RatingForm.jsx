// components/veterinary/RatingForm.jsx
import React, { useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { Card, Text, Button } from 'react-native-paper';
import { StarRating } from './StarRating';

// Layer 1: Simple rating submission form
export const RatingForm = ({ clinicId, clinicName, onSubmit, onCancel }) => {
  const [overallRating, setOverallRating] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (overallRating === 0) {
      Alert.alert('Rating Required', 'Please select a rating before submitting.');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        clinic_id: clinicId,
        overall_rating: overallRating
      });
    } catch (error) {
      console.error('Error submitting rating:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card style={styles.card}>
      <Card.Content>
        <Text style={styles.title}>Rate Your Experience</Text>
        <Text style={styles.clinicName}>{clinicName}</Text>
        
        <View style={styles.ratingSection}>
          <Text style={styles.ratingLabel}>Overall Rating *</Text>
          <StarRating
            rating={overallRating}
            onRatingChange={setOverallRating}
            size={32}
          />
          {overallRating > 0 && (
            <Text style={styles.ratingText}>
              {getRatingText(overallRating)}
            </Text>
          )}
        </View>

        <View style={styles.buttonContainer}>
          <Button 
            mode="outlined" 
            onPress={onCancel}
            style={styles.cancelButton}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button 
            mode="contained" 
            onPress={handleSubmit}
            style={styles.submitButton}
            loading={isSubmitting}
            disabled={isSubmitting || overallRating === 0}
          >
            Submit
          </Button>
        </View>
      </Card.Content>
    </Card>
  );
};

// Helper function for rating text
const getRatingText = (rating) => {
  const texts = {
    1: 'Poor',
    2: 'Fair', 
    3: 'Good',
    4: 'Very Good',
    5: 'Excellent'
  };
  return texts[rating] || '';
};

const styles = StyleSheet.create({
  card: {
    margin: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 8,
  },
  clinicName: {
    fontSize: 16,
    textAlign: 'center',
    color: '#666',
    marginBottom: 24,
  },
  ratingSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  ratingLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 12,
  },
  ratingText: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
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