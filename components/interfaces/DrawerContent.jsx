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
        <List.Item
          title="Button 1"
          left={props => <List.Icon {...props} icon="folder" />}
          onPress={() => {
            // Navigate to page (will be implemented later)
            props.navigation.closeDrawer();
          }}
        />
        <List.Item
          title="Button 2"
          left={props => <List.Icon {...props} icon="folder" />}
          onPress={() => {
            props.navigation.closeDrawer();
          }}
        />
        <List.Item
          title="Button 3"
          left={props => <List.Icon {...props} icon="folder" />}
          onPress={() => {
            props.navigation.closeDrawer();
          }}
        />
        <List.Item
          title="Button 4"
          left={props => <List.Icon {...props} icon="folder" />}
          onPress={() => {
            props.navigation.closeDrawer();
          }}
        />
        <List.Item
          title="Button 5"
          left={props => <List.Icon {...props} icon="folder" />}
          onPress={() => {
            props.navigation.closeDrawer();
          }}
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
  logoutSection: {
    padding: 20,
  }
});