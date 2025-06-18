// components/veterinary/RatingDimensions.jsx
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Card, ProgressBar } from 'react-native-paper';
import { StarRating } from './StarRating';

export const RatingDimensions = ({ dimensionalAverages, style }) => {
  const dimensions = [
    { key: 'staff_friendliness', label: 'Staff Friendliness', icon: '👥' },
    { key: 'cleanliness', label: 'Cleanliness', icon: '🧽' },
    { key: 'wait_time', label: 'Wait Time', icon: '⏰' },
    { key: 'value_for_money', label: 'Value for Money', icon: '💰' },
    { key: 'treatment_quality', label: 'Treatment Quality', icon: '🩺' }
  ];

  const hasAnyRatings = dimensions.some(dim => dimensionalAverages[dim.key] > 0);

  if (!hasAnyRatings) {
    return null;
  }

  return (
    <Card style={[styles.card, style]}>
      <Card.Content>
        <Text style={styles.title}>Rating Breakdown</Text>
        {dimensions.map(dimension => {
          const rating = dimensionalAverages[dimension.key];
          if (rating === 0) return null;
          
          return (
            <View key={dimension.key} style={styles.dimensionRow}>
              <View style={styles.dimensionInfo}>
                <Text style={styles.dimensionIcon}>{dimension.icon}</Text>
                <Text style={styles.dimensionLabel}>{dimension.label}</Text>
              </View>
              <View style={styles.dimensionRating}>
                <StarRating rating={rating} readonly={true} size={16} />
                <Text style={styles.ratingValue}>{rating.toFixed(1)}</Text>
              </View>
            </View>
          );
        })}
      </Card.Content>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    marginVertical: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  dimensionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  dimensionInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  dimensionIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  dimensionLabel: {
    fontSize: 14,
    flex: 1,
  },
  dimensionRating: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingValue: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 8,
    minWidth: 30,
  },
});