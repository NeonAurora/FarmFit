// app/(main)/(screens)/journalViewScreen.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { ScrollView, StyleSheet, View, ActivityIndicator, Alert, Image } from 'react-native';
import { 
  Text, 
  Card, 
  Avatar, 
  Button, 
  Chip,
  IconButton,
  Divider
} from 'react-native-paper';
import { useLocalSearchParams, router } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { ThemedView } from '@/components/themes/ThemedView';
import { ThemedText } from '@/components/themes/ThemedText';
import { useTheme } from '@/contexts/ThemeContext';
import { useActivityIndicatorColors } from '@/hooks/useThemeColor';
import { BrandColors } from '@/constants/Colors';
import { useAuth } from '@/contexts/AuthContext';
import { getJournalById, deleteJournalData } from '@/services/supabase/journalService';
import { deleteImage } from '@/services/supabase';

const MOOD_EMOJIS = {
  happy: '😊',
  worried: '😟',
  proud: '😤',
  sad: '😢',
  tired: '😴'
};

export default function JournalViewScreen() {
  const { journalId } = useLocalSearchParams();
  const { colors, isDark } = useTheme();
  const activityIndicatorColors = useActivityIndicatorColors();
  const { user } = useAuth();
  
  const [journal, setJournal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useFocusEffect(
    useCallback(() => {
      if (journalId && user?.sub) {
        fetchJournal();
      }
    }, [journalId, user?.sub])
  );
  
  useEffect(() => {
    fetchJournal();
  }, [journalId]);
  
  const fetchJournal = async () => {
    if (!journalId || !user?.sub) return;
    
    setLoading(true);
    try {
      const data = await getJournalById(journalId, user.sub);
      if (!data) {
        setError('Journal not found');
        return;
      }
      setJournal(data);
      setError(null);
    } catch (err) {
      console.error('Error fetching journal:', err);
      setError('Failed to load journal');
    } finally {
      setLoading(false);
    }
  };
  
  const handleEdit = () => {
    router.push({
      pathname: '/editJournalScreen',
      params: { journalId }
    });
  };
  
  const handleDelete = async () => {
    Alert.alert(
      'Confirm Deletion',
      `Are you sure you want to delete "${journal?.title}"?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              // Delete photos from storage if they exist
              if (journal.photo_urls && journal.photo_urls.length > 0) {
                for (const url of journal.photo_urls) {
                  await deleteImage(url);
                }
              }
              
              // Delete journal record
              const result = await deleteJournalData(journalId, user.sub);
              
              if (result) {
                Alert.alert('Success', 'Journal entry deleted successfully');
                router.push('/journalListScreen');
              } else {
                throw new Error('Failed to delete journal');
              }
            } catch (error) {
              console.error('Error deleting journal:', error);
              Alert.alert('Error', 'Failed to delete journal entry');
            }
          },
        },
      ]
    );
  };
  
  if (loading) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={activityIndicatorColors.primary} />
        <ThemedText style={styles.loadingText}>Loading journal...</ThemedText>
      </ThemedView>
    );
  }
  
  if (error || !journal) {
    return (
      <ThemedView style={styles.errorContainer}>
        <Avatar.Icon 
          size={80} 
          icon="book-open-outline" 
          style={{ backgroundColor: colors.surface }}
          color={colors.textSecondary}
        />
        <ThemedText type="title" style={styles.errorTitle}>
          {error || 'Journal Not Found'}
        </ThemedText>
        <ThemedText style={styles.errorText}>
          This journal entry is not available.
        </ThemedText>
        <Button 
          mode="contained" 
          onPress={() => router.back()} 
          style={styles.backButton}
        >
          Go Back
        </Button>
      </ThemedView>
    );
  }

  const journalDate = new Date(journal.journal_date).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const createdDate = new Date(journal.created_at).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
  
  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header Card */}
        <Card style={styles.headerCard}>
          <Card.Content style={styles.headerContent}>
            {/* Title and Date */}
            <ThemedText type="title" style={styles.journalTitle}>
              {journal.title}
            </ThemedText>
            <ThemedText style={[styles.journalDate, { color: colors.textSecondary }]}>
              {journalDate}
            </ThemedText>
            
            {/* Metadata Row */}
            <View style={styles.metadataRow}>
              {journal.mood && (
                <Chip 
                  icon={() => <Text>{MOOD_EMOJIS[journal.mood]}</Text>}
                  style={[styles.moodChip, { backgroundColor: BrandColors.primary + '20' }]}
                  textStyle={[styles.moodChipText, { color: BrandColors.primary }]}
                >
                  {journal.mood}
                </Chip>
              )}
              
              {journal.is_private && (
                <Chip 
                  icon="lock" 
                  style={[styles.privateChip, { backgroundColor: colors.surface }]}
                  textStyle={[styles.chipText, { color: colors.textSecondary }]}
                >
                  Private
                </Chip>
              )}
              
              {journal.weather && (
                <Chip 
                  icon="weather-cloudy" 
                  style={[styles.weatherChip, { backgroundColor: colors.surface }]}
                  textStyle={[styles.chipText, { color: colors.textSecondary }]}
                >
                  {journal.weather}
                </Chip>
              )}
            </View>

            {/* Pet Info */}
            {journal.pet && (
              <View style={[styles.petContainer, { backgroundColor: colors.surface }]}>
                {journal.pet.image_url ? (
                  <Avatar.Image size={40} source={{ uri: journal.pet.image_url }} />
                ) : (
                  <Avatar.Icon 
                    size={40} 
                    icon="account-circle" 
                    style={{ backgroundColor: colors.surface }}
                    color={colors.textSecondary}
                  />
                )}
                <View style={styles.petInfo}>
                  <Text style={[styles.petLabel, { color: colors.textSecondary }]}>About</Text>
                  <Text style={[styles.petName, { color: colors.text }]}>{journal.pet.name}</Text>
                  <Text style={[styles.petSpecies, { color: colors.textSecondary }]}>{journal.pet.species}</Text>
                </View>
              </View>
            )}
          </Card.Content>
        </Card>

        {/* Content Card */}
        <Card style={styles.contentCard}>
          <Card.Content>
            <ThemedText style={styles.content}>{journal.content}</ThemedText>
          </Card.Content>
        </Card>

        {/* Photos */}
        {journal.photo_urls && journal.photo_urls.length > 0 && (
          <Card style={styles.photosCard}>
            <Card.Title title="📸 Photos" />
            <Card.Content>
              <View style={styles.photosContainer}>
                {journal.photo_urls.map((url, index) => (
                  <Image 
                    key={index}
                    source={{ uri: url }}
                    style={styles.photo}
                    resizeMode="cover"
                  />
                ))}
              </View>
            </Card.Content>
          </Card>
        )}

        {/* Tags */}
        {journal.tags && journal.tags.length > 0 && (
          <Card style={styles.tagsCard}>
            <Card.Title title="🏷️ Tags" />
            <Card.Content>
              <View style={styles.tagsContainer}>
                {journal.tags.map((tag, index) => (
                  <Chip 
                    key={index} 
                    style={[styles.tagChip, { backgroundColor: colors.surface }]}
                    textStyle={[styles.chipText, { color: colors.textSecondary }]}
                  >
                    #{tag}
                  </Chip>
                ))}
              </View>
            </Card.Content>
          </Card>
        )}

        {/* Additional Info */}
        {(journal.location || journal.ai_insight) && (
          <Card style={styles.additionalCard}>
            <Card.Title title="📍 Additional Information" />
            <Card.Content>
              {journal.location && (
                <View style={styles.infoRow}>
                  <Text style={[styles.infoLabel, { color: colors.text }]}>Location:</Text>
                  <Text style={[styles.infoValue, { color: colors.textSecondary }]}>{journal.location}</Text>
                </View>
              )}
              
              {journal.ai_insight && (
                <View style={styles.infoRow}>
                  <Text style={[styles.infoLabel, { color: colors.text }]}>AI Insight:</Text>
                  <Text style={[styles.infoValue, { color: colors.textSecondary }]}>{journal.ai_insight}</Text>
                </View>
              )}
            </Card.Content>
          </Card>
        )}

        {/* Meta Information */}
        <Card style={[styles.metaCard, { backgroundColor: colors.surface }]}>
          <Card.Content>
            <Text style={[styles.metaText, { color: colors.textSecondary }]}>
              Created on {createdDate}
            </Text>
            {journal.updated_at !== journal.created_at && (
              <Text style={[styles.metaText, { color: colors.textSecondary }]}>
                Last updated on {new Date(journal.updated_at).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'short', 
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </Text>
            )}
          </Card.Content>
        </Card>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <Button 
            mode="contained" 
            onPress={handleEdit}
            style={[styles.editButton, { backgroundColor: BrandColors.primary }]}
            icon="pencil"
          >
            Edit
          </Button>
          
          <Button 
            mode="outlined" 
            onPress={handleDelete}
            style={styles.deleteButton}
            labelStyle={{ color: colors.error }}
            icon="delete"
          >
            Delete
          </Button>
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorTitle: {
    marginTop: 16,
    marginBottom: 8,
  },
  errorText: {
    textAlign: 'center',
    opacity: 0.7,
    marginBottom: 16,
  },
  backButton: {
    marginTop: 8,
  },
  headerCard: {
    marginBottom: 16,
  },
  headerContent: {
    padding: 20,
  },
  journalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  journalDate: {
    fontSize: 16,
    marginBottom: 16,
  },
  metadataRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
    gap: 8,
  },
  moodChip: {
    height: 32,
    justifyContent: 'center',
  },
  moodChipText: {
    fontSize: 12,
    textTransform: 'capitalize',
    textAlignVertical: 'center',
  },
  privateChip: {
    height: 32,
    justifyContent: 'center',
  },
  weatherChip: {
    height: 32,
    justifyContent: 'center',
  },
  chipText: {
    fontSize: 12,
    textAlignVertical: 'center',
  },
  petContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
  },
  petInfo: {
    marginLeft: 12,
  },
  petLabel: {
    fontSize: 12,
    textTransform: 'uppercase',
  },
  petName: {
    fontSize: 16,
    fontWeight: '600',
  },
  petSpecies: {
    fontSize: 14,
  },
  contentCard: {
    marginBottom: 16,
  },
  content: {
    fontSize: 16,
    lineHeight: 24,
  },
  photosCard: {
    marginBottom: 16,
  },
  photosContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  photo: {
    width: 100,
    height: 100,
    borderRadius: 8,
  },
  tagsCard: {
    marginBottom: 16,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tagChip: {
    height: 28,
    justifyContent: 'center',
  },
  additionalCard: {
    marginBottom: 16,
  },
  infoRow: {
    marginBottom: 8,
  },
  infoLabel: {
    fontWeight: '500',
    marginBottom: 2,
  },
  infoValue: {
    opacity: 0.8,
  },
  metaCard: {
    marginBottom: 24,
  },
  metaText: {
    fontSize: 12,
    marginBottom: 2,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
  },
  editButton: {
    flex: 1,
  },
  deleteButton: {
    flex: 1,
  },
});