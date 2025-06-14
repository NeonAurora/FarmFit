import { Stack } from 'expo-router';

export default function PostsLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: '#0a7ea4',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Stack.Screen 
        name="postFeedScreen" 
        options={{ 
          title: 'Posts Feed',
          headerShown: true 
        }} 
      />
      <Stack.Screen 
        name="postViewScreen" 
        options={{ 
          title: 'Post Details',
          presentation: 'modal'
        }} 
      />
      <Stack.Screen 
        name="createPostScreen" 
        options={{ 
          title: 'Create Post',
          presentation: 'modal'
        }} 
      />
      <Stack.Screen 
        name="userPostsScreen" 
        options={{ title: 'My Posts' }} 
      />
    </Stack>
  );
}