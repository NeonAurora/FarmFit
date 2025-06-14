import { Stack } from 'expo-router';

export default function PetsLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: '#4CAF50',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Stack.Screen 
        name="petListScreen" 
        options={{ 
          title: 'My Pets',
          headerShown: true 
        }} 
      />
      <Stack.Screen 
        name="addPetScreen" 
        options={{ 
          title: 'Add Pet',
          presentation: 'modal'
        }} 
      />
      <Stack.Screen 
        name="editPetScreen" 
        options={{ 
          title: 'Edit Pet',
          presentation: 'modal'
        }} 
      />
      <Stack.Screen 
        name="petProfileScreen" 
        options={{ title: 'Pet Profile' }} 
      />
    </Stack>
  );
}