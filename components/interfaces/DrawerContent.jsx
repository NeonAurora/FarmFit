// components/interfaces/DrawerContent.jsx
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Badge } from 'react-native-paper';
import { useColorScheme } from '@/hooks/useColorScheme';
import { DrawerContentScrollView } from '@react-navigation/drawer';
import { Avatar, Button, Divider, List, Text } from 'react-native-paper';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'expo-router';

// Import role-based components
import { RoleBasedComponent, CurrentRoleComponent } from '@/components/roles/RoleBasedComponent';
import RoleSwitcher from '@/components/roles/RoleSwitcher';

export function DrawerContent(props) {
  const { user, signOut, currentRole, hasRole, userRoles } = useAuth();
  const router = useRouter();
  const { colorScheme, isDark } = useColorScheme();

  // Create dynamic styles based on theme
  const styles = createStyles(isDark);

  const handleSignOut = async () => {
    await signOut();
    router.replace('/logout');
    props.navigation.closeDrawer();
  };

  const navigateAndClose = (route) => {
    router.push(route);
    props.navigation.closeDrawer();
  };

  // Dynamic colors based on theme
  const iconColor = isDark ? '#ffffff' : '#000000';
  const sectionHeaderColor = isDark ? '#4FC3F7' : '#2E86DE'; // Lighter blue for dark theme

  return (
    <DrawerContentScrollView 
      {...props}
      contentContainerStyle={styles.scrollContainer}
      style={styles.drawerScrollView}
      showsVerticalScrollIndicator={false}
      automaticallyAdjustContentInsets={true}
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
            
            {/* Role Badge */}
            <View style={styles.roleBadgeContainer}>
              <Badge style={[styles.roleBadge, { backgroundColor: currentRole === 'practitioner' ? '#27AE60' : '#2E86DE' }]}>
                {currentRole === 'practitioner' ? '👩‍⚕️ Practitioner' : '🐾 Pet Owner'}
              </Badge>
            </View>
            
            {/* Role Switcher - only show if user has multiple roles */}
            <RoleBasedComponent requiredRoles={['pet_owner', 'practitioner']}>
              <View style={styles.roleSwitcherContainer}>
                <RoleSwitcher />
              </View>
            </RoleBasedComponent>
          </>
        ) : (
          <Text variant="titleMedium" style={styles.userName}>
            Guest User
          </Text>
        )}
      </View>
      
      <Divider style={styles.divider} />
      
      {/* Navigation Items */}
      <List.Section style={styles.navSection}>
        
        {/* Account */}
        <List.Subheader style={[styles.sectionHeader, { color: sectionHeaderColor }]}>Account</List.Subheader>
        <List.Item
          title="My Profile"
          left={(props) => <List.Icon {...props} icon="account" color={iconColor} />}
          onPress={() => navigateAndClose('/profile')}
          titleStyle={styles.listItemTitle}
          style={styles.listItem}
        />

        {/* Pet Management - Show only in pet owner view */}
        <CurrentRoleComponent role="pet_owner">
          <Divider style={styles.sectionDivider} />       
          <List.Subheader style={[styles.sectionHeader, { color: sectionHeaderColor }]}>Pet Management</List.Subheader>
          <List.Item
            title="Add Pet"
            left={(props) => <List.Icon {...props} icon="plus" color={iconColor} />}
            onPress={() => navigateAndClose('/addPetScreen')}
            titleStyle={styles.listItemTitle}
            style={styles.listItem}
          />
          <List.Item
            title="My Pets"
            left={(props) => <List.Icon {...props} icon="paw" color={iconColor} />}
            onPress={() => navigateAndClose('/petListScreen')}
            titleStyle={styles.listItemTitle}
            style={styles.listItem}
          />
        </CurrentRoleComponent>

        {/* Practitioner Management - Show only in practitioner view */}
        <CurrentRoleComponent role="practitioner">
          <Divider style={styles.sectionDivider} />
          <List.Subheader style={[styles.sectionHeader, { color: sectionHeaderColor }]}>Practice Management</List.Subheader>
          <List.Item
            title="My Practice Profile"
            left={(props) => <List.Icon {...props} icon="medical-bag" color={iconColor} />}
            onPress={() => navigateAndClose('/practitionerProfile')}
            titleStyle={styles.listItemTitle}
            style={styles.listItem}
          />
          <List.Item
            title="Service Requests"
            left={(props) => <List.Icon {...props} icon="clipboard-list" color={iconColor} />}
            onPress={() => navigateAndClose('/serviceRequests')}
            right={() => <Badge size={20} style={styles.notificationBadge}>3</Badge>}
            titleStyle={styles.listItemTitle}
            style={styles.listItem}
          />
          <List.Item
            title="My Calendar"
            left={(props) => <List.Icon {...props} icon="calendar" color={iconColor} />}
            onPress={() => navigateAndClose('/practitionerCalendar')}
            titleStyle={styles.listItemTitle}
            style={styles.listItem}
          />
          <List.Item
            title="Practice Dashboard"
            left={(props) => <List.Icon {...props} icon="view-dashboard" color={iconColor} />}
            onPress={() => navigateAndClose('/practitionerDashboard')}
            titleStyle={styles.listItemTitle}
            style={styles.listItem}
          />
        </CurrentRoleComponent>

        {/* Journals - Available to both roles */}
        <Divider style={styles.sectionDivider} />
        <List.Subheader style={[styles.sectionHeader, { color: sectionHeaderColor }]}>Journals</List.Subheader>
        <List.Item
          title="My Journals"
          left={(props) => <List.Icon {...props} icon="book" color={iconColor} />}
          onPress={() => navigateAndClose('/journalListScreen')}
          titleStyle={styles.listItemTitle}
          style={styles.listItem}
        />
        <List.Item
          title="Create Journal"
          left={(props) => <List.Icon {...props} icon="book-plus" color={iconColor} />}
          onPress={() => navigateAndClose('/addJournalScreen')}
          titleStyle={styles.listItemTitle}
          style={styles.listItem}
        />
        
        {/* Collapse some journal features for cleaner UI */}
        <List.Item
          title="Journal Tools"
          left={(props) => <List.Icon {...props} icon="tools" color={iconColor} />}
          onPress={() => navigateAndClose('/journalToolsScreen')} // You can create a tools hub page
          titleStyle={styles.listItemTitle}
          style={styles.listItem}
        />
        
        {/* Social Features - Available to both roles */}
        <Divider style={styles.sectionDivider} />
        <List.Subheader style={[styles.sectionHeader, { color: sectionHeaderColor }]}>Social</List.Subheader>
        <List.Item
          title="My Connections"
          left={(props) => <List.Icon {...props} icon="account-group" color={iconColor} />}
          onPress={() => navigateAndClose('/connectionsScreen')}
          titleStyle={styles.listItemTitle}
          style={styles.listItem}
        />
        <List.Item
          title="Connection Requests"
          left={(props) => <List.Icon {...props} icon="account-clock" color={iconColor} />}
          onPress={() => navigateAndClose('/connectionRequestsScreen')}
          titleStyle={styles.listItemTitle}
          style={styles.listItem}
        />
        <List.Item
          title="Find Users"
          left={(props) => <List.Icon {...props} icon="account-search" color={iconColor} />}
          onPress={() => navigateAndClose('/userSearchScreen')}
          titleStyle={styles.listItemTitle}
          style={styles.listItem}
        />

        {/* Service Discovery - Show different content based on role */}
        <Divider style={styles.sectionDivider} />
        
        <CurrentRoleComponent role="pet_owner">
          <List.Subheader style={[styles.sectionHeader, { color: sectionHeaderColor }]}>Find Services</List.Subheader>
          <List.Item
            title="Find Practitioners"
            left={(props) => <List.Icon {...props} icon="map-search" color={iconColor} />}
            onPress={() => navigateAndClose('/findPractitioners')}
            titleStyle={styles.listItemTitle}
            style={styles.listItem}
          />
          <List.Item
            title="Find Veterinarians"
            left={(props) => <List.Icon {...props} icon="hospital-building" color={iconColor} />}
            onPress={() => navigateAndClose('/vetSearchScreen')}
            titleStyle={styles.listItemTitle}
            style={styles.listItem}
          />
        </CurrentRoleComponent>

        <CurrentRoleComponent role="practitioner">
          <List.Subheader style={[styles.sectionHeader, { color: sectionHeaderColor }]}>Professional Network</List.Subheader>
          <List.Item
            title="Other Practitioners"
            left={(props) => <List.Icon {...props} icon="account-group" color={iconColor} />}
            onPress={() => navigateAndClose('/practitionerNetwork')}
            titleStyle={styles.listItemTitle}
            style={styles.listItem}
          />
          <List.Item
            title="Veterinary Clinics"
            left={(props) => <List.Icon {...props} icon="hospital-building" color={iconColor} />}
            onPress={() => navigateAndClose('/vetSearchScreen')}
            titleStyle={styles.listItemTitle}
            style={styles.listItem}
          />
        </CurrentRoleComponent>

        {/* Community Features - Available to both roles */}
        <Divider style={styles.sectionDivider} />
        <List.Subheader style={[styles.sectionHeader, { color: sectionHeaderColor }]}>Community</List.Subheader>
        <List.Item
          title="Pet Stories"
          left={(props) => <List.Icon {...props} icon="post" color={iconColor} />}
          onPress={() => navigateAndClose('/postFeedScreen')}
          titleStyle={styles.listItemTitle}
          style={styles.listItem}
        />
        <List.Item
          title="Share Story"
          left={(props) => <List.Icon {...props} icon="plus-circle" color={iconColor} />}
          onPress={() => navigateAndClose('/createPostScreen')}
          titleStyle={styles.listItemTitle}
          style={styles.listItem}
        />

        {/* Practitioner Application - For pet owners who aren't practitioners yet */}
        <RoleBasedComponent requiredRole="pet_owner">
          {!hasRole('practitioner') && (
            <>
              <Divider style={styles.sectionDivider} />
              <List.Subheader style={[styles.sectionHeader, { color: sectionHeaderColor }]}>Professional Services</List.Subheader>
              <List.Item
                title="Become a Practitioner"
                description="Apply to offer professional services"
                left={(props) => <List.Icon {...props} icon="account-plus" color={iconColor} />}
                onPress={() => navigateAndClose('/becomePractitioner')}
                titleStyle={styles.listItemTitle}
                descriptionStyle={styles.listItemDescription}
                style={styles.listItem}
              />
              <List.Item
                title="Create Vet Clinic Profile"
                description="Register your veterinary clinic"
                left={(props) => <List.Icon {...props} icon="medical-bag" color={iconColor} />}
                onPress={() => navigateAndClose('/createVetProfileScreen')}
                titleStyle={styles.listItemTitle}
                descriptionStyle={styles.listItemDescription}
                style={styles.listItem}
              />
            </>
          )}
        </RoleBasedComponent>

        {/* Application Status - For pending practitioners */}
        <RoleBasedComponent requiredRole="pending_practitioner">
          <Divider style={styles.sectionDivider} />
          <List.Subheader style={[styles.sectionHeader, { color: sectionHeaderColor }]}>Application Status</List.Subheader>
          <List.Item
            title="Practitioner Application"
            description={`Status: ${userRoles.practitioner_status || 'Pending'}`}
            left={(props) => <List.Icon {...props} icon="clock-outline" color={iconColor} />}
            right={() => (
              <Badge style={[styles.statusBadge, { 
                backgroundColor: userRoles.practitioner_status === 'pending' ? '#F39C12' : '#E74C3C' 
              }]}>
                {userRoles.practitioner_status || 'Pending'}
              </Badge>
            )}
            onPress={() => navigateAndClose('/applicationStatus')}
            titleStyle={styles.listItemTitle}
            descriptionStyle={styles.listItemDescription}
            style={styles.listItem}
          />
        </RoleBasedComponent>

        {/* Admin Management - Show only in admin view */}
        <CurrentRoleComponent role="admin">
          <Divider style={styles.sectionDivider} />
          <List.Subheader style={[styles.sectionHeader, { color: sectionHeaderColor }]}>Admin Panel</List.Subheader>
          <List.Item
            title="Verification Panel"
            description="Review practitioner applications"
            left={(props) => <List.Icon {...props} icon="shield-check" color={iconColor} />}
            right={() => <Badge size={20} style={styles.adminBadge}>5</Badge>} // Pending count
            onPress={() => navigateAndClose('/verificationPanel')}
            titleStyle={styles.listItemTitle}
            descriptionStyle={styles.listItemDescription}
            style={styles.listItem}
          />
          <List.Item
            title="User Management"
            description="Manage user accounts"
            left={(props) => <List.Icon {...props} icon="account-group" color={iconColor} />}
            onPress={() => navigateAndClose('/userManagement')}
            titleStyle={styles.listItemTitle}
            descriptionStyle={styles.listItemDescription}
            style={styles.listItem}
          />
          <List.Item
            title="System Reports"
            description="View platform analytics"
            left={(props) => <List.Icon {...props} icon="chart-line" color={iconColor} />}
            onPress={() => navigateAndClose('/systemReports')}
            titleStyle={styles.listItemTitle}
            descriptionStyle={styles.listItemDescription}
            style={styles.listItem}
          />
        </CurrentRoleComponent>
      </List.Section>

      {/* Logout Section */}
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

