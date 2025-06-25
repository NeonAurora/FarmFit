// app/(main)/(screens)/userSearchScreen.jsx
import React, { useState, useCallback } from 'react';
import { FlatList, StyleSheet, View, TouchableOpacity } from 'react-native';
import { 
  Text, 
  Avatar, 
  ActivityIndicator, 
  Searchbar,
  Divider
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
  useAvatarColors,
  useCardColors 
} from '@/hooks/useThemeColor';
import { useAuth } from '@/contexts/AuthContext';
import { searchUsers } from '@/services/supabase';
import { router } from 'expo-router';

export default function UserSearchScreen() {
  const { colors, brandColors, isDark } = useTheme();
  const activityIndicatorColors = useActivityIndicatorColors();
  const inputColors = useInputColors();
  const avatarColors = useAvatarColors();
  const cardColors = useCardColors();
  const { user } = useAuth();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  
  // Debounced search function
  const performSearch = useCallback(async (query) => {
    if (!user?.sub) return;
    
    if (!query || query.trim().length < 2) {
      setUsers([]);
      setHasSearched(false);
      return;
    }
    
    setLoading(true);
    try {
      const results = await searchUsers(query, user.sub);
      setUsers(results);
      setHasSearched(true);
    } catch (error) {
      console.error('Error searching users:', error);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, [user?.sub]);
  
  // Debounce search input
  React.useEffect(() => {
    const timeoutId = setTimeout(() => {
      performSearch(searchQuery);
    }, 500); // 500ms delay
    
    return () => clearTimeout(timeoutId);
  }, [searchQuery, performSearch]);
  
  const handleUserPress = (selectedUser) => {
    router.push({
        pathname: '/userProfileScreen',
        params: { userId: selectedUser.id }
    });
  };
  
  const renderUserCard = ({ item }) => {
    const joinDate = new Date(item.created_at).toLocaleDateString();
    
    return (
      <TouchableOpacity onPress={() => handleUserPress(item)}>
        <ThemedCard variant="elevated" elevation={1} style={styles.userCard}>
          <View style={styles.cardContent}>
            {/* Left side - Avatar */}
            <View style={styles.avatarContainer}>
              {item.picture ? (
                <Avatar.Image size={56} source={{ uri: item.picture }} />
              ) : (
                <Avatar.Text 
                  size={56} 
                  label={(item.name?.charAt(0) || item.email?.charAt(0) || 'U').toUpperCase()}
                  backgroundColor={avatarColors.background}
                  color={avatarColors.text}
                />
              )}
            </View>
            
            {/* Right side - User Info */}
            <View style={styles.userInfo}>
              <ThemedText 
                type="defaultSemiBold" 
                style={[styles.userName, { color: colors.text }]}
              >
                {item.name || 'Anonymous User'}
              </ThemedText>
              <ThemedText 
                variant="bodyMedium" 
                style={[styles.userEmail, { color: colors.textSecondary }]}
              >
                {item.email}
              </ThemedText>
              <ThemedText 
                variant="bodySmall" 
                style={[styles.joinDate, { color: colors.textMuted }]}
              >
                Joined {joinDate}
              </ThemedText>
            </View>
            
            {/* Action button */}
            <View style={styles.actionContainer}>
              <ThemedButton 
                variant="outlined" 
                onPress={() => handleUserPress(item)}
                style={styles.connectButton}
                compact
              >
                View Profile
              </ThemedButton>
            </View>
          </View>
        </ThemedCard>
      </TouchableOpacity>
    );
  };
  
  const renderEmptyState = () => {
    if (loading) {
      return (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={activityIndicatorColors.primary} />
          <ThemedText style={[styles.loadingText, { color: colors.textSecondary }]}>
            Searching users...
          </ThemedText>
        </View>
      );
    }
    
    if (!hasSearched) {
      return (
        <View style={styles.centerContainer}>
          <Avatar.Icon 
            size={80} 
            icon="account-search" 
            backgroundColor={colors.backgroundSecondary}
            color={colors.textSecondary}
          />
          <ThemedText type="subtitle" style={styles.emptyTitle}>
            Search for Users
          </ThemedText>
          <ThemedText style={[styles.emptyText, { color: colors.textSecondary }]}>
            Enter a name or email to find other FarmFit users
          </ThemedText>
        </View>
      );
    }
    
    if (users.length === 0 && hasSearched) {
      return (
        <View style={styles.centerContainer}>
          <Avatar.Icon 
            size={80} 
            icon="account-off" 
            backgroundColor={colors.backgroundSecondary}
            color={colors.textSecondary}
          />
          <ThemedText type="subtitle" style={styles.emptyTitle}>
            No Users Found
          </ThemedText>
          <ThemedText style={[styles.emptyText, { color: colors.textSecondary }]}>
            No users match your search "{searchQuery}"
          </ThemedText>
          <ThemedButton
            variant="outlined"
            onPress={() => setSearchQuery('')}
            style={styles.tryAgainButton}
          >
            Clear Search
          </ThemedButton>
        </View>
      );
    }
    
    return null;
  };
  
  const clearSearch = () => {
    setSearchQuery('');
    setUsers([]);
    setHasSearched(false);
  };
  
  return (
    <ThemedView style={styles.container}>
      {/* Search Header */}
      <View style={[styles.searchContainer, { backgroundColor: colors.surface }]}>
        <Searchbar
          placeholder="Search by name or email..."
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
          autoCapitalize="none"
          autoCorrect={false}
        />
        {searchQuery.length > 0 && (
          <ThemedButton 
            variant="outlined" 
            onPress={clearSearch} 
            style={styles.clearButton}
            compact
          >
            Clear
          </ThemedButton>
        )}
      </View>
      
      <Divider style={{ backgroundColor: colors.border }} />
      
      {/* Results */}
      <FlatList
        data={users}
        renderItem={renderUserCard}
        keyExtractor={item => item.id.toString()}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={renderEmptyState}
        showsVerticalScrollIndicator={false}
      />
      
      {/* Results count */}
      {hasSearched && users.length > 0 && (
        <View style={[styles.resultsFooter, { backgroundColor: colors.backgroundSecondary }]}>
          <ThemedText style={[styles.resultsCount, { color: colors.textMuted }]}>
            Found {users.length} user{users.length !== 1 ? 's' : ''}
          </ThemedText>
        </View>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  clearButton: {
    marginLeft: 12,
    minWidth: 80,
  },
  listContent: {
    padding: 16,
    flexGrow: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    minHeight: 300,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
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
    marginBottom: 20,
  },
  tryAgainButton: {
    marginTop: 8,
    minWidth: 120,
  },
  userCard: {
    marginBottom: 8,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  avatarContainer: {
    marginRight: 16,
  },
  userInfo: {
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
  joinDate: {
    fontSize: 12,
    opacity: 0.6,
  },
  actionContainer: {
    marginLeft: 12,
  },
  connectButton: {
    minWidth: 100,
  },
  resultsFooter: {
    padding: 12,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  resultsCount: {
    fontSize: 12,
    fontWeight: '500',
  },
});