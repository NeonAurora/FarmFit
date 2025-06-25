// app/(main)/_layout.jsx
import { DarkTheme as NavigationDarkTheme, DefaultTheme as NavigationDefaultTheme } from '@react-navigation/native';
import { MD3DarkTheme, MD3LightTheme, PaperProvider } from 'react-native-paper';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { Pressable, Text, View, Image, Modal, TouchableWithoutFeedback, ActivityIndicator, Platform } from 'react-native';
import { useColorScheme } from '@/hooks/useColorScheme.native';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { Drawer } from 'expo-router/drawer';
import { DrawerContent } from '@/components/interfaces/DrawerContent';
import { useRouter } from 'expo-router';
import { useThemeColor } from '@/hooks/useThemeColor';

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
  const [isSigningIn, setIsSigningIn] = useState(false);
  
  // Add theme awareness to HeaderRight component
  const { colorScheme, isDark } = useColorScheme();
  
  const handleSignIn = async () => {
    setIsSigningIn(true);
    try {
      await signIn();
    } catch (error) {
      console.error('Sign in error:', error);
    } finally {
      setIsSigningIn(false);
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
  
  // Dynamic colors for the HeaderRight component
  const modalBackgroundColor = isDark ? '#333' : '#fff';
  const modalTextColor = isDark ? '#fff' : '#000';
  const modalBorderColor = isDark ? '#555' : '#eee';
  const headerTextColor = isDark ? '#fff' : '#000';
  const avatarBorderColor = isDark ? '#555' : '#ddd';
  
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
                borderWidth: 1, borderColor: avatarBorderColor // Dynamic border color
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
            color: headerTextColor, // Dynamic text color
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
                backgroundColor: modalBackgroundColor, // Dynamic background
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
                    borderBottomColor: modalBorderColor // Dynamic border
                  }}
                >
                  <Text style={{ color: modalTextColor }}>View Profile</Text>
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
      disabled={isSigningIn}
      style={{ 
        backgroundColor: isSigningIn ? '#A0A0A0' : '#2E86DE',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 6,
        marginRight: 10,
        opacity: isSigningIn ? 0.7 : 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        minWidth: 80,
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
  const { colorScheme, isDark } = useColorScheme(); // Fix: Destructure properly
  const theme = colorScheme === 'dark' ? CombinedDarkTheme : CombinedLightTheme;
  const headerBackgroundColor = useThemeColor({}, 'background');
  const headerTextColor = useThemeColor({}, 'text');

  console.log('=== LAYOUT DEBUG ===');
  console.log('Platform:', Platform.OS);
  console.log('colorScheme:', colorScheme);
  console.log('isDark:', isDark);
  console.log('headerBackgroundColor:', headerBackgroundColor);
  console.log('Colors.dark.background:', '#151718'); // Expected value
  console.log('===================');
  
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
          screenOptions={({ navigation, route }) => ({
            headerStyle: {
              backgroundColor: headerBackgroundColor, // Use isDark for consistency
            },
            headerTintColor: headerTextColor, // Use isDark for consistency
            headerRight: () => <HeaderRight />,
          })}
        >
          {/* Main Screens */}
          <Drawer.Screen name="index" options={{ title: "Home" }} />
          <Drawer.Screen name="profile" options={{ title: "Profile" }} />
          <Drawer.Screen name="editUserSelfProfileScreen" options={{ title: "Edit Profile" }} />

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
          <Drawer.Screen 
            name="(screens)/(practitioner)" 
            options={{ headerShown: false }} 
          />
          <Drawer.Screen 
            name="(screens)/(utils)" 
            options={{ headerShown: false }} 
          />
        </Drawer>
        <StatusBar style="auto" />
      </PaperProvider>
    </AuthProvider>
  );
}