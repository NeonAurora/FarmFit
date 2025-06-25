// app/(main)/(screens)/userProfileScreen.jsx
import React, { useState, useEffect } from 'react';
import { ScrollView, StyleSheet, View, ActivityIndicator, Alert } from 'react-native';
import { 
  Text, 
  Avatar, 
  Divider,
  Chip,
  List
} from 'react-native-paper';
import { useLocalSearchParams, router } from 'expo-router';
import { ThemedView } from '@/components/themes/ThemedView';
import { ThemedText } from '@/components/themes/ThemedText';
import { ThemedCard } from '@/components/themes/ThemedCard';
import { ThemedButton } from '@/components/themes/ThemedButton';
import { useTheme } from '@/contexts/ThemeContext';
import { 
  useActivityIndicatorColors, 
  useChipColors,
  useAvatarColors,
  useCardColors 
} from '@/hooks/useThemeColor';
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
  const { colors, brandColors, isDark } = useTheme();
  const activityIndicatorColors = useActivityIndicatorColors();
  const chipColors = useChipColors();
  const avatarColors = useAvatarColors();
  const cardColors = useCardColors();
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
    console.log('Send message to user:', user.id);
    Alert.alert('Coming Soon', 'Messaging feature will be available soon!');
  };
  
  const handleConnect = async () => {
    if (connectionStatus === 'accepted') {
      Alert.alert('Already Connected', 'You are already connected with this user.');
      return;
    }
    
    if (connectionStatus === 'pending') {
      Alert.alert(
        'Request Pending', 
        'Your connection request is still pending. Would you like to cancel it?',
        [
          { text: 'Keep Request', style: 'cancel' },
          { 
            text: 'Cancel Request', 
            style: 'destructive',
            onPress: () => {
              Alert.alert('Coming Soon', 'Cancel request feature will be available soon!');
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
          variant: 'primary',
          disabled: connectionLoading,
          loading: connectionLoading
        };
      
      case 'pending':
        return {
          children: 'Pending',
          icon: 'clock-outline',
          variant: 'outlined',
          style: { borderColor: brandColors.warning },
          labelStyle: { color: brandColors.warning },
          disabled: connectionLoading,
          loading: connectionLoading
        };
      
      case 'accepted':
        return {
          children: 'Connected',
          icon: 'check',
          style: { backgroundColor: brandColors.success },
          labelStyle: { color: colors.textInverse },
          disabled: false
        };
      
      case 'blocked':
        return {
          children: 'Blocked',
          icon: 'block-helper',
          variant: 'outlined',
          style: { borderColor: brandColors.error, opacity: 0.6 },
          labelStyle: { color: brandColors.error },
          disabled: true
        };
      
      case 'declined':
        return {
          children: 'Request Declined',
          icon: 'close',
          variant: 'outlined',
          style: { borderColor: brandColors.error, opacity: 0.6 },
          labelStyle: { color: brandColors.error },
          disabled: true
        };
      
      default:
        return {
          children: 'Connect',
          icon: 'account-plus',
          variant: 'primary',
          disabled: connectionLoading
        };
    }
  };
  
  if (loading) {
    return (
      <ThemedView style={styles.centerContainer}>
        <ActivityIndicator size="large" color={activityIndicatorColors.primary} />
        <ThemedText style={[styles.loadingText, { color: colors.textSecondary }]}>
          Loading profile...
        </ThemedText>
      </ThemedView>
    );
  }
  
  if (error || !user) {
    return (
      <ThemedView style={styles.centerContainer}>
        <Avatar.Icon 
          size={80} 
          icon="account-off" 
          backgroundColor={colors.backgroundSecondary}
          color={colors.textSecondary}
        />
        <ThemedText type="subtitle" style={styles.errorTitle}>
          {error || 'User Not Found'}
        </ThemedText>
        <ThemedText style={[styles.errorText, { color: colors.textSecondary }]}>
          This user profile is not available.
        </ThemedText>
        <ThemedButton 
          variant="primary"
          onPress={() => router.back()} 
          style={styles.backButton}
        >
          Go Back
        </ThemedButton>
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
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Profile Header */}
        <ThemedCard variant="elevated" elevation={2} style={styles.headerCard}>
          <View style={styles.headerContent}>
            <View style={styles.profileHeader}>
              {user.picture ? (
                <Avatar.Image size={90} source={{ uri: user.picture }} />
              ) : (
                <Avatar.Text 
                  size={90} 
                  label={(user.name?.charAt(0) || user.email?.charAt(0) || 'U').toUpperCase()}
                  backgroundColor={brandColors.primary}
                  color={colors.textInverse}
                />
              )}
              
              <View style={styles.profileInfo}>
                <ThemedText type="subtitle" style={[styles.userName, { color: colors.text }]}>
                  {user.name || 'Anonymous User'}
                </ThemedText>
                <ThemedText style={[styles.userEmail, { color: colors.textSecondary }]}>
                  {user.email}
                </ThemedText>
                <ThemedText variant="bodySmall" style={[styles.joinDate, { color: colors.textMuted }]}>
                  Member since {joinDate}
                </ThemedText>
                
                {isOwnProfile && (
                  <Chip 
                    icon="account" 
                    style={[
                      styles.ownProfileChip,
                      { backgroundColor: `${brandColors.info}20` }
                    ]}
                    textStyle={{ color: brandColors.info }}
                  >
                    This is you
                  </Chip>
                )}
              </View>
            </View>
            
            {/* Action Buttons */}
            {!isOwnProfile && (
              <View style={styles.actionButtons}>
                <ThemedButton 
                  {...getConnectButtonProps()}
                  onPress={handleConnect}
                  style={[styles.connectButton, getConnectButtonProps().style]}
                  labelStyle={getConnectButtonProps().labelStyle}
                />
                
                <ThemedButton 
                  variant="outlined"
                  onPress={handleSendMessage}
                  style={styles.messageButton}
                  icon="message"
                >
                  Message
                </ThemedButton>
              </View>
            )}
          </View>
        </ThemedCard>
        
        {/* Profile Stats */}
        <ThemedCard variant="elevated" elevation={1} style={styles.statsCard}>
          <View style={styles.cardTitleContainer}>
            <ThemedText type="defaultSemiBold" style={styles.cardTitle}>
              Profile Stats
            </ThemedText>
          </View>
          <View style={styles.cardContent}>
            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <ThemedText style={[styles.statNumber, { color: brandColors.primary }]}>
                  {userPets.length}
                </ThemedText>
                <ThemedText style={[styles.statLabel, { color: colors.textSecondary }]}>
                  Pets
                </ThemedText>
              </View>
              
              <Divider style={[styles.statDivider, { backgroundColor: colors.border }]} />
              
              <View style={styles.statItem}>
                <ThemedText style={[styles.statNumber, { color: brandColors.primary }]}>
                  0
                </ThemedText>
                <ThemedText style={[styles.statLabel, { color: colors.textSecondary }]}>
                  Connections
                </ThemedText>
              </View>
              
              <Divider style={[styles.statDivider, { backgroundColor: colors.border }]} />
              
              <View style={styles.statItem}>
                <ThemedText style={[styles.statNumber, { color: brandColors.primary }]}>
                  0
                </ThemedText>
                <ThemedText style={[styles.statLabel, { color: colors.textSecondary }]}>
                  Posts
                </ThemedText>
              </View>
            </View>
          </View>
        </ThemedCard>
        
        {/* User's Pets Section */}
        <ThemedCard variant="elevated" elevation={1} style={styles.petsCard}>
          <List.Accordion
            title={`${user.name?.split(' ')[0] || 'User'}'s Pets`}
            expanded={showPets}
            onPress={togglePetsView}
            left={props => <List.Icon {...props} icon="paw" color={colors.textSecondary} />}
            titleStyle={[styles.accordionTitle, { color: colors.text }]}
          >
            {petsLoading ? (
              <View style={styles.petsLoadingContainer}>
                <ActivityIndicator size="small" color={activityIndicatorColors.primary} />
                <ThemedText style={[styles.petsLoadingText, { color: colors.textSecondary }]}>
                  Loading pets...
                </ThemedText>
              </View>
            ) : userPets.length > 0 ? (
              userPets.map((pet) => (
                <ThemedCard key={pet.id} variant="flat" style={[styles.petCard, { backgroundColor: colors.backgroundSecondary }]}>
                  <View style={styles.petCardContent}>
                    <View style={styles.petInfo}>
                      {pet.image_url ? (
                        <Avatar.Image size={48} source={{ uri: pet.image_url }} />
                      ) : (
                        <Avatar.Icon 
                          size={48} 
                          icon="paw"
                          backgroundColor={avatarColors.background}
                          color={avatarColors.text}
                        />
                      )}
                      
                      <View style={styles.petDetails}>
                        <ThemedText type="defaultSemiBold" style={[styles.petName, { color: colors.text }]}>
                          {pet.name}
                        </ThemedText>
                        <ThemedText style={[styles.petSpecies, { color: colors.textSecondary }]}>
                          {pet.species}
                        </ThemedText>
                        {pet.age && (
                          <ThemedText variant="bodySmall" style={[styles.petAge, { color: colors.textMuted }]}>
                            Age: {pet.age}
                          </ThemedText>
                        )}
                      </View>
                    </View>
                  </View>
                </ThemedCard>
              ))
            ) : (
              <View style={styles.noPetsContainer}>
                <ThemedText style={[styles.noPetsText, { color: colors.textSecondary }]}>
                  {isOwnProfile ? 'You haven\'t added any pets yet.' : `${user.name?.split(' ')[0] || 'This user'} hasn't shared any pets.`}
                </ThemedText>
              </View>
            )}
          </List.Accordion>
        </ThemedCard>
        
        {/* About Section */}
        <ThemedCard variant="elevated" elevation={1} style={styles.aboutCard}>
          <View style={styles.cardTitleContainer}>
            <ThemedText type="defaultSemiBold" style={styles.cardTitle}>
              About
            </ThemedText>
          </View>
          <View style={styles.cardContent}>
            <ThemedText style={[styles.aboutText, { color: colors.textSecondary }]}>
              {isOwnProfile 
                ? 'This is your profile as seen by other users.'
                : `${user.name?.split(' ')[0] || 'This user'} joined FarmFit to connect with fellow pet lovers and manage their pets.`
              }
            </ThemedText>
          </View>
        </ThemedCard>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 32,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
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
  backButton: {
    marginTop: 8,
    minWidth: 120,
  },
  headerCard: {
    margin: 16,
    marginBottom: 12,
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
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 4,
    textAlign: 'center',
  },
  userEmail: {
    fontSize: 16,
    marginBottom: 4,
    textAlign: 'center',
    opacity: 0.8,
  },
  joinDate: {
    fontSize: 14,
    marginBottom: 12,
    textAlign: 'center',
    opacity: 0.6,
  },
  ownProfileChip: {
    alignSelf: 'center',
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  connectButton: {
    flex: 1,
    paddingVertical: 8,
  },
  messageButton: {
    flex: 1,
    paddingVertical: 8,
  },
  statsCard: {
    margin: 16,
    marginVertical: 6,
  },
  cardTitleContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  cardContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
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
  },
  statLabel: {
    fontSize: 14,
    marginTop: 4,
    opacity: 0.8,
  },
  statDivider: {
    width: 1,
    height: 40,
  },
  petsCard: {
    margin: 16,
    marginVertical: 6,
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
    marginLeft: 12,
  },
  petCard: {
    marginHorizontal: 16,
    marginBottom: 8,
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
    marginBottom: 2,
  },
  petSpecies: {
    fontSize: 14,
    marginBottom: 2,
    opacity: 0.8,
  },
  petAge: {
    fontSize: 12,
    opacity: 0.6,
  },
  noPetsContainer: {
    padding: 20,
    alignItems: 'center',
  },
  noPetsText: {
    opacity: 0.7,
    textAlign: 'center',
    lineHeight: 20,
  },
  aboutCard: {
    margin: 16,
    marginVertical: 6,
  },
  aboutText: {
    lineHeight: 22,
    opacity: 0.8,
  },
});