// app/(main)/_layout.jsx
import { DarkTheme as NavigationDarkTheme, DefaultTheme as NavigationDefaultTheme } from '@react-navigation/native';
import { MD3DarkTheme, MD3LightTheme, PaperProvider } from 'react-native-paper';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { Pressable, Text, View, Image, Modal, TouchableWithoutFeedback, ActivityIndicator } from 'react-native'; // ← Add ActivityIndicator
import { useColorScheme } from '@/hooks/useColorScheme';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { Drawer } from 'expo-router/drawer';
import { DrawerContent } from '@/components/interfaces/DrawerContent';
import { useRouter } from 'expo-router';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

// Create combined themes
const CombinedLightTheme = {
  ...NavigationDefaultTheme,
  ...MD3LightTheme,
  colors: {
    ...NavigationDefaultTheme.colors,
    ...MD3LightTheme.colors,
  },
};

const CombinedDarkTheme = {
  ...NavigationDarkTheme,
  ...MD3DarkTheme,
  colors: {
    ...NavigationDarkTheme.colors,
    ...MD3DarkTheme.colors,
  },
};

// Custom Header Right Component
function HeaderRight() {
  const { user, userData, signIn, signOut } = useAuth();
  const router = useRouter();
  const [showDropdown, setShowDropdown] = useState(false);
  const [isSigningIn, setIsSigningIn] = useState(false); // ← Add loading state
  
  const handleSignIn = async () => {
    setIsSigningIn(true); // ← Start loading
    try {
      await signIn();
    } catch (error) {
      console.error('Sign in error:', error);
      // You might want to show an error message here
    } finally {
      setIsSigningIn(false); // ← Stop loading
    }
  };
  
  const handleSignOut = async () => {
    setShowDropdown(false);
    await signOut();
    router.replace('/logout');
  };
  
  const handleProfileClick = () => {
    setShowDropdown(false);
    router.push('/profile');
  };
  
  const toggleDropdown = () => {
    setShowDropdown(prev => !prev);
  };
  
  if (user) {
    // Use Supabase data with Auth0 fallbacks
    const displayName = userData?.name || user.name;
    const displayPicture = userData?.picture || user.picture;

    return (
      <>
        <Pressable 
          onPress={toggleDropdown}
          style={{ 
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: 'transparent',
            paddingHorizontal: 12,
            paddingVertical: 6,
            marginRight: 10
          }}
        >
          {/* User avatar and name */}
          {displayPicture ? (
            <Image source={{ uri: displayPicture }} 
              style={{
                width: 32, height: 32, borderRadius: 16,
                borderWidth: 1, borderColor: '#ddd'
              }}
            />
          ) : (
            <View style={{
              width: 32, height: 32, borderRadius: 16,
              backgroundColor: '#2E86DE',
              alignItems: 'center', justifyContent: 'center'
            }}>
              <Text style={{ color: 'white', fontWeight: 'bold' }}>
                {(displayName?.charAt(0) || user.email?.charAt(0) || 'U').toUpperCase()}
              </Text>
            </View>
          )}
          <Text style={{ 
            color: '#fff', 
            marginLeft: 10,
            fontWeight: '500'
          }}>
            {displayName?.split(' ')[0] || 'User'}
          </Text>
        </Pressable>
        
        <Modal
          transparent={true}
          visible={showDropdown}
          onRequestClose={() => setShowDropdown(false)}
          animationType="fade"
        >
          <TouchableWithoutFeedback onPress={() => setShowDropdown(false)}>
            <View style={{ flex: 1 }}>
              <View style={{
                position: 'absolute',
                right: 10,
                top: 50,
                backgroundColor: '#fff',
                borderRadius: 8,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.25,
                shadowRadius: 3.84,
                elevation: 5,
                minWidth: 150,
              }}>
                <Pressable 
                  onPress={handleProfileClick}
                  style={{ 
                    paddingVertical: 12,
                    paddingHorizontal: 16,
                    borderBottomWidth: 1,
                    borderBottomColor: '#eee'
                  }}
                >
                  <Text>View Profile</Text>
                </Pressable>
                <Pressable 
                  onPress={handleSignOut}
                  style={{ 
                    paddingVertical: 12,
                    paddingHorizontal: 16
                  }}
                >
                  <Text style={{ color: '#E74C3C' }}>Sign Out</Text>
                </Pressable>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </Modal>
      </>
    );
  }
  
  return (
    <Pressable 
      onPress={handleSignIn}
      disabled={isSigningIn} // ← Disable button when loading
      style={{ 
        backgroundColor: isSigningIn ? '#A0A0A0' : '#2E86DE', // ← Change color when loading
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 6,
        marginRight: 10,
        opacity: isSigningIn ? 0.7 : 1, // ← Dim when loading
        flexDirection: 'row', // ← Add for spinner alignment
        alignItems: 'center', // ← Center spinner and text
        justifyContent: 'center', // ← Center content
        minWidth: 80, // ← Prevent button from shrinking
      }}
    >
      {isSigningIn ? (
        <>
          <ActivityIndicator size="small" color="white" style={{ marginRight: 8 }} />
          <Text style={{ color: 'white', fontWeight: 'bold' }}>
            Signing In...
          </Text>
        </>
      ) : (
        <Text style={{ color: 'white', fontWeight: 'bold' }}>
          Sign In
        </Text>
      )}
    </Pressable>
  );
}

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? CombinedDarkTheme : CombinedLightTheme;
  
  const [loaded] = useFonts({
    SpaceMono: require('../../assets/fonts/SpaceMono-Regular.ttf'),
  });

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <AuthProvider>
      <PaperProvider theme={theme}>
        <Drawer
          drawerContent={(props) => <DrawerContent {...props} />}
          screenOptions={{
            headerStyle: {
              backgroundColor: colorScheme === 'dark' ? '#121212' : '#fff',
            },
            headerTintColor: colorScheme === 'dark' ? '#fff' : '#000',
            headerRight: () => <HeaderRight />,
          }}
        >
          {/* Main Screens */}
          <Drawer.Screen name="index" options={{ title: "Home" }} />
          <Drawer.Screen name="profile" options={{ title: "Profile" }} />

          {/* Hide headers for each nested group */}
          <Drawer.Screen 
            name="(screens)/(posts)" 
            options={{ headerShown: false }} 
          />
          <Drawer.Screen 
            name="(screens)/(journals)" 
            options={{ headerShown: false }} 
          />
          <Drawer.Screen 
            name="(screens)/(pets)" 
            options={{ headerShown: false }} 
          />
          <Drawer.Screen 
            name="(screens)/(veterinary)" 
            options={{ headerShown: false }} 
          />
          <Drawer.Screen 
            name="(screens)/(social)" 
            options={{ headerShown: false }} 
          />
          
          {/* Pet Management */}
          {/* <Drawer.Screen name="(screens)/(pets)/addPetScreen" options={{ title: "Add Pet sdsdd" }} />
          <Drawer.Screen name="(screens)/(pets)/petListScreen" options={{ title: "My Pets" }} />
          <Drawer.Screen name="(screens)/(pets)/petProfileScreen" options={{ title: "Pet Profile" }} />
          <Drawer.Screen name="(screens)/(pets)/editPetScreen" options={{ title: "Edit Pet" }} /> */}
          
          {/* Veterinary Services */}
          {/* <Drawer.Screen name="(screens)/createVetProfileScreen" options={{ title: "Create Vet Profile" }} />
          <Drawer.Screen name="(screens)/vetSearchScreen" options={{ title: "Find Veterinarians" }} />
          <Drawer.Screen name="(screens)/vetProfileViewScreen" options={{ title: "Veterinary Clinic" }} /> */}
          
          {/* System Screens */}
          {/* <Drawer.Screen name="+not-found" options={{ title: "Not Found" }} /> */}
          
          {/* User Management Screens */}
          {/* <Drawer.Screen name="(screens)/userSearchScreen" options={{ title: "Find Users" }} />
          <Drawer.Screen name="(screens)/userProfileScreen" options={{ title: "User Profile" }} />
          <Drawer.Screen name="editUserSelfProfileScreen" options={{ title: "Edit Profile" }} />
          <Drawer.Screen name="(screens)/connectionRequestsScreen" options={{ title: "Requests" }} />
          <Drawer.Screen name="(screens)/connectionsScreen" options={{ title: "Connections" }} /> */}
          
          {/* Journal Features */}
          {/* <Drawer.Screen name="(screens)/journalListScreen" options={{ title: "My Journals" }} />
          <Drawer.Screen name="(screens)/addJournalScreen" options={{ title: "Create Journal" }} />
          <Drawer.Screen name="(screens)/editJournalScreen" options={{ title: "Edit Journal Entry" }} />
          <Drawer.Screen name="(screens)/journalViewScreen" options={{ title: "Journal Entry" }} />
          <Drawer.Screen name="(screens)/journalStatsScreen" options={{ title: "Journal Stats" }} />
          <Drawer.Screen name="(screens)/journalSearchScreen" options={{ title: "Journal Search" }} />
          <Drawer.Screen name="(screens)/journalSettingsScreen" options={{ title: "Journal Settings" }} /> */}

          {/* Community Features */}
          {/* <Drawer.Screen name="(screens)/postFeedScreen" options={{ title: "Community Feed" }} />
          <Drawer.Screen name="(screens)/createPostScreen" options={{ title: "Create Post" }} />
          <Drawer.Screen name="(screens)/postViewScreen" options={{ title: "Post Detail" }} />
          <Drawer.Screen name="(screens)/userPostScreen" options={{ title: "Edit Post" }} /> */}

        </Drawer>
        <StatusBar style="auto" />
      </PaperProvider>
    </AuthProvider>
  );
}