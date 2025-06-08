// Update components/interfaces/DrawerContent.jsx

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { DrawerContentScrollView } from '@react-navigation/drawer';
import { Avatar, Button, Divider, List, Text } from 'react-native-paper';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'expo-router';

export function DrawerContent(props) {
  const { user, signOut } = useAuth();
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut();
    router.replace('/logout');
    props.navigation.closeDrawer();
  };

  // Navigation helper function
  const navigateAndClose = (route) => {
    router.push(route);
    props.navigation.closeDrawer();
  };

  return (
    <DrawerContentScrollView {...props} contentContainerStyle={styles.container}>
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
        {/* Profile Section */}
        <List.Subheader style={styles.sectionHeader}>Account</List.Subheader>
        <List.Item
          title="My Profile"
          left={props => <List.Icon {...props} icon="account" />}
          onPress={() => navigateAndClose('/profile')}
        />
        
        <Divider style={styles.sectionDivider} />
        
        {/* Pet Management Section */}
        <List.Subheader style={styles.sectionHeader}>Pet Management</List.Subheader>
        <List.Item
          title="Add Pet"
          left={props => <List.Icon {...props} icon="plus" />}
          onPress={() => navigateAndClose('/addPetScreen')}
        />
        <List.Item
          title="My Pets"
          left={props => <List.Icon {...props} icon="paw" />}
          onPress={() => navigateAndClose('/petListScreen')}
        />
        
        <Divider style={styles.sectionDivider} />
        
        {/* Veterinary Services Section */}
        <List.Subheader style={styles.sectionHeader}>Veterinary Services</List.Subheader>
        <List.Item
          title="Find Veterinarians"
          left={props => <List.Icon {...props} icon="hospital-building" />}
          onPress={() => navigateAndClose('/vetSearchScreen')}
        />
        <List.Item
          title="Create Vet Profile"
          left={props => <List.Icon {...props} icon="medical-bag" />}
          onPress={() => navigateAndClose('/createVetProfileScreen')}
        />
        
        <Divider style={styles.sectionDivider} />
        
        {/* Social Section */}
        <List.Subheader style={styles.sectionHeader}>Community</List.Subheader>
        <List.Item
          title="Find Users"
          left={props => <List.Icon {...props} icon="account-search" />}
          onPress={() => navigateAndClose('/userSearchScreen')}
        />
      </List.Section>
      
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
  container: {
    flex: 1,
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
    flexGrow: 1,
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
  }
});