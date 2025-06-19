// components/interfaces/DrawerContent.jsx
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme, Badge } from 'react-native-paper';
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

        {/* Pet Management - Show only in pet owner view */}
        <CurrentRoleComponent role="pet_owner">
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
        </CurrentRoleComponent>

        {/* Practitioner Management - Show only in practitioner view */}
        <CurrentRoleComponent role="practitioner">
          <Divider style={styles.sectionDivider} />
          <List.Subheader style={styles.sectionHeader}>Practice Management</List.Subheader>
          <List.Item
            title="My Practice Profile"
            left={(props) => <List.Icon {...props} icon="medical-bag" />}
            onPress={() => navigateAndClose('/practitionerProfile')}
          />
          <List.Item
            title="Service Requests"
            left={(props) => <List.Icon {...props} icon="clipboard-list" />}
            onPress={() => navigateAndClose('/serviceRequests')}
            right={() => <Badge size={20} style={styles.notificationBadge}>3</Badge>}
          />
          <List.Item
            title="My Calendar"
            left={(props) => <List.Icon {...props} icon="calendar" />}
            onPress={() => navigateAndClose('/practitionerCalendar')}
          />
          <List.Item
            title="Practice Dashboard"
            left={(props) => <List.Icon {...props} icon="view-dashboard" />}
            onPress={() => navigateAndClose('/practitionerDashboard')}
          />
        </CurrentRoleComponent>

        {/* Journals - Available to both roles */}
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
        
        {/* Collapse some journal features for cleaner UI */}
        <List.Item
          title="Journal Tools"
          left={(props) => <List.Icon {...props} icon="tools" />}
          onPress={() => navigateAndClose('/journalToolsScreen')} // You can create a tools hub page
        />
        
        {/* Social Features - Available to both roles */}
        <Divider style={styles.sectionDivider} />
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

        {/* Service Discovery - Show different content based on role */}
        <Divider style={styles.sectionDivider} />
        
        <CurrentRoleComponent role="pet_owner">
          <List.Subheader style={styles.sectionHeader}>Find Services</List.Subheader>
          <List.Item
            title="Find Practitioners"
            left={(props) => <List.Icon {...props} icon="map-search" />}
            onPress={() => navigateAndClose('/findPractitioners')}
          />
          <List.Item
            title="Find Veterinarians"
            left={(props) => <List.Icon {...props} icon="hospital-building" />}
            onPress={() => navigateAndClose('/vetSearchScreen')}
          />
        </CurrentRoleComponent>

        <CurrentRoleComponent role="practitioner">
          <List.Subheader style={styles.sectionHeader}>Professional Network</List.Subheader>
          <List.Item
            title="Other Practitioners"
            left={(props) => <List.Icon {...props} icon="account-group" />}
            onPress={() => navigateAndClose('/practitionerNetwork')}
          />
          <List.Item
            title="Veterinary Clinics"
            left={(props) => <List.Icon {...props} icon="hospital-building" />}
            onPress={() => navigateAndClose('/vetSearchScreen')}
          />
        </CurrentRoleComponent>

        {/* Community Features - Available to both roles */}
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

        {/* Practitioner Application - For pet owners who aren't practitioners yet */}
        <RoleBasedComponent requiredRole="pet_owner">
          {!hasRole('practitioner') && (
            <>
              <Divider style={styles.sectionDivider} />
              <List.Subheader style={styles.sectionHeader}>Professional Services</List.Subheader>
              <List.Item
                title="Become a Practitioner"
                description="Apply to offer professional services"
                left={(props) => <List.Icon {...props} icon="account-plus" />}
                onPress={() => navigateAndClose('/becomePractitioner')}
              />
              <List.Item
                title="Create Vet Clinic Profile"
                description="Register your veterinary clinic"
                left={(props) => <List.Icon {...props} icon="medical-bag" />}
                onPress={() => navigateAndClose('/createVetProfileScreen')}
              />
            </>
          )}
        </RoleBasedComponent>

        {/* Application Status - For pending practitioners */}
        <RoleBasedComponent requiredRole="pending_practitioner">
          <Divider style={styles.sectionDivider} />
          <List.Subheader style={styles.sectionHeader}>Application Status</List.Subheader>
          <List.Item
            title="Practitioner Application"
            description={`Status: ${userRoles.practitioner_status || 'Pending'}`}
            left={(props) => <List.Icon {...props} icon="clock-outline" />}
            right={() => (
              <Badge style={[styles.statusBadge, { 
                backgroundColor: userRoles.practitioner_status === 'pending' ? '#F39C12' : '#E74C3C' 
              }]}>
                {userRoles.practitioner_status || 'Pending'}
              </Badge>
            )}
            onPress={() => navigateAndClose('/applicationStatus')}
          />
        </RoleBasedComponent>
        {/* Admin Management - Show only in admin view */}
        <CurrentRoleComponent role="admin">
          <Divider style={styles.sectionDivider} />
          <List.Subheader style={styles.sectionHeader}>Admin Panel</List.Subheader>
          <List.Item
            title="Verification Panel"
            description="Review practitioner applications"
            left={(props) => <List.Icon {...props} icon="shield-check" />}
            right={() => <Badge size={20} style={styles.adminBadge}>5</Badge>} // Pending count
            onPress={() => navigateAndClose('/verificationPanel')}
          />
          <List.Item
            title="User Management"
            description="Manage user accounts"
            left={(props) => <List.Icon {...props} icon="account-group" />}
            onPress={() => navigateAndClose('/userManagement')}
          />
          <List.Item
            title="System Reports"
            description="View platform analytics"
            left={(props) => <List.Icon {...props} icon="chart-line" />}
            onPress={() => navigateAndClose('/systemReports')}
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
  },
  adminBadge: {
  backgroundColor: '#E74C3C',
  color: 'white',
  fontSize: 12,
  marginRight: 8,
},
});