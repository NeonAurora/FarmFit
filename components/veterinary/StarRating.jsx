// components/veterinary/StarRating.jsx
import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import Icon from '@expo/vector-icons/MaterialIcons';

// Layer 1: Basic star rating component (reusable)
export const StarRating = ({ 
  rating, 
  onRatingChange = null, 
  size = 24, 
  readonly = false,
  showRatingNumber = false 
}) => {
  const renderStar = (starNumber) => {
    const filled = starNumber <= rating;
    
    if (readonly) {
      return (
        <Icon
          key={starNumber}
          name={filled ? 'star' : 'star-border'}
          size={size}
          color={filled ? '#FFD700' : '#DDD'}
          style={styles.star}
        />
      );
    }

    return (
      <TouchableOpacity
        key={starNumber}
        onPress={() => onRatingChange && onRatingChange(starNumber)}
        style={styles.starButton}
        activeOpacity={0.7}
      >
        <Icon
          name={filled ? 'star' : 'star-border'}
          size={size}
          color={filled ? '#FFD700' : '#DDD'}
        />
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.starsContainer}>
        {[1, 2, 3, 4, 5].map(renderStar)}
      </View>
      {showRatingNumber && (
        <Text style={styles.ratingNumber}>
          {rating.toFixed(1)}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  starsContainer: {
    flexDirection: 'row',
  },
  starButton: {
    padding: 2,
  },
  star: {
    marginHorizontal: 1,
  },
  ratingNumber: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
});