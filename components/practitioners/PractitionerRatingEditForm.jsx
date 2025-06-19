// components/practitioners/PractitionerRatingEditForm.jsx
import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Card, Text, Button, TextInput, List } from 'react-native-paper';
import { StarRating } from '../veterinary/StarRating';

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

export const PractitionerRatingEditForm = ({ 
  rating, 
  practitionerName, 
  onSubmit, 
  onCancel, 
  isUpdating = false 
}) => {
  const [overallRating, setOverallRating] = useState(rating.overall_rating || 0);
  const [communicationSkills, setCommunicationSkills] = useState(rating.communication_skills || 0);
  const [knowledgeExpertise, setKnowledgeExpertise] = useState(rating.knowledge_expertise || 0);
  const [consultationQuality, setConsultationQuality] = useState(rating.consultation_quality || 0);
  const [valueForMoney, setValueForMoney] = useState(rating.value_for_money || 0);
  const [punctuality, setPunctuality] = useState(rating.punctuality || 0);
  const [reviewTitle, setReviewTitle] = useState(rating.review_title || '');
  const [reviewContent, setReviewContent] = useState(rating.review_content || '');
  const [consultationDate, setConsultationDate] = useState(rating.consultation_date || '');
  const [editReason, setEditReason] = useState('');
  
  const [detailedRatingsExpanded, setDetailedRatingsExpanded] = useState(false);
  const [reviewExpanded, setReviewExpanded] = useState(false);

  const handleSubmit = async () => {
    if (overallRating === 0) {
      onSubmit(null, null, 'Please select an overall rating before submitting.');
      return;
    }

    const updateData = {
      overall_rating: overallRating,
      communication_skills: communicationSkills > 0 ? communicationSkills : null,
      knowledge_expertise: knowledgeExpertise > 0 ? knowledgeExpertise : null,
      consultation_quality: consultationQuality > 0 ? consultationQuality : null,
      value_for_money: valueForMoney > 0 ? valueForMoney : null,
      punctuality: punctuality > 0 ? punctuality : null,
      review_title: reviewTitle.trim() || null,
      review_content: reviewContent.trim() || null,
      consultation_date: consultationDate || null
    };

    await onSubmit(updateData, editReason.trim() || 'Updated rating');
  };

  return (
    <Card style={styles.card}>
      <Card.Content>
        <ScrollView showsVerticalScrollIndicator={false}>
          <Text style={styles.title}>Edit Your Rating</Text>
          <Text style={styles.practitionerName}>{practitionerName}</Text>
          
          {/* Edit limit warning */}
          {rating.edit_count !== undefined && (
            <View style={styles.editWarning}>
              <Text style={styles.editWarningText}>
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
                label="Consultation Date (Optional)"
                value={consultationDate}
                onChangeText={setConsultationDate}
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
            maxLength={200}
            placeholder="Why are you updating this rating?"
            right={<TextInput.Affix text={`${editReason.length}/200`} />}
          />

          <View style={styles.buttonContainer}>
            <Button 
              mode="outlined" 
              onPress={onCancel}
              style={styles.cancelButton}
              disabled={isUpdating}
            >
              Cancel
            </Button>
            <Button 
              mode="contained" 
              onPress={handleSubmit}
              style={styles.submitButton}
              loading={isUpdating}
              disabled={isUpdating || overallRating === 0}
            >
              Update Rating
            </Button>
          </View>
        </ScrollView>
      </Card.Content>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    margin: 0,
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
    marginBottom: 16,
    color: '#666',
  },
  editWarning: {
    backgroundColor: '#FFF3E0',
    padding: 8,
    borderRadius: 4,
    marginBottom: 16,
  },
  editWarningText: {
    fontSize: 12,
    color: '#F57C00',
    textAlign: 'center',
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