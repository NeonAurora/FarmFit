// components/interfaces/HorizontalMoodPicker.jsx
import React, { useState, useRef, useEffect } from 'react';
import { View, ScrollView, StyleSheet, Dimensions, TouchableOpacity } from 'react-native';
import { Text, IconButton } from 'react-native-paper';
import { useColorScheme } from '@/hooks/useColorScheme.native';

const MOODS = [
  { value: '', label: 'None', emoji: '😐', color: '#9E9E9E' },
  { value: 'happy', label: 'Happy', emoji: '😊', color: '#4CAF50' },
  { value: 'worried', label: 'Worried', emoji: '😟', color: '#FF9800' },
  { value: 'proud', label: 'Proud', emoji: '😤', color: '#9C27B0' },
  { value: 'sad', label: 'Sad', emoji: '😢', color: '#2196F3' },
  { value: 'tired', label: 'Tired', emoji: '😴', color: '#607D8B' }
];

const { width: screenWidth } = Dimensions.get('window');
const ITEM_WIDTH = 100;
const SIDE_ITEM_WIDTH = 70;
const CONTAINER_WIDTH = screenWidth - 100; // Account for chevrons and padding

export default function HorizontalMoodPicker({ value, onValueChange }) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const scrollViewRef = useRef(null);
  
  // Find current index
  const currentIndex = MOODS.findIndex(mood => mood.value === value);
  const [selectedIndex, setSelectedIndex] = useState(Math.max(0, currentIndex));

  // Calculate proper scroll position to center the selected item
  const getScrollPosition = (index) => {
    // Calculate the position where the item's center aligns with container's center
    const itemCenterPosition = index * ITEM_WIDTH + (ITEM_WIDTH / 2);
    const containerCenter = CONTAINER_WIDTH / 2;
    const scrollX = itemCenterPosition - containerCenter;
    
    // Ensure we don't scroll beyond bounds
    const maxScroll = (MOODS.length * ITEM_WIDTH) - CONTAINER_WIDTH;
    return Math.max(0, Math.min(scrollX, maxScroll));
  };

  // Scroll to specific mood with proper centering
  const scrollToMood = (index) => {
    if (scrollViewRef.current && index >= 0 && index < MOODS.length) {
      const scrollX = getScrollPosition(index);
      scrollViewRef.current.scrollTo({ x: scrollX, animated: true });
      setSelectedIndex(index);
      onValueChange(MOODS[index].value);
    }
  };

  // Handle scroll navigation
  const scrollLeft = () => {
    const newIndex = Math.max(0, selectedIndex - 1);
    scrollToMood(newIndex);
  };

  const scrollRight = () => {
    const newIndex = Math.min(MOODS.length - 1, selectedIndex + 1);
    scrollToMood(newIndex);
  };

  // Initialize scroll position
  useEffect(() => {
    if (scrollViewRef.current && selectedIndex >= 0) {
      // Use a longer timeout to ensure ScrollView is fully rendered
      setTimeout(() => {
        const scrollX = getScrollPosition(selectedIndex);
        scrollViewRef.current.scrollTo({ x: scrollX, animated: false });
      }, 200);
    }
  }, []);

  // Handle manual scroll - calculate which item should be selected based on scroll position
  const handleScrollEnd = (event) => {
    const scrollX = event.nativeEvent.contentOffset.x;
    const containerCenter = CONTAINER_WIDTH / 2;
    
    // Find which item is closest to the center
    let closestIndex = 0;
    let closestDistance = Infinity;
    
    for (let i = 0; i < MOODS.length; i++) {
      const itemCenterPosition = i * ITEM_WIDTH + (ITEM_WIDTH / 2);
      const itemPositionOnScreen = itemCenterPosition - scrollX;
      const distanceFromCenter = Math.abs(itemPositionOnScreen - containerCenter);
      
      if (distanceFromCenter < closestDistance) {
        closestDistance = distanceFromCenter;
        closestIndex = i;
      }
    }
    
    if (closestIndex !== selectedIndex) {
      setSelectedIndex(closestIndex);
      onValueChange(MOODS[closestIndex].value);
      
      // Snap to the exact center position
      const exactScrollX = getScrollPosition(closestIndex);
      scrollViewRef.current.scrollTo({ x: exactScrollX, animated: true });
    }
  };

  // Calculate which item should appear selected based on scroll position (for real-time visual feedback)
  const [visualSelectedIndex, setVisualSelectedIndex] = useState(selectedIndex);

  const handleScroll = (event) => {
    const scrollX = event.nativeEvent.contentOffset.x;
    const containerCenter = CONTAINER_WIDTH / 2;
    
    // Find which item is closest to the center for visual feedback
    let closestIndex = 0;
    let closestDistance = Infinity;
    
    for (let i = 0; i < MOODS.length; i++) {
      const itemCenterPosition = i * ITEM_WIDTH + (ITEM_WIDTH / 2);
      const itemPositionOnScreen = itemCenterPosition - scrollX;
      const distanceFromCenter = Math.abs(itemPositionOnScreen - containerCenter);
      
      if (distanceFromCenter < closestDistance) {
        closestDistance = distanceFromCenter;
        closestIndex = i;
      }
    }
    
    setVisualSelectedIndex(closestIndex);
  };

  const renderMoodItem = (mood, index) => {
    const isSelected = index === visualSelectedIndex;
    const itemWidth = ITEM_WIDTH; // Keep consistent width for proper positioning
    const scale = isSelected ? 1.2 : 0.9;
    const opacity = isSelected ? 1 : 0.6;

    return (
      <TouchableOpacity
        key={mood.value}
        style={[
          styles.moodItem,
          {
            width: itemWidth,
            backgroundColor: isSelected ? mood.color + '20' : 'transparent',
            borderColor: isSelected ? mood.color : 'transparent',
            borderWidth: isSelected ? 2 : 0,
            transform: [{ scale }],
            opacity
          },
          isDark && isSelected && styles.moodItemDark
        ]}
        onPress={() => scrollToMood(index)}
        activeOpacity={0.7}
      >
        <Text style={[styles.moodEmoji, { fontSize: isSelected ? 32 : 24 }]}>
          {mood.emoji}
        </Text>
        <Text style={[
          styles.moodLabel,
          { 
            fontSize: isSelected ? 14 : 12,
            color: isSelected ? mood.color : (isDark ? '#fff' : '#666'),
            fontWeight: isSelected ? '600' : '400'
          }
        ]}>
          {mood.label}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Left Chevron */}
      <IconButton
        icon="chevron-left"
        size={24}
        onPress={scrollLeft}
        disabled={selectedIndex === 0}
        style={[
          styles.chevron,
          { opacity: selectedIndex === 0 ? 0.3 : 1 }
        ]}
        iconColor={isDark ? '#fff' : '#666'}
      />

      {/* Mood Picker Scroll View */}
      <View style={[styles.pickerContainer, { width: CONTAINER_WIDTH }]}>
        <ScrollView
          ref={scrollViewRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          onScroll={handleScroll}
          onMomentumScrollEnd={handleScrollEnd}
          scrollEventThrottle={16}
          decelerationRate="fast"
          contentContainerStyle={styles.scrollContent}
          style={styles.scrollView}
        >
          {MOODS.map((mood, index) => renderMoodItem(mood, index))}
        </ScrollView>

        {/* Center indicator line */}
        <View style={[styles.centerIndicator, isDark && styles.centerIndicatorDark]} />
      </View>

      {/* Right Chevron */}
      <IconButton
        icon="chevron-right"
        size={24}
        onPress={scrollRight}
        disabled={selectedIndex === MOODS.length - 1}
        style={[
          styles.chevron,
          { opacity: selectedIndex === MOODS.length - 1 ? 0.3 : 1 }
        ]}
        iconColor={isDark ? '#fff' : '#666'}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 120,
    marginVertical: 8,
    justifyContent: 'center',
  },
  chevron: {
    margin: 0,
    width: 40,
  },
  pickerContainer: {
    height: 120,
    position: 'relative',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  scrollView: {
    height: 120,
  },
  scrollContent: {
    alignItems: 'center',
    paddingVertical: 10,
    // Add padding to allow proper centering of first and last items
    paddingHorizontal: CONTAINER_WIDTH / 2 - ITEM_WIDTH / 2,
  },
  moodItem: {
    height: 90,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 2,
    paddingVertical: 8,
  },
  moodItemDark: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  moodEmoji: {
    marginBottom: 4,
  },
  moodLabel: {
    textAlign: 'center',
    textTransform: 'capitalize',
  },
  centerIndicator: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: 2,
    height: 60,
    backgroundColor: '#ddd',
    marginLeft: -1,
    marginTop: -30,
    opacity: 0.5,
    borderRadius: 1,
    zIndex: 1,
  },
  centerIndicatorDark: {
    backgroundColor: '#666',
  },
});