// components/interfaces/DrawerContent.jsx
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme } from 'react-native-paper';
import { useColorScheme } from '@/hooks/useColorScheme';
import { DrawerContentScrollView } from '@react-navigation/drawer'; // ✅ Use the drawer's scroll view
import { Avatar, Button, Divider, List, Text } from 'react-native-paper';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'expo-router';

export function DrawerContent(props) {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const theme = useTheme();
  const colorScheme = useColorScheme();

  const handleSignOut = async () => {
    await signOut();
    router.replace('/logout');
    props.navigation.closeDrawer();
  };

  const navigateAndClose = (route) => {
    router.push(route);
    props.navigation.closeDrawer();
  };

  return (
    <DrawerContentScrollView 
      {...props}
      contentContainerStyle={[
        styles.scrollContainer,
        { backgroundColor: theme.colors.background }
      ]}
      style={{ backgroundColor: theme.colors.background }}
      showsVerticalScrollIndicator={false}
      automaticallyAdjustContentInsets={true} // ✅ These props tell the drawer to handle safe areas properly
      contentInsetAdjustmentBehavior="automatic"
    >
      {/* Profile Section */}
      <View style={styles.profileSection}>
        {user ? (
          <>
            {user.picture ? (
              <Avatar.Image size={80} source={{ uri: user.picture }} />
            ) : (
              <Avatar.Text 
                size={80} 
                label={(user.name?.charAt(0) || user.email?.charAt(0) || 'U').toUpperCase()} 
                backgroundColor="#2E86DE"
              />
            )}
            <Text variant="titleMedium" style={styles.userName}>
              {user.name || user.email || 'User'}
            </Text>
          </>
        ) : (
          <Text variant="titleMedium" style={styles.userName}>
            Guest User
          </Text>
        )}
      </View>
      
      <Divider />
      
      {/* Navigation Items */}
      <List.Section style={styles.navSection}>
        {/* Account */}
        <List.Subheader style={styles.sectionHeader}>Account</List.Subheader>
        <List.Item
          title="My Profile"
          left={(props) => <List.Icon {...props} icon="account" />}
          onPress={() => navigateAndClose('/profile')}
        />

        {/* Pet Management */}
        <Divider style={styles.sectionDivider} />       
        <List.Subheader style={styles.sectionHeader}>Pet Management</List.Subheader>
        <List.Item
          title="Add Pet"
          left={(props) => <List.Icon {...props} icon="plus" />}
          onPress={() => navigateAndClose('/addPetScreen')}
        />
        <List.Item
          title="My Pets"
          left={(props) => <List.Icon {...props} icon="paw" />}
          onPress={() => navigateAndClose('/petListScreen')}
        />

        {/* Journals */}
        <Divider style={styles.sectionDivider} />
        <List.Subheader style={styles.sectionHeader}>Journals</List.Subheader>
        <List.Item
          title="My Journals"
          left={(props) => <List.Icon {...props} icon="book" />}
          onPress={() => navigateAndClose('/journalListScreen')}
        />
        <List.Item
          title="Create Journal"
          left={(props) => <List.Icon {...props} icon="book-plus" />}
          onPress={() => navigateAndClose('/addJournalScreen')}
        />
        <List.Item
          title="Journal Stats"
          left={(props) => <List.Icon {...props} icon="chart-bar" />}
          onPress={() => navigateAndClose('/journalStatsScreen')}
        />
        <List.Item
          title="Journal Search"
          left={(props) => <List.Icon {...props} icon="magnify" />}
          onPress={() => navigateAndClose('/journalSearchScreen')}
        />
        <List.Item
          title="Journal Settings"
          left={(props) => <List.Icon {...props} icon="cog" />}
          onPress={() => navigateAndClose('/journalSettingsScreen')}
        />
        
        {/* Social */}
        <List.Subheader style={styles.sectionHeader}>Social</List.Subheader>
        <List.Item
          title="My Connections"
          left={(props) => <List.Icon {...props} icon="account-group" />}
          onPress={() => navigateAndClose('/connectionsScreen')}
        />
        <List.Item
          title="Connection Requests"
          left={(props) => <List.Icon {...props} icon="account-clock" />}
          onPress={() => navigateAndClose('/connectionRequestsScreen')}
        />
        <List.Item
          title="Find Users"
          left={(props) => <List.Icon {...props} icon="account-search" />}
          onPress={() => navigateAndClose('/userSearchScreen')}
        />

        {/* Veterinary Services */}
        <Divider style={styles.sectionDivider} />
        <List.Subheader style={styles.sectionHeader}>Veterinary Services</List.Subheader>
        <List.Item
          title="Find Veterinarians"
          left={(props) => <List.Icon {...props} icon="hospital-building" />}
          onPress={() => navigateAndClose('/vetSearchScreen')}
        />
        <List.Item
          title="Create Vet Profile"
          left={(props) => <List.Icon {...props} icon="medical-bag" />}
          onPress={() => navigateAndClose('/createVetProfileScreen')}
        />
      </List.Section>

      {/* Community */}
      <Divider style={styles.sectionDivider} />
      <List.Subheader style={styles.sectionHeader}>Community</List.Subheader>
      <List.Item
        title="Pet Stories"
        left={(props) => <List.Icon {...props} icon="post" />}
        onPress={() => navigateAndClose('/postFeedScreen')}
      />
      <List.Item
        title="Share Story"
        left={(props) => <List.Icon {...props} icon="plus-circle" />}
        onPress={() => navigateAndClose('/createPostScreen')}
      />
      
      {user && (
        <View style={styles.logoutSection}>
          <Button 
            mode="contained" 
            buttonColor="#E74C3C"
            textColor="white"
            icon="logout" 
            onPress={handleSignOut}
          >
            Logout
          </Button>
        </View>
      )}
    </DrawerContentScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  profileSection: {
    padding: 20,
    alignItems: 'center',
  },
  userName: {
    marginTop: 10,
    fontWeight: '500',
  },
  navSection: {
    flex: 1,
    paddingBottom: 10,
  },
  sectionHeader: {
    fontSize: 14,
    fontWeight: '600',
    paddingLeft: 16,
    paddingTop: 8,
    paddingBottom: 4,
    color: '#2E86DE',
  },
  sectionDivider: {
    marginVertical: 8,
    marginHorizontal: 16,
  },
  logoutSection: {
    padding: 20,
    paddingTop: 10,
  }
});