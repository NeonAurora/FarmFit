import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useColorScheme } from 'react-native';

export default function ImagePicker({ image, onPickImage, isUploading = false }) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  return (
    <TouchableOpacity 
      style={[styles.imageSelector, isDark && styles.imageSelectorDark]}
      onPress={onPickImage}
      disabled={isUploading}
    >
      {image ? (
        <Image 
          source={{ uri: image }} 
          style={styles.previewImage} 
          resizeMode="cover"
        />
      ) : (
        <View style={styles.imagePickerPlaceholder}>
          <Text style={[styles.imagePickerText, isDark && styles.textLight]}>
            Tap to add an image
          </Text>
        </View>
      )}
      
      {isUploading && (
        <View style={styles.uploadingOverlay}>
          <ActivityIndicator size="large" color="#0a7ea4" />
          <Text style={styles.uploadingText}>Uploading...</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  imageSelector: {
    height: 160,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    marginBottom: 16,
    overflow: 'hidden',
    backgroundColor: '#f9f9f9',
    position: 'relative',
  },
  imageSelectorDark: {
    borderColor: '#444',
    backgroundColor: '#333',
  },
  imagePickerPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imagePickerText: {
    color: '#888',
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  textLight: {
    color: '#eee',
  },
  uploadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  uploadingText: {
    color: 'white',
    marginTop: 10,
    fontWeight: '500',
  },
});