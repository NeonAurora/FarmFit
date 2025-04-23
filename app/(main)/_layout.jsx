import { DarkTheme as NavigationDarkTheme, DefaultTheme as NavigationDefaultTheme } from '@react-navigation/native';
import { MD3DarkTheme, MD3LightTheme, PaperProvider } from 'react-native-paper';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { Pressable, Text, View, Image, Modal, TouchableWithoutFeedback } from 'react-native';
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
  const { user, signIn, signOut } = useAuth();
  const router = useRouter();
  const [showDropdown, setShowDropdown] = useState(false);
  
  const handleSignIn = async () => {
    await signIn();
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
          {user.picture ? (
            <Image source={{ uri: user.picture }} 
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
                {(user.name?.charAt(0) || user.email?.charAt(0) || 'U').toUpperCase()}
              </Text>
            </View>
          )}
          <Text style={{ 
            color: '#fff', 
            marginLeft: 10,
            fontWeight: '500'
          }}>
            {user.name?.split(' ')[0] || 'User'}
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
      style={{ 
        backgroundColor: '#2E86DE', 
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 6,
        marginRight: 10
      }}
    >
      <Text style={{ color: 'white', fontWeight: 'bold' }}>
        Sign In
      </Text>
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
            // The drawer already adds a hamburger icon by default
          }}
        >
          <Drawer.Screen 
            name="index" 
            options={{ 
              headerTitle: "Home",
              drawerLabel: "Home"
            }} 
          />
          <Drawer.Screen 
            name="profile" 
            options={{ 
              title: "Profile",
              drawerLabel: "Profile"
            }} 
          />
          <Drawer.Screen 
            name="createQuiz" 
            options={{ 
              title: "Create Quiz",
              drawerLabel: "Create Quiz"
            }} 
          />
          <Drawer.Screen 
            name="+not-found" 
            options={{ 
              title: "Not Found",
              drawerItemStyle: { display: 'none' }
            }} 
          />
        </Drawer>
        <StatusBar style="auto" />
      </PaperProvider>
    </AuthProvider>
  );
}