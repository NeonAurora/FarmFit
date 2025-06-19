// components/roles/RoleSwitcher.jsx
import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { SegmentedButtons, Text, Button, Snackbar } from 'react-native-paper';
import { useAuth } from '@/contexts/AuthContext';

export default function RoleSwitcher() {
  const { currentRole, switchRole, hasRole, userRoles, isAdmin } = useAuth();
  const [switching, setSwitching] = useState(false);
  const [message, setMessage] = useState('');

  // Available roles for this user
  const availableRoles = [];
  
  if (hasRole('pet_owner')) {
    availableRoles.push({
      value: 'pet_owner',
      label: 'Pet Owner',
      icon: 'paw'
    });
  }

  if (hasRole('practitioner')) {
    availableRoles.push({
      value: 'practitioner', 
      label: 'Practitioner',
      icon: 'medical-bag'
    });
  }

  // NEW: Add admin role if user is admin
  if (hasRole('admin')) {
    availableRoles.push({
      value: 'admin',
      label: 'Admin',
      icon: 'shield-crown'
    });
  }

  // If user only has one role, don't show switcher
  if (availableRoles.length <= 1) {
    return null;
  }

  const handleRoleSwitch = async (newRole) => {
    if (newRole === currentRole) return;

    setSwitching(true);
    const success = await switchRole(newRole);
    
    if (success) {
      let roleLabel = 'Pet Owner';
      if (newRole === 'practitioner') roleLabel = 'Practitioner';
      if (newRole === 'admin') roleLabel = 'Admin';
      
      setMessage(`Switched to ${roleLabel} view`);
    } else {
      setMessage('Failed to switch role');
    }
    
    setSwitching(false);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>View As:</Text>
      <SegmentedButtons
        value={currentRole}
        onValueChange={handleRoleSwitch}
        buttons={availableRoles}
        disabled={switching}
        style={styles.segmentedButtons}
      />
      
      <Snackbar
        visible={!!message}
        onDismiss={() => setMessage('')}
        duration={2000}
        style={styles.snackbar}
      >
        {message}
      </Snackbar>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  label: {
    fontSize: 14,
    marginBottom: 8,
    fontWeight: '500',
  },
  segmentedButtons: {
    marginBottom: 8,
  },
  snackbar: {
    marginBottom: 16,
  },
});