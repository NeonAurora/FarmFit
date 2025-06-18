// components/veterinary/HelpfulnessVoting.jsx
import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { Button, Text } from 'react-native-paper';
import { voteOnRatingHelpfulness } from '@/services/supabase';

export const HelpfulnessVoting = ({ 
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
      const result = await voteOnRatingHelpfulness(ratingId, currentUserId, isHelpful);
      
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
      console.error('Error voting on helpfulness:', error);
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
            ? `${helpfulCount} found this helpful`
            : 'No votes yet'
          }
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.questionText}>Was this review helpful?</Text>
      <View style={styles.buttonContainer}>
        <View style={styles.buttonWrapper}>
          <Button
            mode={userVote === true ? 'contained' : 'outlined'}
            onPress={() => handleVote(true)}
            disabled={disabled || isVoting}
            style={[
              styles.voteButton,
              userVote === true && styles.activeButton,
              Platform.OS === 'web' && styles.webButton // Web-specific styling
            ]}
            contentStyle={styles.buttonContent}
            compact
          >
            👍 Yes ({helpfulCount})
          </Button>
        </View>
        
        <View style={styles.buttonSpacer} />
        
        <View style={styles.buttonWrapper}>
          <Button
            mode={userVote === false ? 'contained' : 'outlined'}
            onPress={() => handleVote(false)}
            disabled={disabled || isVoting}
            style={[
              styles.voteButton,
              userVote === false && styles.activeButton,
              Platform.OS === 'web' && styles.webButton // Web-specific styling
            ]}
            contentStyle={styles.buttonContent}
            compact
          >
            👎 No ({notHelpfulCount})
          </Button>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  questionText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
  },
  buttonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    // Remove gap property for web compatibility
  },
  buttonWrapper: {
    flex: 1,
  },
  buttonSpacer: {
    width: 8, // Replace gap with explicit spacer
  },
  voteButton: {
    // Remove flex: 1 for web compatibility
    width: '100%',
  },
  buttonContent: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  webButton: {
    // Web-specific button styling
    minHeight: 36,
    justifyContent: 'center',
  },
  activeButton: {
    backgroundColor: '#e3f2fd',
  },
  countsOnly: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
});