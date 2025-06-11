// app/(main)/(screens)/userSearchScreen.jsx
import React, { useState, useCallback } from 'react';
import { FlatList, StyleSheet, View, TouchableOpacity } from 'react-native';
import { 
  Card, 
  Text, 
  Avatar, 
  ActivityIndicator, 
  Searchbar,
  Button,
  Divider
} from 'react-native-paper';
import { useFocusEffect } from '@react-navigation/native';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useAuth } from '@/contexts/AuthContext';
import { searchUsers } from '@/services/supabase';
import { router } from 'expo-router';

export default function UserSearchScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
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
        <Card style={[styles.userCard, isDark && styles.userCardDark]}>
          <Card.Content style={styles.cardContent}>
            {/* Left side - Avatar */}
            <View style={styles.avatarContainer}>
              {item.picture ? (
                <Avatar.Image size={60} source={{ uri: item.picture }} />
              ) : (
                <Avatar.Text 
                  size={60} 
                  label={(item.name?.charAt(0) || item.email?.charAt(0) || 'U').toUpperCase()}
                  backgroundColor={isDark ? '#444' : '#e0e0e0'}
                  color={isDark ? '#fff' : '#666'}
                />
              )}
            </View>
            
            {/* Right side - User Info */}
            <View style={styles.userInfo}>
              <ThemedText style={styles.userName}>
                {item.name || 'Anonymous User'}
              </ThemedText>
              <ThemedText style={styles.userEmail}>
                {item.email}
              </ThemedText>
              <ThemedText style={styles.joinDate}>
                Joined {joinDate}
              </ThemedText>
            </View>
            
            {/* Action button */}
            <View style={styles.actionContainer}>
              <Button 
                mode="outlined" 
                compact
                onPress={() => handleUserPress(item)}
                style={styles.connectButton}
              >
                View
              </Button>
            </View>
          </Card.Content>
        </Card>
      </TouchableOpacity>
    );
  };
  
  const renderEmptyState = () => {
    if (loading) {
      return (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#0a7ea4" />
          <ThemedText style={styles.loadingText}>Searching users...</ThemedText>
        </View>
      );
    }
    
    if (!hasSearched) {
      return (
        <View style={styles.centerContainer}>
          <Avatar.Icon size={80} icon="account-search" backgroundColor="#e0e0e0" />
          <ThemedText type="title" style={styles.emptyTitle}>
            Search for Users
          </ThemedText>
          <ThemedText style={styles.emptyText}>
            Enter a name or email to find other FarmFit users
          </ThemedText>
        </View>
      );
    }
    
    if (users.length === 0 && hasSearched) {
      return (
        <View style={styles.centerContainer}>
          <Avatar.Icon size={80} icon="account-off" backgroundColor="#e0e0e0" />
          <ThemedText type="title" style={styles.emptyTitle}>
            No Users Found
          </ThemedText>
          <ThemedText style={styles.emptyText}>
            No users match your search "{searchQuery}"
          </ThemedText>
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
      <View style={styles.searchContainer}>
        <Searchbar
          placeholder="Search by name or email..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchBar}
          autoCapitalize="none"
          autoCorrect={false}
        />
        {searchQuery.length > 0 && (
          <Button mode="text" onPress={clearSearch} style={styles.clearButton}>
            Clear
          </Button>
        )}
      </View>
      
      <Divider />
      
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
        <View style={styles.resultsFooter}>
          <ThemedText style={styles.resultsCount}>
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
    margin: 16,
    marginBottom: 0,
  },
  searchBar: {
    flex: 1,
    elevation: 4,
  },
  clearButton: {
    marginLeft: 8,
  },
  listContent: {
    padding: 16,
    flexGrow: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
  },
  emptyTitle: {
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    textAlign: 'center',
    opacity: 0.7,
  },
  userCard: {
    marginBottom: 12,
    elevation: 2,
  },
  userCardDark: {
    backgroundColor: '#333',
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
    fontWeight: '600',
    marginBottom: 2,
  },
  userEmail: {
    fontSize: 14,
    opacity: 0.7,
    marginBottom: 2,
  },
  joinDate: {
    fontSize: 12,
    opacity: 0.5,
  },
  actionContainer: {
    marginLeft: 8,
  },
  connectButton: {
    borderColor: '#0a7ea4',
  },
  resultsFooter: {
    padding: 16,
    paddingTop: 8,
    alignItems: 'center',
  },
  resultsCount: {
    fontSize: 12,
    opacity: 0.6,
  },
});