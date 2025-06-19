// components/practitioners/PractitionerRatingDistributionChart.jsx
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Card, ProgressBar } from 'react-native-paper';

export const PractitionerRatingDistributionChart = ({ ratingDistribution, totalRatings, style }) => {
  if (totalRatings === 0) {
    return null;
  }

  const renderStarBar = (stars, count) => {
    const percentage = totalRatings > 0 ? count / totalRatings : 0;
    
    return (
      <View key={stars} style={styles.starBarRow}>
        <Text style={styles.starLabel}>{stars} ⭐</Text>
        <View style={styles.progressContainer}>
          <ProgressBar 
            progress={percentage} 
            color="#FFD700"
            style={styles.progressBar}
          />
        </View>
        <Text style={styles.countLabel}>{count}</Text>
      </View>
    );
  };

  return (
    <Card style={[styles.card, style]}>
      <Card.Content>
        <Text style={styles.title}>Rating Distribution</Text>
        {[5, 4, 3, 2, 1].map(stars => 
          renderStarBar(stars, ratingDistribution[stars] || 0)
        )}
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
  starBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
  },
  starLabel: {
    fontSize: 12,
    width: 35,
  },
  progressContainer: {
    flex: 1,
    marginHorizontal: 12,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
  },
  countLabel: {
    fontSize: 12,
    width: 25,
    textAlign: 'right',
    color: '#666',
  },
});