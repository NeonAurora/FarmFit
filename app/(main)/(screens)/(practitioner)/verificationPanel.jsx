// app/(main)/(screens)/(practitioner)/verificationPanel.jsx
import React, { useState, useEffect } from 'react';
import { ScrollView, StyleSheet, View, FlatList, Alert, RefreshControl } from 'react-native';
import { 
  Text, 
  Avatar, 
  Chip,
  Divider,
  Badge,
  ActivityIndicator
} from 'react-native-paper';
import { ThemedView } from '@/components/themes/ThemedView';
import { ThemedText } from '@/components/themes/ThemedText';
import { ThemedCard } from '@/components/themes/ThemedCard';
import { ThemedButton } from '@/components/themes/ThemedButton';
import { useTheme } from '@/contexts/ThemeContext';
import { 
  useActivityIndicatorColors, 
  useChipColors, 
  useBadgeColors,
  useCardColors 
} from '@/hooks/useThemeColor';
import { useAuth } from '@/contexts/AuthContext';
import { router } from 'expo-router';
import { useRoleProtection } from '@/hooks/useRoleProtection';
import { getPendingApplications } from '@/services/supabase';
import { BrandColors } from '@/constants/Colors';

export default function VerificationPanelScreen() {
  const { colors, brandColors, isDark } = useTheme();
  const activityIndicatorColors = useActivityIndicatorColors();
  const chipColors = useChipColors();
  const badgeColors = useBadgeColors();
  const cardColors = useCardColors();
  const { user, hasRole } = useAuth();

  // Protect route - only admins can access
  const { hasAccess, loading: roleLoading } = useRoleProtection('admin', '/');

  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    pending: 0,
    today: 0,
    thisWeek: 0
  });

  useEffect(() => {
    if (hasAccess) {
      fetchApplications();
    }
  }, [hasAccess]);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const result = await getPendingApplications();
      
      if (result.success && result.data) {
        setApplications(result.data);
        calculateStats(result.data);
      } else {
        setApplications([]);
      }
    } catch (error) {
      console.error('Error fetching applications:', error);
      Alert.alert('Error', 'Failed to load applications');
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (apps) => {
    const today = new Date();
    const todayStr = today.toDateString();
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

    const stats = {
      pending: apps.length,
      today: apps.filter(app => new Date(app.created_at).toDateString() === todayStr).length,
      thisWeek: apps.filter(app => new Date(app.created_at) >= weekAgo).length
    };

    setStats(stats);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchApplications();
    setRefreshing(false);
  };

  const getTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return 'Today';
    if (diffDays === 2) return 'Yesterday';
    if (diffDays <= 7) return `${diffDays - 1} days ago`;
    if (diffDays <= 30) return `${Math.ceil(diffDays / 7)} weeks ago`;
    return `${Math.ceil(diffDays / 30)} months ago`;
  };

  const renderApplicationCard = ({ item }) => (
    <ThemedCard 
      variant="elevated"
      elevation={2}
      style={styles.applicationCard}
      onPress={() => router.push(`/reviewApplication?profileId=${item.id}`)}
    >
      <View style={styles.cardContent}>
        <View style={styles.applicationHeader}>
          <View style={styles.applicantInfo}>
            {item.profile_photo_url ? (
              <Avatar.Image 
                size={64} 
                source={{ uri: item.profile_photo_url }} 
              />
            ) : (
              <Avatar.Text 
                size={64} 
                label={item.full_name?.charAt(0)?.toUpperCase() || 'A'} 
                backgroundColor={brandColors.primary}
              />
            )}
            
            <View style={styles.applicantDetails}>
              <Text variant="titleMedium" style={[styles.applicantName, { color: colors.text }]}>
                {item.full_name}
              </Text>
              <Text variant="bodyMedium" style={[styles.designation, { color: brandColors.primary }]}>
                {item.designation}
              </Text>
              <Text variant="bodySmall" style={[styles.location, { color: colors.textSecondary }]}>
                📍 {item.sub_district}, {item.district}
              </Text>
              
              <View style={styles.applicationMeta}>
                <Chip 
                  mode="outlined" 
                  style={[
                    styles.metaChip,
                    { 
                      backgroundColor: chipColors.background,
                      borderColor: chipColors.border,
                    }
                  ]}
                  textStyle={[styles.chipText, { color: chipColors.text }]}
                  compact={false}
                >
                  {getTimeAgo(item.created_at)}
                </Chip>
                <Chip 
                  mode="outlined" 
                  style={[
                    styles.metaChip,
                    { 
                      backgroundColor: chipColors.background,
                      borderColor: chipColors.border,
                    }
                  ]}
                  textStyle={[styles.chipText, { color: chipColors.text }]}
                  compact={false}
                >
                  BVC: {item.bvc_registration_number}
                </Chip>
              </View>
            </View>
          </View>
          
          <View style={styles.statusContainer}>
            <Badge 
              style={[
                styles.pendingBadge,
                { backgroundColor: brandColors.warning }
              ]}
            >
              Pending
            </Badge>
          </View>
        </View>
        
        <Divider style={[styles.cardDivider, { backgroundColor: colors.border }]} />
        
        <ThemedText variant="bodySmall" style={styles.expertise}>
          <ThemedText style={styles.expertiseLabel}>Expertise: </ThemedText>
          {item.areas_of_expertise}
        </ThemedText>
        
        {item.verification_documents && item.verification_documents.length > 0 && (
          <ThemedText variant="bodySmall" style={styles.university}>
            <ThemedText style={styles.universityLabel}>University: </ThemedText>
            {item.verification_documents[0].university_name}
          </ThemedText>
        )}
        
        <View style={styles.quickActions}>
          <ThemedButton
            variant="primary"
            style={[styles.reviewButton, { backgroundColor: BrandColors.admin }]}
            icon="eye"
            onPress={() => router.push(`/reviewApplication?profileId=${item.id}`)}
          >
            Review Application
          </ThemedButton>
        </View>
      </View>
    </ThemedCard>
  );

  if (roleLoading || !hasAccess) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={activityIndicatorColors.primary} />
          <ThemedText style={[styles.loadingText, { color: colors.textSecondary }]}>
            Checking permissions...
          </ThemedText>
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      {/* Stats Header */}
      <ThemedCard 
        variant="elevated" 
        elevation={3} 
        style={[styles.statsCard, { backgroundColor: BrandColors.admin }]}
      >
        <View style={styles.statsContent}>
          <ThemedText 
            type="title" 
            style={[styles.statsTitle, { color: colors.textInverse }]}
          >
            Verification Dashboard
          </ThemedText>
          
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text 
                variant="headlineMedium" 
                style={[styles.statNumber, { color: colors.textInverse }]}
              >
                {stats.pending}
              </Text>
              <Text 
                variant="bodySmall" 
                style={[styles.statLabel, { color: colors.textInverse }]}
              >
                Pending
              </Text>
            </View>
            <View style={styles.statItem}>
              <Text 
                variant="headlineMedium" 
                style={[styles.statNumber, { color: colors.textInverse }]}
              >
                {stats.today}
              </Text>
              <Text 
                variant="bodySmall" 
                style={[styles.statLabel, { color: colors.textInverse }]}
              >
                Today
              </Text>
            </View>
            <View style={styles.statItem}>
              <Text 
                variant="headlineMedium" 
                style={[styles.statNumber, { color: colors.textInverse }]}
              >
                {stats.thisWeek}
              </Text>
              <Text 
                variant="bodySmall" 
                style={[styles.statLabel, { color: colors.textInverse }]}
              >
                This Week
              </Text>
            </View>
          </View>
        </View>
      </ThemedCard>

      {/* Applications List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={activityIndicatorColors.primary} />
          <ThemedText style={[styles.loadingText, { color: colors.textSecondary }]}>
            Loading applications...
          </ThemedText>
        </View>
      ) : (
        <FlatList
          data={applications}
          renderItem={renderApplicationCard}
          keyExtractor={(item) => item.id}
          style={styles.applicationsList}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl 
              refreshing={refreshing} 
              onRefresh={onRefresh}
              colors={[brandColors.primary]}
              tintColor={brandColors.primary}
            />
          }
          ListEmptyComponent={
            <ThemedCard variant="elevated" elevation={1} style={styles.emptyCard}>
              <View style={styles.emptyContent}>
                <ThemedText type="subtitle" style={styles.emptyTitle}>
                  No Pending Applications
                </ThemedText>
                <ThemedText 
                  variant="bodyMedium" 
                  style={[styles.emptyText, { color: colors.textSecondary }]}
                >
                  All practitioner applications have been reviewed
                </ThemedText>
                <ThemedButton
                  variant="primary"
                  onPress={onRefresh}
                  style={styles.refreshButton}
                  icon="refresh"
                >
                  Refresh
                </ThemedButton>
              </View>
            </ThemedCard>
          }
        />
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  statsCard: {
    margin: 16,
    marginBottom: 8,
  },
  statsContent: {
    padding: 20,
  },
  statsTitle: {
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    fontSize: 24,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    fontWeight: 'bold',
    fontSize: 28,
  },
  statLabel: {
    opacity: 0.9,
    marginTop: 4,
    fontSize: 14,
    fontWeight: '500',
  },
  applicationsList: {
    flex: 1,
    paddingHorizontal: 16,
  },
  applicationCard: {
    marginBottom: 12,
  },
  cardContent: {
    padding: 16,
  },
  applicationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  applicantInfo: {
    flexDirection: 'row',
    flex: 1,
  },
  applicantDetails: {
    marginLeft: 16,
    flex: 1,
  },
  applicantName: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  designation: {
    marginBottom: 4,
    fontWeight: '500',
  },
  location: {
    marginBottom: 12,
    opacity: 0.8,
  },
  applicationMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  metaChip: {
    height: 32, // Increased height for better content fit
    marginVertical: 2,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 16, // Better line height for readability
  },
  statusContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  pendingBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    minHeight: 32
  },
  cardDivider: {
    marginVertical: 16,
  },
  expertise: {
    marginBottom: 8,
    lineHeight: 20,
  },
  expertiseLabel: {
    fontWeight: '600',
  },
  university: {
    marginBottom: 16,
    lineHeight: 20,
  },
  universityLabel: {
    fontWeight: '600',
  },
  quickActions: {
    alignItems: 'flex-end',
    marginTop: 8,
  },
  reviewButton: {
    minWidth: 140,
  },
  emptyCard: {
    margin: 32,
  },
  emptyContent: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 24,
  },
  emptyTitle: {
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  emptyText: {
    textAlign: 'center',
    marginBottom: 24,
    opacity: 0.7,
    lineHeight: 22,
  },
  refreshButton: {
    marginTop: 8,
    minWidth: 120,
  },
});