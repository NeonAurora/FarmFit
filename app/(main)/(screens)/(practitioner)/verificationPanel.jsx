// app/(main)/(screens)/(practitioner)/verificationPanel.jsx
import React, { useState, useEffect } from 'react';
import { ScrollView, StyleSheet, View, FlatList, Alert, RefreshControl } from 'react-native';
import { 
  Card, 
  Text, 
  Avatar, 
  Button,
  Chip,
  Divider,
  List,
  Badge,
  ActivityIndicator
} from 'react-native-paper';
import { ThemedView } from '@/components/themes/ThemedView';
import { useColorScheme } from '@/hooks/useColorScheme.native';
import { useAuth } from '@/contexts/AuthContext';
import { router } from 'expo-router';
import { useRoleProtection } from '@/hooks/useRoleProtection';
import { getPendingApplications } from '@/services/supabase';

export default function VerificationPanelScreen() {
  const colorScheme = useColorScheme();
  const { user, hasRole } = useAuth();
  const isDark = colorScheme === 'dark';

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
    <Card 
      style={styles.applicationCard}
      onPress={() => router.push(`/reviewApplication?profileId=${item.id}`)}
    >
      <Card.Content>
        <View style={styles.applicationHeader}>
          <View style={styles.applicantInfo}>
            {item.profile_photo_url ? (
              <Avatar.Image 
                size={60} 
                source={{ uri: item.profile_photo_url }} 
              />
            ) : (
              <Avatar.Text 
                size={60} 
                label={item.full_name?.charAt(0)?.toUpperCase() || 'A'} 
                backgroundColor="#27AE60"
              />
            )}
            
            <View style={styles.applicantDetails}>
              <Text variant="titleMedium" style={styles.applicantName}>
                {item.full_name}
              </Text>
              <Text variant="bodyMedium" style={styles.designation}>
                {item.designation}
              </Text>
              <Text variant="bodySmall" style={styles.location}>
                📍 {item.sub_district}, {item.district}
              </Text>
              
              <View style={styles.applicationMeta}>
                <Chip 
                  mode="outlined" 
                  style={styles.timeChip}
                  compact
                >
                  {getTimeAgo(item.created_at)}
                </Chip>
                <Chip 
                  mode="outlined" 
                  style={styles.bvcChip}
                  compact
                >
                  BVC: {item.bvc_registration_number}
                </Chip>
              </View>
            </View>
          </View>
          
          <View style={styles.statusContainer}>
            <Badge style={styles.pendingBadge}>
              Pending
            </Badge>
          </View>
        </View>
        
        <Divider style={styles.cardDivider} />
        
        <Text variant="bodySmall" style={styles.expertise}>
          <Text style={styles.expertiseLabel}>Expertise: </Text>
          {item.areas_of_expertise}
        </Text>
        
        {item.verification_documents && item.verification_documents.length > 0 && (
          <Text variant="bodySmall" style={styles.university}>
            <Text style={styles.universityLabel}>University: </Text>
            {item.verification_documents[0].university_name}
          </Text>
        )}
        
        <View style={styles.quickActions}>
          <Button
            mode="contained"
            style={styles.reviewButton}
            icon="eye"
            onPress={() => router.push(`/reviewApplication?profileId=${item.id}`)}
          >
            Review
          </Button>
        </View>
      </Card.Content>
    </Card>
  );

  if (roleLoading || !hasAccess) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#E74C3C" />
          <Text style={styles.loadingText}>Checking permissions...</Text>
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      {/* Stats Header */}
      <Card style={styles.statsCard}>
        <Card.Content>
          <Text variant="titleLarge" style={styles.statsTitle}>
            Verification Dashboard
          </Text>
          
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text variant="headlineMedium" style={styles.statNumber}>
                {stats.pending}
              </Text>
              <Text variant="bodySmall" style={styles.statLabel}>
                Pending
              </Text>
            </View>
            <View style={styles.statItem}>
              <Text variant="headlineMedium" style={styles.statNumber}>
                {stats.today}
              </Text>
              <Text variant="bodySmall" style={styles.statLabel}>
                Today
              </Text>
            </View>
            <View style={styles.statItem}>
              <Text variant="headlineMedium" style={styles.statNumber}>
                {stats.thisWeek}
              </Text>
              <Text variant="bodySmall" style={styles.statLabel}>
                This Week
              </Text>
            </View>
          </View>
        </Card.Content>
      </Card>

      {/* Applications List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#E74C3C" />
          <Text style={styles.loadingText}>Loading applications...</Text>
        </View>
      ) : (
        <FlatList
          data={applications}
          renderItem={renderApplicationCard}
          keyExtractor={(item) => item.id}
          style={styles.applicationsList}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={
            <Card style={styles.emptyCard}>
              <Card.Content style={styles.emptyContent}>
                <Text variant="titleMedium" style={styles.emptyTitle}>
                  No Pending Applications
                </Text>
                <Text variant="bodyMedium" style={styles.emptyText}>
                  All practitioner applications have been reviewed
                </Text>
                <Button
                  mode="contained"
                  onPress={onRefresh}
                  style={styles.refreshButton}
                  icon="refresh"
                >
                  Refresh
                </Button>
              </Card.Content>
            </Card>
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
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  statsCard: {
    margin: 16,
    marginBottom: 8,
    elevation: 3,
    backgroundColor: '#E74C3C',
  },
  statsTitle: {
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 16,
    color: 'white',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontWeight: 'bold',
    color: 'white',
  },
  statLabel: {
    color: 'white',
    opacity: 0.9,
    marginTop: 4,
  },
  applicationsList: {
    flex: 1,
    paddingHorizontal: 16,
  },
  applicationCard: {
    marginBottom: 12,
    elevation: 2,
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
    marginBottom: 2,
  },
  designation: {
    color: '#27AE60',
    marginBottom: 2,
  },
  location: {
    opacity: 0.7,
    marginBottom: 8,
  },
  applicationMeta: {
    flexDirection: 'row',
    gap: 8,
  },
  timeChip: {
    height: 24,
  },
  bvcChip: {
    height: 24,
  },
  statusContainer: {
    alignItems: 'center',
  },
  pendingBadge: {
    backgroundColor: '#F39C12',
    color: 'white',
  },
  cardDivider: {
    marginVertical: 12,
  },
  expertise: {
    marginBottom: 4,
  },
  expertiseLabel: {
    fontWeight: '500',
  },
  university: {
    marginBottom: 12,
  },
  universityLabel: {
    fontWeight: '500',
  },
  quickActions: {
    alignItems: 'flex-end',
  },
  reviewButton: {
    backgroundColor: '#E74C3C',
  },
  emptyCard: {
    margin: 32,
    elevation: 1,
  },
  emptyContent: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyTitle: {
    fontWeight: 'bold',
    marginBottom: 8,
  },
  emptyText: {
    textAlign: 'center',
    marginBottom: 24,
    opacity: 0.7,
  },
  refreshButton: {
    marginTop: 8,
  },
});