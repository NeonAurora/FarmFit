// app/(main)/(screens)/userProfileScreen.jsx
import React, { useState, useEffect } from 'react';
import { ScrollView, StyleSheet, View, ActivityIndicator, Alert } from 'react-native';
import { 
  Card, 
  Text, 
  Avatar, 
  Button, 
  Divider,
  Chip,
  List
} from 'react-native-paper';
import { useLocalSearchParams, router } from 'expo-router';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useAuth } from '@/contexts/AuthContext';
import { getUserById, getPetsByUserId } from '@/services/supabase';
// Import connection services
import { 
  sendConnectionRequest, 
  getConnectionStatus,
  subscribeToConnections 
} from '@/services/supabase/connectionService';

export default function UserProfileScreen() {
  const { userId } = useLocalSearchParams();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { user: currentUser } = useAuth();
  
  const [user, setUser] = useState(null);
  const [userPets, setUserPets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [petsLoading, setPetsLoading] = useState(false);
  const [showPets, setShowPets] = useState(false);
  const [error, setError] = useState(null);
  
  // Connection-related state
  const [connectionStatus, setConnectionStatus] = useState('none');
  const [connectionLoading, setConnectionLoading] = useState(false);
  
  useEffect(() => {
    fetchUserProfile();
  }, [userId]);
  
  // Fetch connection status when user data is loaded
  useEffect(() => {
    if (user?.auth_id && currentUser?.sub && user.auth_id !== currentUser.sub) {
      fetchConnectionStatus();
      
      // Subscribe to connection changes
      const unsubscribe = subscribeToConnections(currentUser.sub, () => {
        fetchConnectionStatus();
      });
      
      return unsubscribe;
    }
  }, [user?.auth_id, currentUser?.sub]);
  
  const fetchUserProfile = async () => {
    if (!userId) {
      setError('No user ID provided');
      setLoading(false);
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const userData = await getUserById(userId);
      if (!userData) {
        setError('User not found');
        return;
      }
      setUser(userData);
    } catch (err) {
      console.error('Error fetching user profile:', err);
      setError('Failed to load user profile');
    } finally {
      setLoading(false);
    }
  };
  
  const fetchConnectionStatus = async () => {
    try {
      const status = await getConnectionStatus(currentUser.sub, user.auth_id);
      setConnectionStatus(status);
    } catch (error) {
      console.error('Error fetching connection status:', error);
    }
  };
  
  const fetchUserPets = async () => {
    if (!user?.auth_id) return;
    
    setPetsLoading(true);
    try {
      const pets = await getPetsByUserId(user.auth_id);
      setUserPets(pets);
    } catch (err) {
      console.error('Error fetching user pets:', err);
      setUserPets([]);
    } finally {
      setPetsLoading(false);
    }
  };
  
  const togglePetsView = () => {
    if (!showPets && userPets.length === 0) {
      fetchUserPets();
    }
    setShowPets(!showPets);
  };
  
  const handleSendMessage = () => {
    // Placeholder for messaging functionality
    console.log('Send message to user:', user.id);
    alert('Messaging feature coming soon!');
  };
  
  // Updated handleConnect function with actual connection logic
  const handleConnect = async () => {
    if (connectionStatus === 'accepted') {
      // Already connected - could show connection options or do nothing
      Alert.alert('Already Connected', 'You are already connected with this user.');
      return;
    }
    
    if (connectionStatus === 'pending') {
      // Could offer to cancel request
      Alert.alert(
        'Request Pending', 
        'Your connection request is still pending. Would you like to cancel it?',
        [
          { text: 'Keep Request', style: 'cancel' },
          { 
            text: 'Cancel Request', 
            style: 'destructive',
            onPress: () => {
              // TODO: Implement cancel request functionality
              alert('Cancel request feature coming soon!');
            }
          }
        ]
      );
      return;
    }
    
    if (connectionStatus === 'blocked') {
      Alert.alert('Cannot Connect', 'Unable to send connection request to this user.');
      return;
    }
    
    // Send connection request
    setConnectionLoading(true);
    try {
      console.log('Sending connection request to user:', user.auth_id);
      const result = await sendConnectionRequest(user.auth_id, currentUser.sub);
      
      if (result.success) {
        setConnectionStatus('pending');
        Alert.alert('Success', 'Connection request sent successfully!');
      } else {
        Alert.alert('Error', result.error || 'Failed to send connection request');
      }
    } catch (error) {
      console.error('Error sending connection request:', error);
      Alert.alert('Error', 'Failed to send connection request. Please try again.');
    } finally {
      setConnectionLoading(false);
    }
  };
  
  // Function to get button properties based on connection status
  const getConnectButtonProps = () => {
    switch (connectionStatus) {
      case 'none':
        return {
          children: 'Connect',
          icon: 'account-plus',
          mode: 'contained',
          style: styles.connectButton,
          disabled: connectionLoading,
          loading: connectionLoading
        };
      
      case 'pending':
        return {
          children: 'Pending',
          icon: 'clock-outline',
          mode: 'outlined',
          style: [styles.connectButton, { borderColor: '#FF9800' }],
          disabled: connectionLoading,
          loading: connectionLoading
        };
      
      case 'accepted':
        return {
          children: 'Connected',
          icon: 'check',
          mode: 'contained',
          style: [styles.connectButton, { backgroundColor: '#4CAF50' }],
          disabled: false // Allow tap to show connection options
        };
      
      case 'blocked':
        return {
          children: 'Blocked',
          icon: 'block-helper',
          mode: 'outlined',
          style: [styles.connectButton, { borderColor: '#f44336', opacity: 0.6 }],
          disabled: true
        };
      
      case 'declined':
        return {
          children: 'Request Declined',
          icon: 'close',
          mode: 'outlined',
          style: [styles.connectButton, { borderColor: '#f44336', opacity: 0.6 }],
          disabled: true
        };
      
      default:
        return {
          children: 'Connect',
          icon: 'account-plus',
          mode: 'contained',
          style: styles.connectButton,
          disabled: connectionLoading
        };
    }
  };
  
  if (loading) {
    return (
      <ThemedView style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#0a7ea4" />
        <ThemedText style={styles.loadingText}>Loading profile...</ThemedText>
      </ThemedView>
    );
  }
  
  if (error || !user) {
    return (
      <ThemedView style={styles.centerContainer}>
        <Avatar.Icon size={80} icon="account-off" backgroundColor="#e0e0e0" />
        <ThemedText type="title" style={styles.errorTitle}>
          {error || 'User Not Found'}
        </ThemedText>
        <ThemedText style={styles.errorText}>
          This user profile is not available.
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
  
  const joinDate = new Date(user.created_at).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  
  const isOwnProfile = currentUser?.sub === user.auth_id;
  
  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Profile Header */}
        <Card style={styles.headerCard}>
          <Card.Content style={styles.headerContent}>
            <View style={styles.profileHeader}>
              {user.picture ? (
                <Avatar.Image size={100} source={{ uri: user.picture }} />
              ) : (
                <Avatar.Text 
                  size={100} 
                  label={(user.name?.charAt(0) || user.email?.charAt(0) || 'U').toUpperCase()}
                  backgroundColor={isDark ? '#444' : '#2E86DE'}
                  color="#fff"
                />
              )}
              
              <View style={styles.profileInfo}>
                <ThemedText type="title" style={styles.userName}>
                  {user.name || 'Anonymous User'}
                </ThemedText>
                <ThemedText style={styles.userEmail}>
                  {user.email}
                </ThemedText>
                <ThemedText style={styles.joinDate}>
                  Member since {joinDate}
                </ThemedText>
                
                {isOwnProfile && (
                  <Chip icon="account" style={styles.ownProfileChip}>
                    This is you
                  </Chip>
                )}
              </View>
            </View>
            
            {/* Action Buttons */}
            {!isOwnProfile && (
              <View style={styles.actionButtons}>
                <Button 
                  {...getConnectButtonProps()}
                  onPress={handleConnect}
                />
                
                <Button 
                  mode="outlined" 
                  onPress={handleSendMessage}
                  style={styles.messageButton}
                  icon="message"
                >
                  Message
                </Button>
              </View>
            )}
          </Card.Content>
        </Card>
        
        {/* Profile Stats */}
        <Card style={styles.statsCard}>
          <Card.Title title="Profile Stats" />
          <Card.Content>
            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <ThemedText style={styles.statNumber}>
                  {userPets.length}
                </ThemedText>
                <ThemedText style={styles.statLabel}>Pets</ThemedText>
              </View>
              
              <Divider style={styles.statDivider} />
              
              <View style={styles.statItem}>
                <ThemedText style={styles.statNumber}>0</ThemedText>
                <ThemedText style={styles.statLabel}>Connections</ThemedText>
              </View>
              
              <Divider style={styles.statDivider} />
              
              <View style={styles.statItem}>
                <ThemedText style={styles.statNumber}>0</ThemedText>
                <ThemedText style={styles.statLabel}>Posts</ThemedText>
              </View>
            </View>
          </Card.Content>
        </Card>
        
        {/* User's Pets Section */}
        <List.Accordion
          title={`${user.name?.split(' ')[0] || 'User'}'s Pets`}
          expanded={showPets}
          onPress={togglePetsView}
          style={styles.petsAccordion}
          titleStyle={styles.accordionTitle}
          left={props => <List.Icon {...props} icon="paw" />}
        >
          {petsLoading ? (
            <View style={styles.petsLoadingContainer}>
              <ActivityIndicator size="small" color="#0a7ea4" />
              <ThemedText style={styles.petsLoadingText}>Loading pets...</ThemedText>
            </View>
          ) : userPets.length > 0 ? (
            userPets.map((pet) => (
              <Card key={pet.id} style={styles.petCard}>
                <Card.Content style={styles.petCardContent}>
                  <View style={styles.petInfo}>
                    {pet.image_url ? (
                      <Avatar.Image size={50} source={{ uri: pet.image_url }} />
                    ) : (
                      <Avatar.Icon 
                        size={50} 
                        icon="paw"
                        backgroundColor={isDark ? '#555' : '#e0e0e0'}
                        color={isDark ? '#fff' : '#666'}
                      />
                    )}
                    
                    <View style={styles.petDetails}>
                      <ThemedText style={styles.petName}>{pet.name}</ThemedText>
                      <ThemedText style={styles.petSpecies}>{pet.species}</ThemedText>
                      {pet.age && (
                        <ThemedText style={styles.petAge}>Age: {pet.age}</ThemedText>
                      )}
                    </View>
                  </View>
                </Card.Content>
              </Card>
            ))
          ) : (
            <View style={styles.noPetsContainer}>
              <ThemedText style={styles.noPetsText}>
                {isOwnProfile ? 'You haven\'t added any pets yet.' : `${user.name?.split(' ')[0] || 'This user'} hasn't shared any pets.`}
              </ThemedText>
            </View>
          )}
        </List.Accordion>
        
        {/* About Section (Future expansion) */}
        <Card style={styles.aboutCard}>
          <Card.Title title="About" />
          <Card.Content>
            <ThemedText style={styles.aboutText}>
              {isOwnProfile 
                ? 'This is your profile as seen by other users.'
                : `${user.name?.split(' ')[0] || 'This user'} joined FarmFit to connect with fellow pet lovers and manage their pets.`
              }
            </ThemedText>
          </Card.Content>
        </Card>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
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
    margin: 16,
    marginBottom: 8,
  },
  headerContent: {
    padding: 20,
  },
  profileHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  profileInfo: {
    alignItems: 'center',
    marginTop: 16,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
    textAlign: 'center',
  },
  userEmail: {
    fontSize: 16,
    opacity: 0.7,
    marginBottom: 4,
    textAlign: 'center',
  },
  joinDate: {
    fontSize: 14,
    opacity: 0.5,
    marginBottom: 12,
    textAlign: 'center',
  },
  ownProfileChip: {
    backgroundColor: '#e3f2fd',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  connectButton: {
    flex: 1,
    backgroundColor: '#2E86DE',
  },
  messageButton: {
    flex: 1,
    borderColor: '#2E86DE',
  },
  statsCard: {
    margin: 16,
    marginTop: 0,
    marginBottom: 8,
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2E86DE',
  },
  statLabel: {
    fontSize: 14,
    opacity: 0.7,
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    height: 40,
  },
  petsAccordion: {
    margin: 16,
    marginTop: 0,
    marginBottom: 8,
    borderRadius: 8,
    overflow: 'hidden',
  },
  accordionTitle: {
    fontWeight: '500',
    fontSize: 16,
  },
  petsLoadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  petsLoadingText: {
    marginLeft: 10,
  },
  petCard: {
    marginHorizontal: 16,
    marginBottom: 8,
    backgroundColor: '#f8f9fa',
  },
  petCardContent: {
    padding: 12,
  },
  petInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  petDetails: {
    marginLeft: 12,
    flex: 1,
  },
  petName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  petSpecies: {
    fontSize: 14,
    opacity: 0.7,
    marginBottom: 2,
  },
  petAge: {
    fontSize: 12,
    opacity: 0.5,
  },
  noPetsContainer: {
    padding: 20,
    alignItems: 'center',
  },
  noPetsText: {
    opacity: 0.6,
    textAlign: 'center',
  },
  aboutCard: {
    margin: 16,
    marginTop: 0,
  },
  aboutText: {
    lineHeight: 20,
    opacity: 0.8,
  },
});