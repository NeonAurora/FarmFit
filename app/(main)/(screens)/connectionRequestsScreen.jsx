// app/(main)/(screens)/connectionRequestsScreen.jsx
import React, { useState, useEffect } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { 
  Card, 
  Text, 
  Avatar, 
  Button, 
  ActivityIndicator,
  Divider
} from 'react-native-paper';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { useAuth } from '@/contexts/AuthContext';
import { useColorScheme } from '@/hooks/useColorScheme';
import { 
  getConnectionRequests, 
  respondToConnectionRequest,
  subscribeToConnections 
} from '@/services/supabase/connectionService';

export default function ConnectionRequestsScreen() {
  const { user } = useAuth();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  
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
    const isResponding = responding[item.connection_id];
    
    return (
      <Card style={[styles.requestCard, isDark && styles.requestCardDark]}>
        <Card.Content style={styles.cardContent}>
          <View style={styles.userInfo}>
            {item.requester_picture ? (
              <Avatar.Image size={60} source={{ uri: item.requester_picture }} />
            ) : (
              <Avatar.Text 
                size={60} 
                label={(item.requester_name?.charAt(0) || item.requester_email?.charAt(0) || 'U').toUpperCase()}
                backgroundColor={isDark ? '#444' : '#e0e0e0'}
                color={isDark ? '#fff' : '#666'}
              />
            )}
            
            <View style={styles.userDetails}>
              <ThemedText style={styles.userName}>
                {item.requester_name || 'Anonymous User'}
              </ThemedText>
              <ThemedText style={styles.userEmail}>
                {item.requester_email}
              </ThemedText>
              <ThemedText style={styles.requestDate}>
                {new Date(item.request_date).toLocaleDateString()}
              </ThemedText>
            </View>
          </View>
          
          <View style={styles.actionButtons}>
            <Button
              mode="contained"
              onPress={() => handleResponse(item.connection_id, 'accepted')}
              disabled={isResponding} // ✅ Always boolean
              loading={isResponding} // ✅ Could show loading for both buttons
              style={styles.acceptButton}
              icon="check"
              compact
            >
              Accept
            </Button>
            
            <Button
              mode="outlined"
              onPress={() => handleResponse(item.connection_id, 'declined')}
              disabled={isResponding} // ✅ Always boolean
              loading={isResponding}
              style={styles.declineButton}
              icon="close"
              compact
            >
              Decline
            </Button>
          </View>
        </Card.Content>
      </Card>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Avatar.Icon size={80} icon="account-clock" backgroundColor="#e0e0e0" />
      <ThemedText type="title" style={styles.emptyTitle}>
        No Connection Requests
      </ThemedText>
      <ThemedText style={styles.emptyText}>
        You don't have any pending connection requests at the moment.
      </ThemedText>
    </View>
  );

  if (loading) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0a7ea4" />
        <ThemedText style={styles.loadingText}>Loading requests...</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
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
  },
  loadingText: {
    marginTop: 10,
  },
  listContent: {
    padding: 16,
    flexGrow: 1,
  },
  requestCard: {
    marginBottom: 12,
    elevation: 2,
  },
  requestCardDark: {
    backgroundColor: '#333',
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
    fontWeight: '600',
    marginBottom: 2,
  },
  userEmail: {
    fontSize: 14,
    opacity: 0.7,
    marginBottom: 2,
  },
  requestDate: {
    fontSize: 12,
    opacity: 0.5,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  acceptButton: {
    flex: 1,
    backgroundColor: '#4CAF50',
  },
  declineButton: {
    flex: 1,
    borderColor: '#f44336',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyTitle: {
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    textAlign: 'center',
    opacity: 0.7,
  },
});