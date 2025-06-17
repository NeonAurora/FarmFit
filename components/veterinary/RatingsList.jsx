// components/veterinary/RatingsList.jsx
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Card, Text, Avatar } from 'react-native-paper';
import { StarRating } from './StarRating';

// Layer 1: Simple list of ratings (NO FlatList)
export const RatingsList = ({ ratings, loading = false }) => {
  const renderRatingItem = (item, index) => (
    <Card key={item.id.toString()} style={styles.ratingCard}>
      <Card.Content>
        <View style={styles.ratingHeader}>
          <View style={styles.authorInfo}>
            <Avatar.Image 
              size={32} 
              source={{ uri: item.author?.picture || 'https://via.placeholder.com/32' }} 
            />
            <View style={styles.authorDetails}>
              <Text style={styles.authorName}>
                {item.author?.name || 'Anonymous'}
              </Text>
              <Text style={styles.ratingDate}>
                {new Date(item.created_at).toLocaleDateString()}
              </Text>
            </View>
          </View>
          <StarRating 
            rating={item.overall_rating} 
            readonly={true} 
            size={16}
          />
        </View>
      </Card.Content>
    </Card>
  );

  if (ratings.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No ratings yet</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {ratings.map(renderRatingItem)}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 8,
  },
  ratingCard: {
    marginHorizontal: 16,
    marginVertical: 4,
  },
  ratingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  authorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  authorDetails: {
    marginLeft: 12,
    flex: 1,
  },
  authorName: {
    fontSize: 14,
    fontWeight: '500',
  },
  ratingDate: {
    fontSize: 12,
    color: '#666',
  },
  emptyContainer: {
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
});