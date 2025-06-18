// components/veterinary/RatingsList.jsx
import React from 'react';
import { useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { Button, Card, Text, Avatar, Chip } from 'react-native-paper';
import { StarRating } from './StarRating';
import { ReportButton } from './ReportButton';
import { useAuth } from '@/contexts/AuthContext';
import { HelpfulnessVoting } from './HelpfulnessVoting';
import { getUserHelpfulnessVotes } from '@/services/supabase';

// Layer 4: Enhanced ratings list (excludes current user's rating)
export const RatingsList = ({ 
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
        const votes = await getUserHelpfulnessVotes(user.sub, ratingIds);
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
                {item.visit_date && ` • Visited: ${new Date(item.visit_date).toLocaleDateString()}`}
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

        {/* Layer 2: Review title */}
        {item.review_title && (
          <Text style={styles.reviewTitle}>{item.review_title}</Text>
        )}

        {/* Layer 2: Review content */}
        {item.review_content && (
          <Text style={styles.reviewContent}>{item.review_content}</Text>
        )}

        {/* Layer 2: Dimensional ratings (if any) */}
        <View style={styles.dimensionalRatings}>
          {item.staff_friendliness > 0 && (
            <Chip style={styles.dimensionChip} compact>
              👥 {item.staff_friendliness}/5
            </Chip>
          )}
          {item.cleanliness > 0 && (
            <Chip style={styles.dimensionChip} compact>
              🧽 {item.cleanliness}/5
            </Chip>
          )}
          {item.wait_time > 0 && (
            <Chip style={styles.dimensionChip} compact>
              ⏰ {item.wait_time}/5
            </Chip>
          )}
          {item.value_for_money > 0 && (
            <Chip style={styles.dimensionChip} compact>
              💰 {item.value_for_money}/5
            </Chip>
          )}
          {item.treatment_quality > 0 && (
            <Chip style={styles.dimensionChip} compact>
              🩺 {item.treatment_quality}/5
            </Chip>
          )}
        </View>

        {/* Layer 4: Helpfulness voting */}
        <HelpfulnessVoting
          ratingId={item.id}
          initialHelpfulCount={item.helpful_count}
          initialNotHelpfulCount={item.not_helpful_count}
          currentUserVote={helpfulnessVotes[item.id] || null}
          currentUserId={user?.sub}
          onVoteChange={handleVoteChange}
          disabled={false} // No longer needed since we filter out user's own rating
        />

        {/* Layer 3: Show if flagged (for debugging/admin) */}
        {item.is_flagged && (
          <View style={styles.flaggedNotice}>
            <Text style={styles.flaggedText}>⚠️ This content has been flagged for review</Text>
          </View>
        )}

        {/* Layer 3: Report functionality */}
        {user && onReport && (
          <View style={styles.actionRow}>
            <ReportButton 
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
      {/* Layer 4: Sort options */}
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

      {otherUsersRatings.map(renderRatingItem)}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 8,
  },
  sortContainer: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  sortLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  sortButtons: {
    flexDirection: 'row',
    marginHorizontal: -4,
  },
  sortButton: {
    flex: 1,
    marginHorizontal: 4,
  },
  ratingCard: {
    marginHorizontal: 16,
    marginVertical: 6,
  },
  ratingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
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
    marginBottom: 4,
    color: '#333',
  },
  reviewContent: {
    fontSize: 14,
    lineHeight: 20,
    color: '#555',
    marginBottom: 8,
  },
  dimensionalRatings: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  dimensionChip: {
    marginRight: 4,
    marginBottom: 4,
    backgroundColor: '#f0f0f0',
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
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  flaggedNotice: {
    marginTop: 8,
    padding: 8,
    backgroundColor: '#fff3cd',
    borderRadius: 4,
    borderLeftWidth: 4,
    borderLeftColor: '#ffc107',
  },
  flaggedText: {
    fontSize: 12,
    color: '#856404',
    fontStyle: 'italic',
  },
});