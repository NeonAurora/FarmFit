// app/(main)/(screens)/connectionsScreen.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { FlatList, StyleSheet, View, TouchableOpacity } from 'react-native';
import { 
  Text, 
  Avatar, 
  ActivityIndicator, 
  Searchbar,
  Divider,
  IconButton
} from 'react-native-paper';
import { useFocusEffect } from '@react-navigation/native';
import { ThemedView } from '@/components/themes/ThemedView';
import { ThemedText } from '@/components/themes/ThemedText';
import { ThemedCard } from '@/components/themes/ThemedCard';
import { ThemedButton } from '@/components/themes/ThemedButton';
import { useTheme } from '@/contexts/ThemeContext';
import { 
  useActivityIndicatorColors, 
  useInputColors,
  useAvatarColors
} from '@/hooks/useThemeColor';
import { useAuth } from '@/contexts/AuthContext';
import { getUserConnections } from '@/services/supabase/connectionService';
import { router } from 'expo-router';

export default function ConnectionsScreen() {
  const { colors, brandColors, isDark } = useTheme();
  const activityIndicatorColors = useActivityIndicatorColors();
  const inputColors = useInputColors();
  const avatarColors = useAvatarColors();
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
        <ThemedCard variant="elevated" elevation={1} style={styles.connectionCard}>
          <View style={styles.cardContent}>
            <View style={styles.userInfo}>
              {item.user?.picture ? (
                <Avatar.Image size={56} source={{ uri: item.user.picture }} />
              ) : (
                <Avatar.Text 
                  size={56} 
                  label={(item.user?.name?.charAt(0) || item.user?.email?.charAt(0) || 'U').toUpperCase()}
                  backgroundColor={avatarColors.background}
                  color={avatarColors.text}
                />
              )}
              
              <View style={styles.userDetails}>
                <ThemedText type="defaultSemiBold" style={[styles.userName, { color: colors.text }]}>
                  {item.user?.name || 'Anonymous User'}
                </ThemedText>
                <ThemedText style={[styles.userEmail, { color: colors.textSecondary }]}>
                  {item.user?.email}
                </ThemedText>
                <ThemedText variant="bodySmall" style={[styles.connectionDate, { color: colors.textMuted }]}>
                  Connected on {connectionDate}
                </ThemedText>
              </View>
            </View>
            
            <View style={styles.actionButtons}>
              <IconButton
                icon="message"
                size={20}
                onPress={() => handleSendMessage(item)}
                style={styles.messageButton}
                iconColor={brandColors.primary}
              />
              <IconButton
                icon="account"
                size={20}
                onPress={() => handleUserPress(item)}
                style={styles.profileButton}
                iconColor={brandColors.primary}
              />
            </View>
          </View>
        </ThemedCard>
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => {
    if (searchQuery && filteredConnections.length === 0 && connections.length > 0) {
      return (
        <View style={styles.emptyContainer}>
          <Avatar.Icon 
            size={80} 
            icon="account-search" 
            backgroundColor={colors.backgroundSecondary}
            color={colors.textSecondary}
          />
          <ThemedText type="subtitle" style={styles.emptyTitle}>
            No Connections Found
          </ThemedText>
          <ThemedText style={[styles.emptyText, { color: colors.textSecondary }]}>
            No connections match "{searchQuery}"
          </ThemedText>
          <ThemedButton 
            variant="outlined" 
            onPress={clearSearch} 
            style={styles.clearButton}
          >
            Clear Search
          </ThemedButton>
        </View>
      );
    }

    return (
      <View style={styles.emptyContainer}>
        <Avatar.Icon 
          size={80} 
          icon="account-group" 
          backgroundColor={colors.backgroundSecondary}
          color={colors.textSecondary}
        />
        <ThemedText type="subtitle" style={styles.emptyTitle}>
          No Connections Yet
        </ThemedText>
        <ThemedText style={[styles.emptyText, { color: colors.textSecondary }]}>
          Start connecting with other pet lovers to build your network!
        </ThemedText>
        <ThemedButton 
          variant="primary"
          onPress={() => router.push('/userSearchScreen')}
          style={styles.findUsersButton}
          icon="account-search"
        >
          Find Users
        </ThemedButton>
      </View>
    );
  };

  const renderHeader = () => (
    <View style={[styles.headerContainer, { backgroundColor: colors.backgroundSecondary }]}>
      <View style={styles.statsContainer}>
        <ThemedText style={[styles.statsNumber, { color: brandColors.primary }]}>
          {connections.length}
        </ThemedText>
        <ThemedText style={[styles.statsLabel, { color: colors.textSecondary }]}>
          Connection{connections.length !== 1 ? 's' : ''}
        </ThemedText>
      </View>
    </View>
  );

  if (loading) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={activityIndicatorColors.primary} />
        <ThemedText style={[styles.loadingText, { color: colors.textSecondary }]}>
          Loading your connections...
        </ThemedText>
      </ThemedView>
    );
  }

  if (error) {
    return (
      <ThemedView style={styles.errorContainer}>
        <Avatar.Icon 
          size={80} 
          icon="alert-circle" 
          backgroundColor={colors.backgroundSecondary}
          color={brandColors.error}
        />
        <ThemedText type="subtitle" style={[styles.errorTitle, { color: brandColors.error }]}>
          Error Loading Connections
        </ThemedText>
        <ThemedText style={[styles.errorText, { color: colors.textSecondary }]}>
          {error}
        </ThemedText>
        <ThemedButton 
          variant="primary"
          onPress={() => fetchConnections()}
          style={styles.retryButton}
          icon="refresh"
        >
          Try Again
        </ThemedButton>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      {/* Search Header */}
      <View style={[styles.searchContainer, { backgroundColor: colors.surface }]}>
        <Searchbar
          placeholder="Search connections..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={[
            styles.searchBar,
            { 
              backgroundColor: colors.background,
              elevation: 2,
            }
          ]}
          inputStyle={{ color: colors.text }}
          iconColor={colors.textSecondary}
          placeholderTextColor={colors.textSecondary}
        />
        <IconButton
          icon="refresh"
          size={20}
          onPress={handleRefresh}
          disabled={isRefreshing}
          style={styles.refreshButton}
          iconColor={isRefreshing ? colors.textMuted : brandColors.primary}
        />
      </View>

      <Divider style={{ backgroundColor: colors.border }} />

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
    padding: 32,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  errorTitle: {
    marginTop: 20,
    marginBottom: 8,
    textAlign: 'center',
  },
  errorText: {
    textAlign: 'center',
    opacity: 0.8,
    marginBottom: 20,
    lineHeight: 22,
  },
  retryButton: {
    marginTop: 8,
    minWidth: 120,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  searchBar: {
    flex: 1,
    elevation: 0,
    shadowOpacity: 0,
  },
  refreshButton: {
    marginLeft: 8,
  },
  headerContainer: {
    padding: 16,
    alignItems: 'center',
    marginBottom: 8,
    borderRadius: 8,
    marginHorizontal: 16,
  },
  statsContainer: {
    alignItems: 'center',
  },
  statsNumber: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  statsLabel: {
    fontSize: 16,
    marginTop: 4,
    fontWeight: '500',
    opacity: 0.8,
  },
  listContent: {
    padding: 16,
    flexGrow: 1,
  },
  connectionCard: {
    marginBottom: 8,
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
    marginBottom: 2,
  },
  userEmail: {
    fontSize: 14,
    marginBottom: 2,
    opacity: 0.8,
  },
  connectionDate: {
    fontSize: 12,
    opacity: 0.6,
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
    marginBottom: 20,
    lineHeight: 22,
  },
  clearButton: {
    marginTop: 8,
    minWidth: 120,
  },
  findUsersButton: {
    marginTop: 8,
    minWidth: 140,
  },
});