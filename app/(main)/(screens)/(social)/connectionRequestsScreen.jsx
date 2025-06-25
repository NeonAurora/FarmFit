// app/(main)/(screens)/connectionRequestsScreen.jsx
import React, { useState, useEffect } from 'react';
import { FlatList, StyleSheet, View, Alert } from 'react-native';
import { 
  Text, 
  Avatar, 
  ActivityIndicator
} from 'react-native-paper';
import { ThemedView } from '@/components/themes/ThemedView';
import { ThemedText } from '@/components/themes/ThemedText';
import { ThemedCard } from '@/components/themes/ThemedCard';
import { ThemedButton } from '@/components/themes/ThemedButton';
import { useTheme } from '@/contexts/ThemeContext';
import { 
  useActivityIndicatorColors, 
  useAvatarColors
} from '@/hooks/useThemeColor';
import { useAuth } from '@/contexts/AuthContext';
import { 
  getConnectionRequests, 
  respondToConnectionRequest,
  subscribeToConnections 
} from '@/services/supabase/connectionService';

export default function ConnectionRequestsScreen() {
  const { user } = useAuth();
  const { colors, brandColors, isDark } = useTheme();
  const activityIndicatorColors = useActivityIndicatorColors();
  const avatarColors = useAvatarColors();
  
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [responding, setResponding] = useState(new Set());

  useEffect(() => {
    if (user?.sub) {
      fetchRequests();
      
      // Subscribe to real-time updates
      const unsubscribe = subscribeToConnections(user.sub, () => {
        fetchRequests(); // Refetch when connections change
      });
      
      return unsubscribe;
    }
  }, [user?.sub]);

  const fetchRequests = async () => {
    try {
      const data = await getConnectionRequests(user.sub);
      setRequests(data);
    } catch (error) {
      console.error('Error fetching requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleResponse = async (connectionId, response) => {
    // Add to responding set
    setResponding(prev => new Set([...prev, connectionId]));
    
    try {
      const result = await respondToConnectionRequest(connectionId, response, user.sub);
      
      if (result.success) {
        // Remove the request from the list
        setRequests(prev => prev.filter(req => req.connection_id !== connectionId));
        Alert.alert(
          'Success', 
          `Connection request ${response === 'accepted' ? 'accepted' : 'declined'} successfully!`
        );
      } else {
        Alert.alert('Error', result.error);
      }
    } catch (error) {
      Alert.alert('Error', `Failed to ${response} connection request`);
    } finally {
      // Remove from responding set
      setResponding(prev => {
        const newSet = new Set(prev);
        newSet.delete(connectionId);
        return newSet;
      });
    }
  };

  const renderRequestCard = ({ item }) => {
    const isResponding = responding.has(item.connection_id); // Fixed: using .has() for Set
    
    return (
      <ThemedCard variant="elevated" elevation={1} style={styles.requestCard}>
        <View style={styles.cardContent}>
          <View style={styles.userInfo}>
            {item.requester_picture ? (
              <Avatar.Image size={56} source={{ uri: item.requester_picture }} />
            ) : (
              <Avatar.Text 
                size={56} 
                label={(item.requester_name?.charAt(0) || item.requester_email?.charAt(0) || 'U').toUpperCase()}
                backgroundColor={avatarColors.background}
                color={avatarColors.text}
              />
            )}
            
            <View style={styles.userDetails}>
              <ThemedText type="defaultSemiBold" style={[styles.userName, { color: colors.text }]}>
                {item.requester_name || 'Anonymous User'}
              </ThemedText>
              <ThemedText style={[styles.userEmail, { color: colors.textSecondary }]}>
                {item.requester_email}
              </ThemedText>
              <ThemedText variant="bodySmall" style={[styles.requestDate, { color: colors.textMuted }]}>
                Requested on {new Date(item.request_date).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric'
                })}
              </ThemedText>
            </View>
          </View>
          
          <View style={styles.actionButtons}>
            <ThemedButton
              onPress={() => handleResponse(item.connection_id, 'accepted')}
              disabled={isResponding}
              loading={isResponding}
              style={[styles.acceptButton, { backgroundColor: brandColors.success }]}
              labelStyle={{ color: colors.textInverse }}
              icon="check"
              compact
            >
              Accept
            </ThemedButton>
            
            <ThemedButton
              variant="outlined"
              onPress={() => handleResponse(item.connection_id, 'declined')}
              disabled={isResponding}
              loading={isResponding}
              style={[styles.declineButton, { borderColor: brandColors.error }]}
              labelStyle={{ color: brandColors.error }}
              icon="close"
              compact
            >
              Decline
            </ThemedButton>
          </View>
        </View>
      </ThemedCard>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Avatar.Icon 
        size={80} 
        icon="account-clock" 
        backgroundColor={colors.backgroundSecondary}
        color={colors.textSecondary}
      />
      <ThemedText type="subtitle" style={styles.emptyTitle}>
        No Connection Requests
      </ThemedText>
      <ThemedText style={[styles.emptyText, { color: colors.textSecondary }]}>
        You don't have any pending connection requests at the moment.
      </ThemedText>
      <ThemedText variant="bodySmall" style={[styles.emptyHint, { color: colors.textMuted }]}>
        When someone sends you a connection request, it will appear here.
      </ThemedText>
    </View>
  );

  if (loading) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={activityIndicatorColors.primary} />
        <ThemedText style={[styles.loadingText, { color: colors.textSecondary }]}>
          Loading connection requests...
        </ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      {/* Header Stats */}
      {requests.length > 0 && (
        <View style={[styles.headerStats, { backgroundColor: colors.backgroundSecondary }]}>
          <ThemedText variant="bodyMedium" style={[styles.statsText, { color: colors.textSecondary }]}>
            {requests.length} pending request{requests.length !== 1 ? 's' : ''}
          </ThemedText>
        </View>
      )}

      <FlatList
        data={requests}
        renderItem={renderRequestCard}
        keyExtractor={item => item.connection_id.toString()}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={renderEmptyState}
        showsVerticalScrollIndicator={false}
      />
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
  listContent: {
    padding: 16,
    flexGrow: 1,
  },
  requestCard: {
    marginBottom: 8,
  },
  cardContent: {
    padding: 16,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  userDetails: {
    marginLeft: 16,
    flex: 1,
  },
  userName: {
    fontSize: 16,
    marginBottom: 2,
  },
  userEmail: {
    fontSize: 14,
    marginBottom: 2,
    opacity: 0.8,
  },
  requestDate: {
    fontSize: 12,
    opacity: 0.6,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  acceptButton: {
    flex: 1,
    paddingVertical: 8,
  },
  declineButton: {
    flex: 1,
    paddingVertical: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    minHeight: 300,
  },
  emptyTitle: {
    marginTop: 20,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyText: {
    textAlign: 'center',
    opacity: 0.8,
    lineHeight: 22,
    marginBottom: 8,
  },
  emptyHint: {
    textAlign: 'center',
    opacity: 0.6,
    lineHeight: 18,
    fontStyle: 'italic',
  },
});