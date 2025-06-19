// components/practitioner/PractitionerHelpfulnessVoting.jsx
import React, { useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { Button, Text } from 'react-native-paper';
import { voteOnPractitionerRatingHelpfulness } from '@/services/supabase';

export const PractitionerHelpfulnessVoting = ({ 
  ratingId, 
  initialHelpfulCount = 0, 
  initialNotHelpfulCount = 0,
  currentUserVote = null, // null, true (helpful), false (not helpful)
  onVoteChange,
  currentUserId,
  disabled = false
}) => {
  const [helpfulCount, setHelpfulCount] = useState(initialHelpfulCount);
  const [notHelpfulCount, setNotHelpfulCount] = useState(initialNotHelpfulCount);
  const [userVote, setUserVote] = useState(currentUserVote);
  const [isVoting, setIsVoting] = useState(false);

  useEffect(() => {
    setHelpfulCount(initialHelpfulCount);
    setNotHelpfulCount(initialNotHelpfulCount);
    setUserVote(currentUserVote);
  }, [initialHelpfulCount, initialNotHelpfulCount, currentUserVote]);

  const handleVote = async (isHelpful) => {
    if (!currentUserId || disabled || isVoting) return;

    setIsVoting(true);
    try {
      const result = await voteOnPractitionerRatingHelpfulness(ratingId, currentUserId, isHelpful);
      
      // Update local state based on the result
      let newHelpfulCount = helpfulCount;
      let newNotHelpfulCount = notHelpfulCount;
      let newUserVote = userVote;

      if (result.action === 'created') {
        if (isHelpful) {
          newHelpfulCount++;
          newUserVote = true;
        } else {
          newNotHelpfulCount++;
          newUserVote = false;
        }
      } else if (result.action === 'updated') {
        // User changed their vote
        if (userVote === true) {
          newHelpfulCount--;
        } else if (userVote === false) {
          newNotHelpfulCount--;
        }
        
        if (isHelpful) {
          newHelpfulCount++;
          newUserVote = true;
        } else {
          newNotHelpfulCount++;
          newUserVote = false;
        }
      } else if (result.action === 'removed') {
        // User removed their vote
        if (userVote === true) {
          newHelpfulCount--;
        } else if (userVote === false) {
          newNotHelpfulCount--;
        }
        newUserVote = null;
      }

      setHelpfulCount(newHelpfulCount);
      setNotHelpfulCount(newNotHelpfulCount);
      setUserVote(newUserVote);

      // Notify parent component
      if (onVoteChange) {
        onVoteChange(ratingId, newHelpfulCount, newNotHelpfulCount, newUserVote);
      }
    } catch (error) {
      console.error('Error voting on practitioner rating helpfulness:', error);
    } finally {
      setIsVoting(false);
    }
  };

  if (!currentUserId) {
    // Show counts only for non-logged-in users
    return (
      <View style={styles.container}>
        <Text style={styles.countsOnly}>
          {helpfulCount + notHelpfulCount > 0 
            ? `${helpfulCount} helpful • ${notHelpfulCount} not helpful`
            : ''
          }
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.helpfulnessLabel}>Was this review helpful?</Text>
      <View style={styles.votingButtons}>
        <Button
          mode={userVote === true ? 'contained' : 'outlined'}
          onPress={() => handleVote(true)}
          disabled={isVoting}
          style={[styles.voteButton, userVote === true && styles.helpfulSelected]}
          compact
        >
          👍 {helpfulCount}
        </Button>
        <Button
          mode={userVote === false ? 'contained' : 'outlined'}
          onPress={() => handleVote(false)}
          disabled={isVoting}
          style={[styles.voteButton, userVote === false && styles.notHelpfulSelected]}
          compact
        >
          👎 {notHelpfulCount}
        </Button>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  helpfulnessLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
  },
  votingButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  voteButton: {
    minWidth: 70,
  },
  helpfulSelected: {
    backgroundColor: '#4CAF50',
  },
  notHelpfulSelected: {
    backgroundColor: '#F44336',
  },
  countsOnly: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
});