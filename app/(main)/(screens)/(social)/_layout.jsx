
import { Stack } from 'expo-router';

export default function SocialLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: '#9C27B0',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Stack.Screen 
        name="connectionsScreen" 
        options={{ 
          title: 'Connections',
          headerShown: true 
        }} 
      />
      <Stack.Screen 
        name="connectionRequestsScreen" 
        options={{ title: 'Connection Requests' }} 
      />
      <Stack.Screen 
        name="userProfileScreen" 
        options={{ title: 'User Profile' }} 
      />
      <Stack.Screen 
        name="userSearchScreen" 
        options={{ 
          title: 'Find Users',
          presentation: 'modal'
        }} 
      />
    </Stack>
  );
}