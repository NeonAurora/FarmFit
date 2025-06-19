// components/practitioners/PractitionerCard.jsx
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { 
  Card, 
  Text, 
  Avatar, 
  Chip,
  Button,
  Divider
} from 'react-native-paper';
import { router } from 'expo-router';

export default function PractitionerCard({ 
  practitioner, 
  mode = 'full', // 'full' | 'compact' | 'grid'
  showActions = true,
  onPress
}) {
  const handlePress = () => {
    if (onPress) {
      onPress(practitioner);
    } else {
      router.push(`/viewPractitionerProfile?profileId=${practitioner.id}`);
    }
  };

  const handleContact = (e) => {
    e.stopPropagation();
    // Hook for Layer 5 - Communication
    console.log('Contact practitioner:', practitioner.id);
  };

  const handleBooking = (e) => {
    e.stopPropagation();
    // Hook for Layer 7 - Appointment booking
    console.log('Book appointment with:', practitioner.id);
  };

  if (mode === 'grid') {
    return (
      <Card style={styles.gridCard} onPress={handlePress}>
        <Card.Content style={styles.gridContent}>
          {practitioner.profile_photo_url ? (
            <Avatar.Image 
              size={80} 
              source={{ uri: practitioner.profile_photo_url }} 
            />
          ) : (
            <Avatar.Text 
              size={80} 
              label={practitioner.full_name?.charAt(0)?.toUpperCase() || 'P'} 
              backgroundColor="#27AE60"
            />
          )}
          
          <Text variant="titleSmall" style={styles.gridName} numberOfLines={2}>
            {practitioner.full_name}
          </Text>
          <Text variant="bodySmall" style={styles.gridDesignation} numberOfLines={1}>
            {practitioner.designation}
          </Text>
          <Text variant="bodySmall" style={styles.gridLocation} numberOfLines={1}>
            📍 {practitioner.district}
          </Text>
          
          {/* Hook for Layer 6 - Rating Display */}
          <View style={styles.ratingPlaceholder}>
            <Text variant="bodySmall" style={styles.placeholderText}>
              ⭐ 4.8 (12)
            </Text>
          </View>
        </Card.Content>
      </Card>
    );
  }

  if (mode === 'compact') {
    return (
      <Card style={styles.compactCard} onPress={handlePress}>
        <Card.Content>
          <View style={styles.compactHeader}>
            {practitioner.profile_photo_url ? (
              <Avatar.Image 
                size={50} 
                source={{ uri: practitioner.profile_photo_url }} 
              />
            ) : (
              <Avatar.Text 
                size={50} 
                label={practitioner.full_name?.charAt(0)?.toUpperCase() || 'P'} 
                backgroundColor="#27AE60"
              />
            )}
            
            <View style={styles.compactInfo}>
              <Text variant="titleMedium" style={styles.practitionerName}>
                {practitioner.full_name}
              </Text>
              <Text variant="bodyMedium" style={styles.designation}>
                {practitioner.designation}
              </Text>
              <Text variant="bodySmall" style={styles.location}>
                📍 {practitioner.sub_district}, {practitioner.district}
              </Text>
            </View>
            
            <View style={styles.compactBadge}>
              <Text style={styles.verifiedText}>✅</Text>
            </View>
          </View>
        </Card.Content>
      </Card>
    );
  }

  // Full mode (default)
  return (
    <Card style={styles.fullCard} onPress={handlePress}>
      <Card.Content>
        <View style={styles.practitionerHeader}>
          <View style={styles.practitionerInfo}>
            {practitioner.profile_photo_url ? (
              <Avatar.Image 
                size={70} 
                source={{ uri: practitioner.profile_photo_url }} 
              />
            ) : (
              <Avatar.Text 
                size={70} 
                label={practitioner.full_name?.charAt(0)?.toUpperCase() || 'P'} 
                backgroundColor="#27AE60"
              />
            )}
            
            <View style={styles.practitionerDetails}>
              <Text variant="titleMedium" style={styles.practitionerName}>
                {practitioner.full_name}
              </Text>
              <Text variant="bodyMedium" style={styles.designation}>
                {practitioner.designation}
              </Text>
              <Text variant="bodySmall" style={styles.degrees}>
                {practitioner.degrees_certificates}
              </Text>
              
              <View style={styles.locationContainer}>
                <Chip 
                  mode="outlined" 
                  style={styles.locationChip}
                  compact
                >
                  📍 {practitioner.sub_district}, {practitioner.district}
                </Chip>
              </View>
            </View>
          </View>
          
          <View style={styles.verifiedBadge}>
            <Text style={styles.verifiedText}>✅ Verified</Text>
          </View>
        </View>
        
        <Divider style={styles.cardDivider} />
        
        <Text variant="bodySmall" style={styles.expertise} numberOfLines={2}>
          <Text style={styles.expertiseLabel}>Expertise: </Text>
          {practitioner.areas_of_expertise}
        </Text>
        
        {/* Hook for Layer 6 - Rating Display */}
        <View style={styles.ratingPlaceholder}>
          <Text variant="bodySmall" style={styles.placeholderText}>
            ⭐ 4.8 (24 reviews) • Response time: 2 hours
          </Text>
        </View>

        {/* Hook for Layer 7 - Availability Display */}
        <View style={styles.availabilityPlaceholder}>
          <Text variant="bodySmall" style={styles.placeholderText}>
            🕒 Available today • Next slot: 2:00 PM
          </Text>
        </View>

        {showActions && (
          <View style={styles.actionButtons}>
            <Button
              mode="outlined"
              onPress={handleContact}
              style={styles.contactButton}
              icon="message"
              compact
            >
              Message
            </Button>
            
            <Button
              mode="contained"
              onPress={handleBooking}
              style={styles.bookButton}
              icon="calendar-plus"
              compact
            >
              Book Now
            </Button>
          </View>
        )}
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  // Full mode styles
  fullCard: {
    marginBottom: 12,
    elevation: 2,
  },
  practitionerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  practitionerInfo: {
    flexDirection: 'row',
    flex: 1,
  },
  practitionerDetails: {
    marginLeft: 16,
    flex: 1,
  },
  practitionerName: {
    fontWeight: 'bold',
    marginBottom: 2,
  },
  designation: {
    color: '#27AE60',
    marginBottom: 2,
  },
  degrees: {
    opacity: 0.7,
    marginBottom: 8,
  },
  locationContainer: {
    alignSelf: 'flex-start',
  },
  locationChip: {
    height: 28,
  },
  verifiedBadge: {
    backgroundColor: '#E8F5E8',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  verifiedText: {
    fontSize: 12,
    color: '#27AE60',
    fontWeight: '500',
  },
  cardDivider: {
    marginVertical: 12,
  },
  expertise: {
    marginBottom: 8,
  },
  expertiseLabel: {
    fontWeight: '500',
  },
  ratingPlaceholder: {
    backgroundColor: '#FFF3E0',
    padding: 8,
    borderRadius: 6,
    marginBottom: 8,
  },
  availabilityPlaceholder: {
    backgroundColor: '#E3F2FD',
    padding: 8,
    borderRadius: 6,
    marginBottom: 12,
  },
  placeholderText: {
    textAlign: 'center',
    fontStyle: 'italic',
    opacity: 0.8,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  contactButton: {
    flex: 1,
  },
  bookButton: {
    flex: 1,
  },

  // Compact mode styles
  compactCard: {
    marginBottom: 8,
    elevation: 1,
  },
  compactHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  compactInfo: {
    marginLeft: 12,
    flex: 1,
  },
  compactBadge: {
    marginLeft: 8,
  },
  location: {
    fontSize: 12,
    opacity: 0.7,
  },

  // Grid mode styles
  gridCard: {
    elevation: 1,
    margin: 6,
  },
  gridContent: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  gridName: {
    textAlign: 'center',
    fontWeight: 'bold',
    marginTop: 8,
    marginBottom: 4,
  },
  gridDesignation: {
    textAlign: 'center',
    color: '#27AE60',
    marginBottom: 4,
  },
  gridLocation: {
    textAlign: 'center',
    opacity: 0.7,
    marginBottom: 8,
  },
});