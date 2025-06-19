
// components/practitioner/PractitionerUserOwnRating.jsx
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Card, Text, Button, Chip } from 'react-native-paper';
import { StarRating } from '../veterinary/StarRating';

export const PractitionerUserOwnRating = ({ userRating, onEdit, onDelete }) => {
  if (!userRating) return null;

  return (
    <Card style={styles.card}>
      <Card.Content>
        <View style={styles.header}>
          <Text style={styles.title}>Your Rating</Text>
          <StarRating 
            rating={userRating.overall_rating} 
            readonly={true} 
            size={16}
          />
        </View>

        {/* Review title */}
        {userRating.review_title && (
          <Text style={styles.reviewTitle}>{userRating.review_title}</Text>
        )}

        {/* Review content */}
        {userRating.review_content && (
          <Text style={styles.reviewContent} numberOfLines={3}>
            {userRating.review_content}
          </Text>
        )}

        {/* Dimensional Ratings (practitioner-specific) */}
        <View style={styles.dimensionalRatings}>
          {userRating.communication_skills > 0 && (
            <Chip style={styles.dimensionChip} compact>
              💬 {userRating.communication_skills}/5
            </Chip>
          )}
          {userRating.knowledge_expertise > 0 && (
            <Chip style={styles.dimensionChip} compact>
              🧠 {userRating.knowledge_expertise}/5
            </Chip>
          )}
          {userRating.consultation_quality > 0 && (
            <Chip style={styles.dimensionChip} compact>
              👨‍⚕️ {userRating.consultation_quality}/5
            </Chip>
          )}
          {userRating.value_for_money > 0 && (
            <Chip style={styles.dimensionChip} compact>
              💰 {userRating.value_for_money}/5
            </Chip>
          )}
          {userRating.punctuality > 0 && (
            <Chip style={styles.dimensionChip} compact>
              ⏰ {userRating.punctuality}/5
            </Chip>
          )}
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <Text style={styles.statsText}>
            👍 {userRating.helpful_count} • 👎 {userRating.not_helpful_count}
          </Text>
          {userRating.edit_count > 0 && (
            <Text style={styles.editCount}>
              Edited {userRating.edit_count} time(s)
            </Text>
          )}
        </View>

        {/* Edit Button */}
        <Button
          mode="outlined"
          onPress={onEdit}
          style={styles.editButton}
        >
          Edit Rating
        </Button>
      </Card.Content>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    marginVertical: 8,
    backgroundColor: '#E8F5E8',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2E7D32',
  },
  reviewTitle: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  reviewContent: {
    fontSize: 13,
    color: '#555',
    marginBottom: 12,
  },
  dimensionalRatings: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 12,
  },
  dimensionChip: {
    backgroundColor: '#C8E6C9',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  statsText: {
    fontSize: 12,
    color: '#666',
  },
  editCount: {
    fontSize: 10,
    color: '#999',
    fontStyle: 'italic',
  },
  editButton: {
    borderColor: '#2E7D32',
  },
});