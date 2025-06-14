import { Stack } from 'expo-router';

export default function VeterinaryLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: '#E91E63',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Stack.Screen 
        name="vetSearchScreen" 
        options={{ 
          title: 'Find Vets',
          headerShown: true 
        }} 
      />
      <Stack.Screen 
        name="createVetProfileScreen" 
        options={{ 
          title: 'Create Vet Profile',
          presentation: 'modal'
        }} 
      />
      <Stack.Screen 
        name="vetProfileViewScreen" 
        options={{ title: 'Vet Profile' }} 
      />
    </Stack>
  );
}