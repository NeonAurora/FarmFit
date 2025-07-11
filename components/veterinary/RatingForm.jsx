// components/veterinary/RatingForm.jsx
import React, { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Card, Text, Button, TextInput, List } from 'react-native-paper';
import { StarRating } from './StarRating';

// Layer 2: Enhanced rating form with multi-dimensional ratings and reviews
export const RatingForm = ({ clinicId, clinicName, onSubmit, onCancel }) => {
  const [overallRating, setOverallRating] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Layer 2: Multi-dimensional ratings
  const [staffFriendliness, setStaffFriendliness] = useState(0);
  const [cleanliness, setCleanliness] = useState(0);
  const [waitTime, setWaitTime] = useState(0);
  const [valueForMoney, setValueForMoney] = useState(0);
  const [treatmentQuality, setTreatmentQuality] = useState(0);
  
  // Layer 2: Review content
  const [reviewTitle, setReviewTitle] = useState('');
  const [reviewContent, setReviewContent] = useState('');
  const [visitDate, setVisitDate] = useState('');
  
  // Layer 2: UI state
  const [detailedRatingsExpanded, setDetailedRatingsExpanded] = useState(false);
  const [reviewExpanded, setReviewExpanded] = useState(false);

  const handleSubmit = async () => {
    if (overallRating === 0) {
      onSubmit(null, 'Please select an overall rating before submitting.');
      return;
    }

    setIsSubmitting(true);
    try {
      const ratingData = {
        clinic_id: clinicId,
        overall_rating: overallRating,
        // Layer 2: Include dimensional ratings (only if > 0)
        staff_friendliness: staffFriendliness > 0 ? staffFriendliness : null,
        cleanliness: cleanliness > 0 ? cleanliness : null,
        wait_time: waitTime > 0 ? waitTime : null,
        value_for_money: valueForMoney > 0 ? valueForMoney : null,
        treatment_quality: treatmentQuality > 0 ? treatmentQuality : null,
        // Layer 2: Include review content (only if not empty)
        review_title: reviewTitle.trim() || null,
        review_content: reviewContent.trim() || null,
        visit_date: visitDate || null
      };

      await onSubmit(ratingData);
    } catch (error) {
      console.error('Error submitting rating:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card style={styles.card}>
      <Card.Content>
        <ScrollView showsVerticalScrollIndicator={false}>
          <Text style={styles.title}>Rate Your Experience</Text>
          <Text style={styles.clinicName}>{clinicName}</Text>
          
          {/* Overall Rating - Required */}
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

          {/* Layer 2: Detailed Ratings - Optional */}
          <List.Accordion
            title="📊 Detailed Ratings (Optional)"
            expanded={detailedRatingsExpanded}
            onPress={() => setDetailedRatingsExpanded(!detailedRatingsExpanded)}
            style={styles.accordion}
          >
            <View style={styles.accordionContent}>
              <DimensionalRating
                label="👥 Staff Friendliness"
                rating={staffFriendliness}
                onRatingChange={setStaffFriendliness}
              />
              <DimensionalRating
                label="🧽 Cleanliness"
                rating={cleanliness}
                onRatingChange={setCleanliness}
              />
              <DimensionalRating
                label="⏰ Wait Time"
                rating={waitTime}
                onRatingChange={setWaitTime}
              />
              <DimensionalRating
                label="💰 Value for Money"
                rating={valueForMoney}
                onRatingChange={setValueForMoney}
              />
              <DimensionalRating
                label="🩺 Treatment Quality"
                rating={treatmentQuality}
                onRatingChange={setTreatmentQuality}
              />
            </View>
          </List.Accordion>

          {/* Layer 2: Review Content - Optional */}
          <List.Accordion
            title="📝 Write a Review (Optional)"
            expanded={reviewExpanded}
            onPress={() => setReviewExpanded(!reviewExpanded)}
            style={styles.accordion}
          >
            <View style={styles.accordionContent}>
              <TextInput
                label="Review Title"
                value={reviewTitle}
                onChangeText={setReviewTitle}
                style={styles.input}
                mode="outlined"
                maxLength={100}
                placeholder="Summarize your experience..."
                right={<TextInput.Affix text={`${reviewTitle.length}/100`} />}
              />
              
              <TextInput
                label="Your Review"
                value={reviewContent}
                onChangeText={setReviewContent}
                style={styles.input}
                mode="outlined"
                multiline
                numberOfLines={4}
                maxLength={1000}
                placeholder="Share details about your experience to help other pet owners..."
                right={<TextInput.Affix text={`${reviewContent.length}/1000`} />}
              />
              
              <TextInput
                label="Visit Date (Optional)"
                value={visitDate}
                onChangeText={setVisitDate}
                style={styles.input}
                mode="outlined"
                placeholder="YYYY-MM-DD"
              />
            </View>
          </List.Accordion>

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
        </ScrollView>
      </Card.Content>
    </Card>
  );
};

// Helper component for dimensional ratings
const DimensionalRating = ({ label, rating, onRatingChange }) => (
  <View style={styles.dimensionalRatingRow}>
    <Text style={styles.dimensionalLabel}>{label}</Text>
    <StarRating
      rating={rating}
      onRatingChange={onRatingChange}
      size={20}
    />
  </View>
);

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
    maxHeight: '90%', // Prevent overflow
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
    marginBottom: 16,
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
  accordion: {
    marginBottom: 8,
    borderRadius: 8,
  },
  accordionContent: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  dimensionalRatingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  dimensionalLabel: {
    fontSize: 14,
    flex: 1,
  },
  input: {
    marginBottom: 12,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 16,
    paddingBottom: 16,
  },
  cancelButton: {
    flex: 1,
  },
  submitButton: {
    flex: 1,
  },
});