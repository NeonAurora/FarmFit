// app/(main)/(screens)/(practitioner)/_layout.jsx
import { Stack } from 'expo-router';

export default function PractitionerLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: '#27AE60', // Green theme for practitioner features
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      {/* Profile Creation & Management */}
      <Stack.Screen 
        name="becomePractitioner" 
        options={{ 
          title: 'Become a Practitioner',
          headerShown: true,
          presentation: 'modal'
        }} 
      />
      
      <Stack.Screen 
        name="practitionerProfile" 
        options={{ 
          title: 'My Practice Profile',
          headerShown: true 
        }} 
      />
      
      <Stack.Screen 
        name="editPractitionerProfile" 
        options={{ 
          title: 'Edit Profile',
          presentation: 'modal'
        }} 
      />
      
      <Stack.Screen 
        name="applicationStatus" 
        options={{ 
          title: 'Application Status',
          headerShown: true
        }} 
      />

      {/* Public Profile Views */}
      <Stack.Screen 
        name="viewPractitionerProfile" 
        options={{ 
          title: 'Practitioner Profile',
          headerShown: true
        }} 
      />
      
      <Stack.Screen 
        name="findPractitioners" 
        options={{ 
          title: 'Find Practitioners',
          headerShown: true
        }} 
      />

      {/* Practice Management (Layer 3+) */}
      <Stack.Screen 
        name="practitionerDashboard" 
        options={{ 
          title: 'Practice Dashboard',
          headerShown: true
        }} 
      />

      {/* Service Management (Future Layer 6) */}
      <Stack.Screen 
        name="serviceRequests" 
        options={{ 
          title: 'Service Requests',
          headerShown: true,
          headerRight: () => (
            // Badge for notifications will be added in Layer 6
            null
          )
        }} 
      />
      
      <Stack.Screen 
        name="serviceRequestDetails" 
        options={{ 
          title: 'Request Details',
          presentation: 'modal'
        }} 
      />
      
      <Stack.Screen 
        name="createServiceQuote" 
        options={{ 
          title: 'Create Quote',
          presentation: 'modal'
        }} 
      />

      {/* Calendar & Appointments (Future Layer 7) */}
      <Stack.Screen 
        name="practitionerCalendar" 
        options={{ 
          title: 'My Calendar',
          headerShown: true
        }} 
      />
      
      <Stack.Screen 
        name="appointmentDetails" 
        options={{ 
          title: 'Appointment Details',
          presentation: 'modal'
        }} 
      />
      
      <Stack.Screen 
        name="availabilitySettings" 
        options={{ 
          title: 'Availability Settings',
          presentation: 'modal'
        }} 
      />

      {/* Communication (Future Layer 5) */}
      <Stack.Screen 
        name="practitionerMessages" 
        options={{ 
          title: 'Messages',
          headerShown: true
        }} 
      />
      
      <Stack.Screen 
        name="chatWithClient" 
        options={{ 
          title: 'Chat',
          presentation: 'modal'
        }} 
      />

      {/* Professional Network */}
      <Stack.Screen 
        name="practitionerNetwork" 
        options={{ 
          title: 'Professional Network',
          headerShown: true
        }} 
      />

      {/* Analytics & Reports (Future Layer 10) */}
      <Stack.Screen 
        name="practiceAnalytics" 
        options={{ 
          title: 'Practice Analytics',
          headerShown: true
        }} 
      />
      
      <Stack.Screen 
        name="earningsReport" 
        options={{ 
          title: 'Earnings Report',
          presentation: 'modal'
        }} 
      />

      {/* Settings & Configuration */}
      <Stack.Screen 
        name="practiceSettings" 
        options={{ 
          title: 'Practice Settings',
          headerShown: true
        }} 
      />
      
      <Stack.Screen 
        name="profileVisibilitySettings" 
        options={{ 
          title: 'Privacy Settings',
          presentation: 'modal'
        }} 
      />

      {/* Admin/Verification (Special access) */}
      <Stack.Screen 
        name="verificationPanel" 
        options={{ 
          title: 'Verification Panel',
          headerShown: true,
          headerStyle: {
            backgroundColor: '#E74C3C', // Different color for admin features
          }
        }} 
      />
      
      <Stack.Screen 
        name="reviewApplication" 
        options={{ 
          title: 'Review Application',
          presentation: 'modal',
          headerStyle: {
            backgroundColor: '#E74C3C',
          }
        }} 
      />
    </Stack>
  );
}