// components/veterinary/RatingDisplay.jsx
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Card, Text } from 'react-native-paper';
import { StarRating } from './StarRating';
import { RatingDimensions } from './RatingDimensions';
import { RatingDistributionChart } from './RatingDistributionChart';

// Layer 2: Enhanced rating display with dimensions and distribution
export const RatingDisplay = ({ ratingSummary, showDetails = false, style }) => {
  const { 
    average_rating, 
    total_ratings, 
    dimensional_averages = {},
    rating_distribution = {}
  } = ratingSummary;

  if (total_ratings === 0) {
    return (
      <Card style={[styles.card, style]}>
        <Card.Content style={styles.content}>
          <Text style={styles.noRatingsText}>No ratings yet</Text>
          <Text style={styles.encourageText}>Be the first to rate this clinic!</Text>
        </Card.Content>
      </Card>
    );
  }

  return (
    <View style={style}>
      {/* Main Rating Summary */}
      <Card style={styles.card}>
        <Card.Content style={styles.content}>
          <View style={styles.ratingRow}>
            <StarRating 
              rating={average_rating} 
              readonly={true} 
              size={20}
              showRatingNumber={true}
            />
            <Text style={styles.totalRatings}>
              ({total_ratings} {total_ratings === 1 ? 'rating' : 'ratings'})
            </Text>
          </View>
        </Card.Content>
      </Card>

      {/* Layer 2: Detailed breakdowns */}
      {showDetails && (
        <>
          <RatingDimensions 
            dimensionalAverages={dimensional_averages}
          />
          
          <RatingDistributionChart 
            ratingDistribution={rating_distribution}
            totalRatings={total_ratings}
          />
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    marginVertical: 8,
  },
  content: {
    paddingVertical: 12,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  totalRatings: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
  },
  noRatingsText: {
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
    color: '#666',
  },
  encourageText: {
    fontSize: 12,
    textAlign: 'center',
    color: '#999',
    marginTop: 4,
  },
});