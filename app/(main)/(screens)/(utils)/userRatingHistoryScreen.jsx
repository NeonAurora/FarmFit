// app/(main)/(screens)/(rating)/userRatingHistoryScreen.jsx
import React, { useState, useEffect } from 'react';
import { View, FlatList, StyleSheet, Modal, Alert } from 'react-native';
import { Text, Card, Button, FAB, IconButton, Menu, Divider } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { ThemedView } from '@/components/themes/ThemedView';
import { StarRating } from '@/components/veterinary/StarRating';
import { RatingEditForm } from '@/components/veterinary/RatingEditForm';
import { useAuth } from '@/contexts/AuthContext';
import { getUserRatingHistory, updateUserRating, deleteUserRating } from '@/services/supabase';

export default function UserRatingHistoryScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [ratings, setRatings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingRating, setEditingRating] = useState(null);
  const [showEditForm, setShowEditForm] = useState(false);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (user?.sub) {
      loadUserRatings();
    }
  }, [user?.sub]);

  const loadUserRatings = async () => {
    try {
      setLoading(true);
      const userRatings = await getUserRatingHistory(user.sub);
      setRatings(userRatings);
    } catch (error) {
      console.error('Error loading user ratings:', error);
      Alert.alert('Error', 'Failed to load your rating history');
    } finally {
      setLoading(false);
    }
  };

  const handleEditRating = (rating) => {
    setEditingRating(rating);
    setShowEditForm(true);
  };

  const handleUpdateRating = async (updateData, editReason) => {
    if (!editingRating) return;

    setUpdating(true);
    try {
      const updatedRating = await updateUserRating(
        editingRating.id, 
        user.sub, 
        updateData, 
        editReason
      );
      
      // Update the rating in the list
      setRatings(prev => prev.map(rating => 
        rating.id === editingRating.id ? { ...rating, ...updatedRating } : rating
      ));

      setShowEditForm(false);
      setEditingRating(null);
      Alert.alert('Success', 'Your rating has been updated successfully');
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to update rating');
    } finally {
      setUpdating(false);
    }
  };

  const handleDeleteRating = async (rating) => {
    Alert.alert(
      'Delete Rating',
      'Are you sure you want to delete this rating? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteUserRating(rating.id, user.sub);
              setRatings(prev => prev.filter(r => r.id !== rating.id));
              Alert.alert('Success', 'Rating deleted successfully');
            } catch (error) {
              Alert.alert('Error', error.message || 'Failed to delete rating');
            }
          }
        }
      ]
    );
  };

  const renderRatingItem = ({ item }) => (
    <RatingHistoryCard 
      rating={item}
      onEdit={() => handleEditRating(item)}
      onDelete={() => handleDeleteRating(item)}
      onViewClinic={() => router.push(`/(main)/(screens)/(veterinary)/vetProfileViewScreen?clinicId=${item.clinic_id}`)}
    />
  );

  if (!user) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.loginPrompt}>
          <Text style={styles.promptTitle}>Login Required</Text>
          <Text style={styles.promptText}>Please login to view your rating history</Text>
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <FlatList
        data={ratings}
        renderItem={renderRatingItem}
        keyExtractor={(item) => item.id.toString()}
        refreshing={loading}
        onRefresh={loadUserRatings}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={() => (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyTitle}>No Ratings Yet</Text>
            <Text style={styles.emptyText}>
              Start rating veterinary clinics to see your history here
            </Text>
          </View>
        )}
      />

      {/* Edit Form Modal */}
      <Modal
        visible={showEditForm}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowEditForm(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {editingRating && (
              <RatingEditForm
                rating={editingRating}
                onSubmit={handleUpdateRating}
                onCancel={() => {
                  setShowEditForm(false);
                  setEditingRating(null);
                }}
                loading={updating}
              />
            )}
          </View>
        </View>
      </Modal>
    </ThemedView>
  );
}

// Rating history card component
const RatingHistoryCard = ({ rating, onEdit, onDelete, onViewClinic }) => {
  const [menuVisible, setMenuVisible] = useState(false);

  return (
    <Card style={styles.ratingCard}>
      <Card.Content>
        <View style={styles.cardHeader}>
          <View style={styles.clinicInfo}>
            <Text style={styles.clinicName}>{rating.clinic?.clinic_name}</Text>
            <Text style={styles.clinicAddress}>{rating.clinic?.full_address}</Text>
          </View>
          
          <Menu
            visible={menuVisible}
            onDismiss={() => setMenuVisible(false)}
            anchor={
              <IconButton
                icon="dots-vertical"
                onPress={() => setMenuVisible(true)}
              />
            }
          >
            <Menu.Item onPress={() => { onEdit(); setMenuVisible(false); }} title="Edit" />
            <Menu.Item onPress={() => { onViewClinic(); setMenuVisible(false); }} title="View Clinic" />
            <Divider />
            <Menu.Item onPress={() => { onDelete(); setMenuVisible(false); }} title="Delete" />
          </Menu>
        </View>

        <View style={styles.ratingRow}>
          <StarRating rating={rating.overall_rating} readonly={true} size={16} />
          <Text style={styles.ratingDate}>
            {new Date(rating.created_at).toLocaleDateString()}
            {rating.last_edited_at && (
              <Text style={styles.editedNote}> (edited)</Text>
            )}
          </Text>
        </View>

        {rating.review_title && (
          <Text style={styles.reviewTitle}>{rating.review_title}</Text>
        )}

        {rating.review_content && (
          <Text style={styles.reviewContent} numberOfLines={3}>
            {rating.review_content}
          </Text>
        )}

        <View style={styles.statsRow}>
          <Text style={styles.statsText}>
            👍 {rating.helpful_count} • 👎 {rating.not_helpful_count}
          </Text>
          {rating.edit_count > 0 && (
            <Text style={styles.editCount}>
              Edited {rating.edit_count} time(s)
            </Text>
          )}
        </View>
      </Card.Content>
    </Card>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContainer: {
    padding: 16,
    paddingBottom: 100,
  },
  ratingCard: {
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  clinicInfo: {
    flex: 1,
  },
  clinicName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  clinicAddress: {
    fontSize: 12,
    color: '#666',
  },
  ratingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  ratingDate: {
    fontSize: 12,
    color: '#666',
  },
  editedNote: {
    fontStyle: 'italic',
    color: '#999',
  },
  reviewTitle: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  reviewContent: {
    fontSize: 13,
    color: '#555',
    lineHeight: 18,
    marginBottom: 8,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statsText: {
    fontSize: 12,
    color: '#666',
  },
  editCount: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
  loginPrompt: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  promptTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 8,
  },
  promptText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 40,
  },
  modalContent: {
    width: '90%',
    maxWidth: 420,
    maxHeight: '90%',
  },
});