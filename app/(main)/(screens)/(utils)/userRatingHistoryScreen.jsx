// app/(main)/(screens)/(utils)/userRatingHistoryScreen.jsx
import React, { useState, useEffect } from 'react';
import { View, FlatList, StyleSheet, Modal, Alert } from 'react-native';
import { Text, IconButton, Menu, Divider, ActivityIndicator } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { ThemedView } from '@/components/themes/ThemedView';
import { ThemedText } from '@/components/themes/ThemedText';
import { ThemedCard } from '@/components/themes/ThemedCard';
import { ThemedButton } from '@/components/themes/ThemedButton';
import { StarRating } from '@/components/veterinary/StarRating';
import { RatingEditForm } from '@/components/veterinary/RatingEditForm';
import { useTheme } from '@/contexts/ThemeContext';
import { 
  useActivityIndicatorColors, 
  useCardColors
} from '@/hooks/useThemeColor';
import { useAuth } from '@/contexts/AuthContext';
import { getUserRatingHistory, updateUserRating, deleteUserRating } from '@/services/supabase';

export default function UserRatingHistoryScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const { colors, brandColors, isDark } = useTheme();
  const activityIndicatorColors = useActivityIndicatorColors();
  const cardColors = useCardColors();
  
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
      colors={colors}
      brandColors={brandColors}
    />
  );

  if (!user) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.loginPrompt}>
          <ThemedText type="subtitle" style={styles.promptTitle}>
            Login Required
          </ThemedText>
          <ThemedText style={[styles.promptText, { color: colors.textSecondary }]}>
            Please login to view your rating history
          </ThemedText>
          <ThemedButton
            variant="primary"
            onPress={() => router.push('/')}
            style={styles.loginButton}
          >
            Go to Login
          </ThemedButton>
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      {/* Header Stats */}
      {ratings.length > 0 && (
        <View style={[styles.headerStats, { backgroundColor: colors.backgroundSecondary }]}>
          <ThemedText variant="bodyMedium" style={[styles.statsText, { color: colors.textSecondary }]}>
            {ratings.length} rating{ratings.length !== 1 ? 's' : ''} given
          </ThemedText>
        </View>
      )}

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
            <ThemedText type="subtitle" style={styles.emptyTitle}>
              No Ratings Yet
            </ThemedText>
            <ThemedText style={[styles.emptyText, { color: colors.textSecondary }]}>
              Start rating veterinary clinics to see your history here
            </ThemedText>
            <ThemedButton
              variant="outlined"
              onPress={() => router.push('/(main)/(screens)/(veterinary)/vetSearchScreen')}
              style={styles.findClinicsButton}
              icon="map-search"
            >
              Find Clinics
            </ThemedButton>
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
          <View style={[styles.modalContent, { backgroundColor: cardColors.background }]}>
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
const RatingHistoryCard = ({ rating, onEdit, onDelete, onViewClinic, colors, brandColors }) => {
  const [menuVisible, setMenuVisible] = useState(false);

  return (
    <ThemedCard variant="elevated" elevation={1} style={styles.ratingCard}>
      <View style={styles.cardContent}>
        <View style={styles.cardHeader}>
          <View style={styles.clinicInfo}>
            <ThemedText type="defaultSemiBold" style={[styles.clinicName, { color: colors.text }]}>
              {rating.clinic?.clinic_name}
            </ThemedText>
            <ThemedText variant="bodySmall" style={[styles.clinicAddress, { color: colors.textSecondary }]}>
              {rating.clinic?.full_address}
            </ThemedText>
          </View>
          
          <Menu
            visible={menuVisible}
            onDismiss={() => setMenuVisible(false)}
            anchor={
              <IconButton
                icon="dots-vertical"
                size={20}
                onPress={() => setMenuVisible(true)}
                iconColor={colors.textSecondary}
              />
            }
            contentStyle={{ backgroundColor: colors.surface }}
          >
            <Menu.Item 
              onPress={() => { onEdit(); setMenuVisible(false); }} 
              title="Edit" 
              titleStyle={{ color: colors.text }}
            />
            <Menu.Item 
              onPress={() => { onViewClinic(); setMenuVisible(false); }} 
              title="View Clinic" 
              titleStyle={{ color: colors.text }}
            />
            <Divider style={{ backgroundColor: colors.border }} />
            <Menu.Item 
              onPress={() => { onDelete(); setMenuVisible(false); }} 
              title="Delete" 
              titleStyle={{ color: brandColors.error }}
            />
          </Menu>
        </View>

        <View style={styles.ratingRow}>
          <StarRating rating={rating.overall_rating} readonly={true} size={16} />
          <ThemedText variant="bodySmall" style={[styles.ratingDate, { color: colors.textMuted }]}>
            {new Date(rating.created_at).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'short',
              day: 'numeric'
            })}
            {rating.last_edited_at && (
              <ThemedText style={[styles.editedNote, { color: colors.textMuted }]}>
                {' '}(edited)
              </ThemedText>
            )}
          </ThemedText>
        </View>

        {rating.review_title && (
          <ThemedText type="defaultSemiBold" style={[styles.reviewTitle, { color: colors.text }]}>
            {rating.review_title}
          </ThemedText>
        )}

        {rating.review_content && (
          <ThemedText 
            variant="bodyMedium" 
            style={[styles.reviewContent, { color: colors.textSecondary }]} 
            numberOfLines={3}
          >
            {rating.review_content}
          </ThemedText>
        )}

        <View style={styles.statsRow}>
          <ThemedText variant="bodySmall" style={[styles.statsText, { color: colors.textMuted }]}>
            👍 {rating.helpful_count} • 👎 {rating.not_helpful_count}
          </ThemedText>
          {rating.edit_count > 0 && (
            <ThemedText variant="bodySmall" style={[styles.editCount, { color: colors.textMuted }]}>
              Edited {rating.edit_count} time{rating.edit_count !== 1 ? 's' : ''}
            </ThemedText>
          )}
        </View>
      </View>
    </ThemedCard>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerStats: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  statsText: {
    textAlign: 'center',
    fontWeight: '500',
  },
  listContainer: {
    padding: 16,
    paddingBottom: 32,
    flexGrow: 1,
  },
  ratingCard: {
    marginBottom: 8,
  },
  cardContent: {
    padding: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  clinicInfo: {
    flex: 1,
    marginRight: 8,
  },
  clinicName: {
    fontSize: 16,
    marginBottom: 2,
  },
  clinicAddress: {
    fontSize: 12,
    opacity: 0.8,
  },
  ratingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  ratingDate: {
    fontSize: 12,
    opacity: 0.7,
  },
  editedNote: {
    fontStyle: 'italic',
    opacity: 0.6,
  },
  reviewTitle: {
    fontSize: 14,
    marginBottom: 4,
  },
  reviewContent: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 8,
    opacity: 0.8,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  editCount: {
    fontSize: 12,
    fontStyle: 'italic',
    opacity: 0.7,
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
    minHeight: 300,
    justifyContent: 'center',
  },
  emptyTitle: {
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 20,
    opacity: 0.8,
  },
  findClinicsButton: {
    marginTop: 8,
    minWidth: 140,
  },
  loginPrompt: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  promptTitle: {
    marginBottom: 8,
    textAlign: 'center',
  },
  promptText: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 20,
    opacity: 0.8,
  },
  loginButton: {
    marginTop: 8,
    minWidth: 120,
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
    width: '95%',
    maxWidth: 420,
    maxHeight: '90%',
    borderRadius: 12,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
});