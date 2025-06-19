// components/practitioners/PractitionerRatingDimensions.jsx
import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text, Card, ProgressBar, IconButton } from 'react-native-paper';
import { StarRating } from '../veterinary/StarRating';

export const PractitionerRatingDimensions = ({ dimensionalAverages, style }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const dimensions = [
    { key: 'communication_skills', label: 'Communication Skills', icon: '💬' },
    { key: 'knowledge_expertise', label: 'Knowledge & Expertise', icon: '🧠' },
    { key: 'consultation_quality', label: 'Consultation Quality', icon: '👨‍⚕️' },
    { key: 'value_for_money', label: 'Value for Money', icon: '💰' },
    { key: 'punctuality', label: 'Punctuality', icon: '⏰' }
  ];

  const hasAnyRatings = dimensions.some(dim => dimensionalAverages[dim.key] > 0);

  if (!hasAnyRatings) {
    return null;
  }

  const ratingsWithValues = dimensions.filter(dim => dimensionalAverages[dim.key] > 0);

  return (
    <Card style={[styles.card, style]}>
      <Card.Content>
        {/* Expandable Header */}
        <TouchableOpacity 
          style={styles.header} 
          onPress={() => setIsExpanded(!isExpanded)}
          activeOpacity={0.7}
        >
          <Text style={styles.title}>Rating Breakdown</Text>
          <View style={styles.headerRight}>
            <Text style={styles.ratingsCount}>
              {ratingsWithValues.length} dimension{ratingsWithValues.length !== 1 ? 's' : ''}
            </Text>
            <IconButton
              icon={isExpanded ? 'chevron-up' : 'chevron-down'}
              size={20}
              style={styles.chevronButton}
              iconColor="#666"
            />
          </View>
        </TouchableOpacity>

        {/* Expandable Content */}
        {isExpanded && (
          <View style={styles.dimensionsContainer}>
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
          </View>
        )}

        {/* Collapsed Preview - Show top 2 dimensions when collapsed */}
        {!isExpanded && (
          <View style={styles.previewContainer}>
            {ratingsWithValues.slice(0, 2).map(dimension => {
              const rating = dimensionalAverages[dimension.key];
              
              return (
                <View key={dimension.key} style={styles.previewRow}>
                  <Text style={styles.previewIcon}>{dimension.icon}</Text>
                  <Text style={styles.previewLabel}>{dimension.label}</Text>
                  <View style={styles.previewRating}>
                    <StarRating rating={rating} readonly={true} size={14} />
                    <Text style={styles.previewValue}>{rating.toFixed(1)}</Text>
                  </View>
                </View>
              );
            })}
            {ratingsWithValues.length > 2 && (
              <Text style={styles.moreText}>
                +{ratingsWithValues.length - 2} more
              </Text>
            )}
          </View>
        )}
      </Card.Content>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    marginVertical: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingsCount: {
    fontSize: 12,
    color: '#666',
    marginRight: 4,
  },
  chevronButton: {
    margin: 0,
    padding: 0,
  },
  dimensionsContainer: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
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
  previewContainer: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  previewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  previewIcon: {
    fontSize: 14,
    marginRight: 6,
  },
  previewLabel: {
    fontSize: 12,
    flex: 1,
    color: '#666',
  },
  previewRating: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  previewValue: {
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 6,
    minWidth: 25,
    color: '#666',
  },
  moreText: {
    fontSize: 11,
    color: '#999',
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 4,
  },
});