// app/(main)/(screens)/connectionsScreen.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { FlatList, StyleSheet, View, TouchableOpacity } from 'react-native';
import { 
  Card, 
  Text, 
  Avatar, 
  ActivityIndicator, 
  Searchbar,
  Button,
  Divider,
  IconButton
} from 'react-native-paper';
import { useFocusEffect } from '@react-navigation/native';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useAuth } from '@/contexts/AuthContext';
import { getUserConnections } from '@/services/supabase/connectionService';
import { router } from 'expo-router';

export default function ConnectionsScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { user } = useAuth();
  
  const [connections, setConnections] = useState([]);
  const [filteredConnections, setFilteredConnections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState(null);

  // Fetch connections when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      if (user?.sub) {
        fetchConnections();
      }
    }, [user?.sub])
  );

  // Filter connections when search query changes
  useEffect(() => {
    filterConnections();
  }, [searchQuery, connections]);

  const fetchConnections = async (isRefresh = false) => {
    if (isRefresh) {
      setIsRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      const data = await getUserConnections(user.sub);
      setConnections(data);
      setFilteredConnections(data);
    } catch (err) {
      console.error('Error fetching connections:', err);
      setError('Failed to load connections');
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  const filterConnections = () => {
    if (!searchQuery.trim()) {
      setFilteredConnections(connections);
      return;
    }

    const filtered = connections.filter(connection =>
      connection.user?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      connection.user?.email?.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredConnections(filtered);
  };

  const handleRefresh = async () => {
    await fetchConnections(true);
  };

  const handleUserPress = (connection) => {
    // Navigate to user profile using the user's database ID
    router.push({
      pathname: '/userProfileScreen',
      params: { userId: connection.user.id || connection.connection_id }
    });
  };

  const handleSendMessage = (connection) => {
    // Placeholder for messaging functionality
    console.log('Send message to:', connection.user?.name);
    alert('Messaging feature coming soon!');
  };

  const clearSearch = () => {
    setSearchQuery('');
  };

  const renderConnectionCard = ({ item }) => {
    const connectionDate = new Date(item.connection_date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });

    return (
      <TouchableOpacity onPress={() => handleUserPress(item)}>
        <Card style={[styles.connectionCard, isDark && styles.connectionCardDark]}>
          <Card.Content style={styles.cardContent}>
            <View style={styles.userInfo}>
              {item.user?.picture ? (
                <Avatar.Image size={60} source={{ uri: item.user.picture }} />
              ) : (
                <Avatar.Text 
                  size={60} 
                  label={(item.user?.name?.charAt(0) || item.user?.email?.charAt(0) || 'U').toUpperCase()}
                  backgroundColor={isDark ? '#444' : '#e0e0e0'}
                  color={isDark ? '#fff' : '#666'}
                />
              )}
              
              <View style={styles.userDetails}>
                <ThemedText style={styles.userName}>
                  {item.user?.name || 'Anonymous User'}
                </ThemedText>
                <ThemedText style={styles.userEmail}>
                  {item.user?.email}
                </ThemedText>
                <ThemedText style={styles.connectionDate}>
                  Connected on {connectionDate}
                </ThemedText>
              </View>
            </View>
            
            <View style={styles.actionButtons}>
              <IconButton
                icon="message"
                size={24}
                onPress={() => handleSendMessage(item)}
                style={styles.messageButton}
                iconColor="#0a7ea4"
              />
              <IconButton
                icon="account"
                size={24}
                onPress={() => handleUserPress(item)}
                style={styles.profileButton}
                iconColor="#0a7ea4"
              />
            </View>
          </Card.Content>
        </Card>
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => {
    if (searchQuery && filteredConnections.length === 0 && connections.length > 0) {
      return (
        <View style={styles.emptyContainer}>
          <Avatar.Icon size={80} icon="account-search" backgroundColor="#e0e0e0" />
          <ThemedText type="title" style={styles.emptyTitle}>
            No Connections Found
          </ThemedText>
          <ThemedText style={styles.emptyText}>
            No connections match "{searchQuery}"
          </ThemedText>
          <Button mode="outlined" onPress={clearSearch} style={styles.clearButton}>
            Clear Search
          </Button>
        </View>
      );
    }

    return (
      <View style={styles.emptyContainer}>
        <Avatar.Icon size={80} icon="account-group" backgroundColor="#e0e0e0" />
        <ThemedText type="title" style={styles.emptyTitle}>
          No Connections Yet
        </ThemedText>
        <ThemedText style={styles.emptyText}>
          Start connecting with other pet lovers to build your network!
        </ThemedText>
        <Button 
          mode="contained" 
          onPress={() => router.push('/userSearchScreen')}
          style={styles.findUsersButton}
          icon="account-search"
        >
          Find Users
        </Button>
      </View>
    );
  };

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      <View style={styles.statsContainer}>
        <ThemedText style={styles.statsNumber}>{connections.length}</ThemedText>
        <ThemedText style={styles.statsLabel}>
          Connection{connections.length !== 1 ? 's' : ''}
        </ThemedText>
      </View>
    </View>
  );

  if (loading) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0a7ea4" />
        <ThemedText style={styles.loadingText}>Loading your connections...</ThemedText>
      </ThemedView>
    );
  }

  if (error) {
    return (
      <ThemedView style={styles.errorContainer}>
        <Avatar.Icon size={80} icon="alert-circle" backgroundColor="#e0e0e0" />
        <ThemedText type="title" style={styles.errorTitle}>
          Error Loading Connections
        </ThemedText>
        <ThemedText style={styles.errorText}>{error}</ThemedText>
        <Button 
          mode="contained" 
          onPress={() => fetchConnections()}
          style={styles.retryButton}
          icon="refresh"
        >
          Try Again
        </Button>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      {/* Search Header */}
      <View style={styles.searchContainer}>
        <Searchbar
          placeholder="Search connections..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchBar}
        />
        <IconButton
          icon="refresh"
          size={24}
          onPress={handleRefresh}
          disabled={isRefreshing}
          style={styles.refreshButton}
        />
      </View>

      <Divider />

      {/* Connections List */}
      <FlatList
        data={filteredConnections}
        renderItem={renderConnectionCard}
        keyExtractor={item => item.connection_id}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={connections.length > 0 ? renderHeader : null}
        ListEmptyComponent={renderEmptyState}
        refreshing={isRefreshing}
        onRefresh={handleRefresh}
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
  retryButton: {
    marginTop: 8,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 16,
    marginBottom: 0,
  },
  searchBar: {
    flex: 1,
    elevation: 4,
  },
  refreshButton: {
    marginLeft: 8,
  },
  headerContainer: {
    padding: 16,
    alignItems: 'center',
  },
  statsContainer: {
    alignItems: 'center',
  },
  statsNumber: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#0a7ea4',
  },
  statsLabel: {
    fontSize: 16,
    opacity: 0.7,
    marginTop: 4,
  },
  listContent: {
    padding: 16,
    flexGrow: 1,
  },
  connectionCard: {
    marginBottom: 12,
    elevation: 2,
  },
  connectionCardDark: {
    backgroundColor: '#333',
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  userInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
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
  connectionDate: {
    fontSize: 12,
    opacity: 0.5,
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  messageButton: {
    marginRight: 4,
  },
  profileButton: {
    marginLeft: 4,
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
    marginBottom: 16,
  },
  clearButton: {
    marginTop: 8,
  },
  findUsersButton: {
    marginTop: 8,
    backgroundColor: '#0a7ea4',
  },
});