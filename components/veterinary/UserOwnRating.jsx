// components/veterinary/UserOwnRating.jsx
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Card, Text, Button, Chip, IconButton } from 'react-native-paper';
import { StarRating } from './StarRating';

export const UserOwnRating = ({ 
  userRating, 
  onEdit, 
  onDelete,
  style 
}) => {
  if (!userRating) return null;

  return (
    <Card style={[styles.card, style]}>
      <Card.Content>
        <View style={styles.header}>
          <Text style={styles.title}>Your Rating</Text>
          <View style={styles.actions}>
            <IconButton
              icon="pencil"
              size={20}
              onPress={onEdit}
              style={styles.actionButton}
            />
            <IconButton
              icon="delete"
              size={20}
              onPress={onDelete}
              style={styles.actionButton}
            />
          </View>
        </View>

        {/* Overall Rating */}
        <View style={styles.ratingRow}>
          <StarRating 
            rating={userRating.overall_rating} 
            readonly={true} 
            size={18}
          />
          <Text style={styles.ratingDate}>
            {new Date(userRating.created_at).toLocaleDateString()}
            {userRating.last_edited_at && (
              <Text style={styles.editedIndicator}> • Edited</Text>
            )}
          </Text>
        </View>

        {/* Review Title */}
        {userRating.review_title && (
          <Text style={styles.reviewTitle}>{userRating.review_title}</Text>
        )}

        {/* Review Content */}
        {userRating.review_content && (
          <Text style={styles.reviewContent} numberOfLines={3}>
            {userRating.review_content}
          </Text>
        )}

        {/* Dimensional Ratings */}
        <View style={styles.dimensionalRatings}>
          {userRating.staff_friendliness > 0 && (
            <Chip style={styles.dimensionChip} compact>
              👥 {userRating.staff_friendliness}/5
            </Chip>
          )}
          {userRating.cleanliness > 0 && (
            <Chip style={styles.dimensionChip} compact>
              🧽 {userRating.cleanliness}/5
            </Chip>
          )}
          {userRating.wait_time > 0 && (
            <Chip style={styles.dimensionChip} compact>
              ⏰ {userRating.wait_time}/5
            </Chip>
          )}
          {userRating.value_for_money > 0 && (
            <Chip style={styles.dimensionChip} compact>
              💰 {userRating.value_for_money}/5
            </Chip>
          )}
          {userRating.treatment_quality > 0 && (
            <Chip style={styles.dimensionChip} compact>
              🩺 {userRating.treatment_quality}/5
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
          icon="pencil"
          compact
        >
          Edit Your Rating
        </Button>
      </Card.Content>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    marginVertical: 8,
    marginHorizontal: 16,
    backgroundColor: '#f8f9ff', // Slightly different background to distinguish
    borderWidth: 1,
    borderColor: '#e3f2fd',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2196f3',
  },
  actions: {
    flexDirection: 'row',
  },
  actionButton: {
    margin: 0,
  },
  ratingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  ratingDate: {
    fontSize: 12,
    color: '#666',
  },
  editedIndicator: {
    fontStyle: 'italic',
    color: '#999',
  },
  reviewTitle: {
    fontSize: 15,
    fontWeight: '500',
    marginBottom: 4,
    color: '#333',
  },
  reviewContent: {
    fontSize: 13,
    lineHeight: 18,
    color: '#555',
    marginBottom: 8,
  },
  dimensionalRatings: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  dimensionChip: {
    marginRight: 4,
    marginBottom: 4,
    backgroundColor: '#e3f2fd',
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
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
  },
  editButton: {
    borderColor: '#2196f3',
  },
});