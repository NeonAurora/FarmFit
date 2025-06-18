// components/veterinary/RatingEditForm.jsx
import React, { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Card, Text, Button, TextInput, List } from 'react-native-paper';
import { StarRating } from './StarRating';

export const RatingEditForm = ({ 
  rating, 
  onSubmit, 
  onCancel, 
  loading = false 
}) => {
  const [overallRating, setOverallRating] = useState(rating.overall_rating);
  const [staffFriendliness, setStaffFriendliness] = useState(rating.staff_friendliness || 0);
  const [cleanliness, setCleanliness] = useState(rating.cleanliness || 0);
  const [waitTime, setWaitTime] = useState(rating.wait_time || 0);
  const [valueForMoney, setValueForMoney] = useState(rating.value_for_money || 0);
  const [treatmentQuality, setTreatmentQuality] = useState(rating.treatment_quality || 0);
  const [reviewTitle, setReviewTitle] = useState(rating.review_title || '');
  const [reviewContent, setReviewContent] = useState(rating.review_content || '');
  const [visitDate, setVisitDate] = useState(rating.visit_date || '');
  const [editReason, setEditReason] = useState('');
  
  const [detailedRatingsExpanded, setDetailedRatingsExpanded] = useState(false);
  const [reviewExpanded, setReviewExpanded] = useState(false);

  const handleSubmit = () => {
    if (overallRating === 0) {
      alert('Please select an overall rating');
      return;
    }

    const updateData = {
      overall_rating: overallRating,
      staff_friendliness: staffFriendliness > 0 ? staffFriendliness : null,
      cleanliness: cleanliness > 0 ? cleanliness : null,
      wait_time: waitTime > 0 ? waitTime : null,
      value_for_money: valueForMoney > 0 ? valueForMoney : null,
      treatment_quality: treatmentQuality > 0 ? treatmentQuality : null,
      review_title: reviewTitle.trim() || null,
      review_content: reviewContent.trim() || null,
      visit_date: visitDate || null
    };

    onSubmit(updateData, editReason.trim() || null);
  };

  return (
    <Card style={styles.card}>
      <Card.Content>
        <ScrollView showsVerticalScrollIndicator={false}>
          <Text style={styles.title}>Edit Your Rating</Text>
          <Text style={styles.clinicName}>{rating.clinic?.clinic_name}</Text>
          
          {/* Edit count warning */}
          {rating.edit_count > 0 && (
            <View style={styles.editWarning}>
              <Text style={styles.editWarningText}>
                ⚠️ This rating has been edited {rating.edit_count} time(s). 
                Maximum {3 - rating.edit_count} edits remaining.
              </Text>
            </View>
          )}

          {/* Overall Rating */}
          <View style={styles.ratingSection}>
            <Text style={styles.ratingLabel}>Overall Rating *</Text>
            <StarRating
              rating={overallRating}
              onRatingChange={setOverallRating}
              size={32}
            />
          </View>

          {/* Detailed Ratings */}
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

          {/* Review Content */}
          <List.Accordion
            title="📝 Review Content (Optional)"
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

          {/* Edit Reason */}
          <TextInput
            label="Reason for Edit (Optional)"
            value={editReason}
            onChangeText={setEditReason}
            style={styles.input}
            mode="outlined"
            placeholder="Why are you updating this rating?"
            maxLength={200}
            right={<TextInput.Affix text={`${editReason.length}/200`} />}
          />

          <View style={styles.buttonContainer}>
            <Button 
              mode="outlined" 
              onPress={onCancel}
              style={styles.cancelButton}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button 
              mode="contained" 
              onPress={handleSubmit}
              style={styles.submitButton}
              loading={loading}
              disabled={loading || overallRating === 0}
            >
              Update Rating
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

const styles = StyleSheet.create({
  card: {
    margin: 16,
    maxHeight: '90%',
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
    marginBottom: 16,
  },
  editWarning: {
    backgroundColor: '#fff3cd',
    padding: 12,
    borderRadius: 4,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#ffc107',
  },
  editWarningText: {
    fontSize: 12,
    color: '#856404',
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