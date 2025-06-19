// components/practitioner/PractitionerRatingsList.jsx
import React, { useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { Button, Card, Text, Avatar, Chip } from 'react-native-paper';
import { StarRating } from '../veterinary/StarRating';
import { PractitionerReportButton } from './PractitionerReportButton';
import { useAuth } from '@/contexts/AuthContext';
import { PractitionerHelpfulnessVoting } from './PractitionerHelpfulnessVoting';
import { getUserPractitionerHelpfulnessVotes } from '@/services/supabase';

export const PractitionerRatingsList = ({ 
  ratings, 
  loading = false, 
  onReport, 
  onSortChange, 
  currentSort = 'created_at' 
}) => {
  const { user } = useAuth();
  const [helpfulnessVotes, setHelpfulnessVotes] = useState({});

  // Filter out current user's rating
  const otherUsersRatings = ratings.filter(rating => 
    rating.user_id !== user?.sub
  );

  // Load user's helpfulness votes when component mounts
  useEffect(() => {
    const loadHelpfulnessVotes = async () => {
      if (user?.sub && otherUsersRatings.length > 0) {
        const ratingIds = otherUsersRatings.map(r => r.id);
        const votes = await getUserPractitionerHelpfulnessVotes(user.sub, ratingIds);
        setHelpfulnessVotes(votes);
      }
    };

    loadHelpfulnessVotes();
  }, [user?.sub, otherUsersRatings]);

  // Handle helpfulness vote changes
  const handleVoteChange = (ratingId, helpfulCount, notHelpfulCount, userVote) => {
    setHelpfulnessVotes(prev => ({
      ...prev,
      [ratingId]: userVote
    }));
  };

  const renderRatingItem = (item, index) => (
    <Card key={item.id.toString()} style={styles.ratingCard}>
      <Card.Content>
        {/* Header with author and rating */}
        <View style={styles.ratingHeader}>
          <View style={styles.authorInfo}>
            <Avatar.Image 
              size={32} 
              source={{ uri: item.author?.picture || 'https://via.placeholder.com/32' }} 
            />
            <View style={styles.authorDetails}>
              <Text style={styles.authorName}>
                {item.is_anonymous ? 'Anonymous User' : (item.author?.name || 'Anonymous')}
              </Text>
              <Text style={styles.ratingDate}>
                {new Date(item.created_at).toLocaleDateString()}
                {item.consultation_date && ` • Consulted: ${new Date(item.consultation_date).toLocaleDateString()}`}
                {item.last_edited_at && (
                  <Text style={styles.editedIndicator}> • Edited</Text>
                )}
              </Text>
            </View>
          </View>
          <View style={styles.ratingInfo}>
            <StarRating 
              rating={item.overall_rating} 
              readonly={true} 
              size={16}
            />
          </View>
        </View>

        {/* Review title */}
        {item.review_title && (
          <Text style={styles.reviewTitle}>{item.review_title}</Text>
        )}

        {/* Review content */}
        {item.review_content && (
          <Text style={styles.reviewContent}>{item.review_content}</Text>
        )}

        {/* Dimensional ratings (practitioner-specific) */}
        <View style={styles.dimensionalRatings}>
          {item.communication_skills > 0 && (
            <Chip style={styles.dimensionChip} compact>
              💬 {item.communication_skills}/5
            </Chip>
          )}
          {item.knowledge_expertise > 0 && (
            <Chip style={styles.dimensionChip} compact>
              🧠 {item.knowledge_expertise}/5
            </Chip>
          )}
          {item.consultation_quality > 0 && (
            <Chip style={styles.dimensionChip} compact>
              👨‍⚕️ {item.consultation_quality}/5
            </Chip>
          )}
          {item.value_for_money > 0 && (
            <Chip style={styles.dimensionChip} compact>
              💰 {item.value_for_money}/5
            </Chip>
          )}
          {item.punctuality > 0 && (
            <Chip style={styles.dimensionChip} compact>
              ⏰ {item.punctuality}/5
            </Chip>
          )}
        </View>

        {/* Helpfulness voting */}
        <PractitionerHelpfulnessVoting
          ratingId={item.id}
          initialHelpfulCount={item.helpful_count}
          initialNotHelpfulCount={item.not_helpful_count}
          currentUserVote={helpfulnessVotes[item.id] || null}
          currentUserId={user?.sub}
          onVoteChange={handleVoteChange}
          disabled={false}
        />

        {/* Show if flagged (for debugging/admin) */}
        {item.is_flagged && (
          <View style={styles.flaggedNotice}>
            <Text style={styles.flaggedText}>⚠️ This content has been flagged for review</Text>
          </View>
        )}

        {/* Report functionality */}
        {user && onReport && (
          <View style={styles.actionRow}>
            <PractitionerReportButton 
              ratingId={item.id} 
              onReport={onReport}
            />
          </View>
        )}
      </Card.Content>
    </Card>
  );

  if (otherUsersRatings.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>
          {ratings.length > 0 ? 'No other reviews yet' : 'No ratings yet'}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Sort options */}
      {onSortChange && (
        <View style={styles.sortContainer}>
          <Text style={styles.sortLabel}>Sort by:</Text>
          <View style={styles.sortButtons}>
            <Button
              mode={currentSort === 'created_at' ? 'contained' : 'outlined'}
              onPress={() => onSortChange('created_at')}
              style={styles.sortButton}
              compact
            >
              Newest
            </Button>
            <Button
              mode={currentSort === 'helpfulness' ? 'contained' : 'outlined'}
              onPress={() => onSortChange('helpfulness')}
              style={styles.sortButton}
              compact
            >
              Most Helpful
            </Button>
            <Button
              mode={currentSort === 'rating' ? 'contained' : 'outlined'}
              onPress={() => onSortChange('rating')}
              style={styles.sortButton}
              compact
            >
              Highest Rated
            </Button>
          </View>
        </View>
      )}

      {/* Ratings list */}
      {otherUsersRatings.map(renderRatingItem)}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  sortContainer: {
    backgroundColor: '#F5F5F5',
    padding: 12,
    marginBottom: 8,
  },
  sortLabel: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 8,
    color: '#666',
  },
  sortButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  sortButton: {
    minWidth: 80,
  },
  ratingCard: {
    marginBottom: 12,
    elevation: 2,
  },
  ratingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  authorInfo: {
    flexDirection: 'row',
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
    marginTop: 2,
  },
  editedIndicator: {
    fontStyle: 'italic',
    color: '#999',
  },
  ratingInfo: {
    alignItems: 'flex-end',
  },
  reviewTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  reviewContent: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
    color: '#555',
  },
  dimensionalRatings: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 12,
  },
  dimensionChip: {
    backgroundColor: '#E3F2FD',
  },
  flaggedNotice: {
    backgroundColor: '#FFF3E0',
    padding: 8,
    borderRadius: 4,
    marginTop: 8,
  },
  flaggedText: {
    fontSize: 12,
    color: '#F57C00',
    textAlign: 'center',
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  emptyContainer: {
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
});