// Dynamic style creation function
const createStyles = (isDark) => {
  // Define color schemes
  const colors = {
    light: {
      background: '#ffffff',
      text: '#000000',
      textSecondary: '#666666',
      divider: '#e0e0e0',
      border: '#cccccc',
    },
    dark: {
      background: '#2a2a2a',
      text: '#ffffff',
      textSecondary: '#cccccc',
      divider: '#555555',
      border: '#444444',
    }
  };
  
  const theme = isDark ? colors.dark : colors.light;
  
  return StyleSheet.create({
    drawerScrollView: {
      backgroundColor: theme.background,
    },
    scrollContainer: {
      flexGrow: 1,
      paddingBottom: 20,
      backgroundColor: theme.background,
    },
    profileSection: {
      padding: 20,
      alignItems: 'center',
      backgroundColor: theme.background,
    },
    userName: {
      marginTop: 10,
      fontWeight: '500',
      color: theme.text,
    },
    roleBadgeContainer: {
      marginTop: 8,
      alignItems: 'center',
    },
    roleBadge: {
      paddingHorizontal: 10,
      paddingRight: 20,
      paddingBottom: 5,
      paddingVertical: 0,
      borderRadius: 16,
    },
    roleSwitcherContainer: {
      marginTop: 12,
      width: '100%',
    },
    divider: {
      backgroundColor: theme.divider,
    },
    navSection: {
      flex: 1,
      paddingBottom: 10,
      backgroundColor: theme.background,
    },
    sectionHeader: {
      fontSize: 14,
      fontWeight: '600',
      paddingLeft: 16,
      paddingTop: 8,
      paddingBottom: 4,
      // Color is applied dynamically in the component
    },
    sectionDivider: {
      marginVertical: 8,
      marginHorizontal: 16,
      backgroundColor: theme.divider,
    },
    listItem: {
      backgroundColor: theme.background,
    },
    listItemTitle: {
      color: theme.text,
    },
    listItemDescription: {
      color: theme.textSecondary,
    },
    notificationBadge: {
      backgroundColor: '#E74C3C',
      color: 'white',
      fontSize: 12,
      marginRight: 8,
    },
    statusBadge: {
      marginRight: 8,
      fontSize: 10,
    },
    logoutSection: {
      padding: 20,
      paddingTop: 10,
      backgroundColor: theme.background,
    },
    adminBadge: {
      backgroundColor: '#E74C3C',
      color: 'white',
      fontSize: 12,
      marginRight: 8,
    },
  });
};