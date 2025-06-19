// components/practitioner/PractitionerRatingForm.jsx
import React, { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Card, Text, Button, TextInput, List } from 'react-native-paper';
import { StarRating } from '../veterinary/StarRating';

// Helper function for rating text
const getRatingText = (rating) => {
  switch (rating) {
    case 1: return 'Poor';
    case 2: return 'Fair';
    case 3: return 'Good';
    case 4: return 'Very Good';
    case 5: return 'Excellent';
    default: return '';
  }
};

// Helper component for dimensional ratings
const DimensionalRating = ({ label, rating, onRatingChange }) => (
  <View style={styles.dimensionalRating}>
    <Text style={styles.dimensionalLabel}>{label}</Text>
    <StarRating
      rating={rating}
      onRatingChange={onRatingChange}
      size={24}
    />
  </View>
);

export const PractitionerRatingForm = ({ practitionerId, practitionerName, onSubmit, onCancel }) => {
  const [overallRating, setOverallRating] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Practitioner-specific dimensional ratings
  const [communicationSkills, setCommunicationSkills] = useState(0);
  const [knowledgeExpertise, setKnowledgeExpertise] = useState(0);
  const [consultationQuality, setConsultationQuality] = useState(0);
  const [valueForMoney, setValueForMoney] = useState(0);
  const [punctuality, setPunctuality] = useState(0);
  
  // Review content
  const [reviewTitle, setReviewTitle] = useState('');
  const [reviewContent, setReviewContent] = useState('');
  const [consultationDate, setConsultationDate] = useState('');
  
  // UI state
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
        practitioner_id: practitionerId,
        overall_rating: overallRating,
        // Include dimensional ratings (only if > 0)
        communication_skills: communicationSkills > 0 ? communicationSkills : null,
        knowledge_expertise: knowledgeExpertise > 0 ? knowledgeExpertise : null,
        consultation_quality: consultationQuality > 0 ? consultationQuality : null,
        value_for_money: valueForMoney > 0 ? valueForMoney : null,
        punctuality: punctuality > 0 ? punctuality : null,
        // Include review content (only if not empty)
        review_title: reviewTitle.trim() || null,
        review_content: reviewContent.trim() || null,
        consultation_date: consultationDate || null
      };

      await onSubmit(ratingData);
    } catch (error) {
      console.error('Error submitting practitioner rating:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card style={styles.card}>
      <Card.Content>
        <ScrollView showsVerticalScrollIndicator={false}>
          <Text style={styles.title}>Rate Your Experience</Text>
          <Text style={styles.practitionerName}>{practitionerName}</Text>
          
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

          {/* Detailed Ratings - Optional */}
          <List.Accordion
            title="📊 Detailed Ratings (Optional)"
            expanded={detailedRatingsExpanded}
            onPress={() => setDetailedRatingsExpanded(!detailedRatingsExpanded)}
            style={styles.accordion}
          >
            <View style={styles.accordionContent}>
              <DimensionalRating
                label="💬 Communication Skills"
                rating={communicationSkills}
                onRatingChange={setCommunicationSkills}
              />
              <DimensionalRating
                label="🧠 Knowledge & Expertise"
                rating={knowledgeExpertise}
                onRatingChange={setKnowledgeExpertise}
              />
              <DimensionalRating
                label="👨‍⚕️ Consultation Quality"
                rating={consultationQuality}
                onRatingChange={setConsultationQuality}
              />
              <DimensionalRating
                label="💰 Value for Money"
                rating={valueForMoney}
                onRatingChange={setValueForMoney}
              />
              <DimensionalRating
                label="⏰ Punctuality"
                rating={punctuality}
                onRatingChange={setPunctuality}
              />
            </View>
          </List.Accordion>

          {/* Review Content - Optional */}
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
                placeholder="Share details about your consultation to help other pet owners..."
                right={<TextInput.Affix text={`${reviewContent.length}/1000`} />}
              />
              
              <TextInput
                label="Consultation Date (Optional)"
                value={consultationDate}
                onChangeText={setConsultationDate}
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

const styles = StyleSheet.create({
  card: {
    margin: 16,
    elevation: 4,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  practitionerName: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
    color: '#666',
  },
  ratingSection: {
    alignItems: 'center',
    marginBottom: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
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
    backgroundColor: '#F5F5F5',
    marginBottom: 12,
    borderRadius: 8,
  },
  accordionContent: {
    padding: 16,
  },
  dimensionalRating: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  dimensionalLabel: {
    fontSize: 14,
    flex: 1,
  },
  input: {
    marginBottom: 16,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
    gap: 12,
  },
  cancelButton: {
    flex: 1,
  },
  submitButton: {
    flex: 1,
  },
});