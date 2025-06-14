// components/interfaces/ReanimatedMoodCarousel.jsx
import React, { useRef, useEffect, useState } from 'react';
import { View, StyleSheet, Dimensions, TouchableOpacity, Platform } from 'react-native';
import { Text, IconButton } from 'react-native-paper';
import Carousel from 'react-native-reanimated-carousel';
import { useColorScheme } from '@/hooks/useColorScheme';

const MOODS = [
  { value: '', label: 'None', emoji: '😐', color: '#9E9E9E' },
  { value: 'happy', label: 'Happy', emoji: '😊', color: '#4CAF50' },
  { value: 'worried', label: 'Worried', emoji: '😟', color: '#FF9800' },
  { value: 'proud', label: 'Proud', emoji: '😤', color: '#9C27B0' },
  { value: 'sad', label: 'Sad', emoji: '😢', color: '#2196F3' },
  { value: 'tired', label: 'Tired', emoji: '😴', color: '#607D8B' }
];

const { width: screenWidth } = Dimensions.get('window');
const CAROUSEL_WIDTH = screenWidth - 80;
const ITEM_WIDTH = 120;

// Replace the getShadowStyle function with this cleaner version:
const getShadowStyle = (isActive, color) => {
  return {};
};

export default function ReanimatedMoodCarousel({ value, onValueChange }) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const carouselRef = useRef(null);
  
  const currentIndex = MOODS.findIndex(mood => mood.value === value);
  const [activeIndex, setActiveIndex] = useState(Math.max(0, currentIndex));

  // Initialize carousel position
  useEffect(() => {
    if (currentIndex >= 0 && currentIndex !== activeIndex) {
      setActiveIndex(currentIndex);
      // Scroll to the correct index after a small delay
      setTimeout(() => {
        carouselRef.current?.scrollTo({ index: currentIndex, animated: false });
      }, 100);
    }
  }, [currentIndex]);

  const handleSnapToItem = (index) => {
    setActiveIndex(index);
    onValueChange(MOODS[index].value);
  };

  const scrollToPrevious = () => {
    const newIndex = Math.max(0, activeIndex - 1);
    carouselRef.current?.scrollTo({ index: newIndex, animated: true });
  };

  const scrollToNext = () => {
    const newIndex = Math.min(MOODS.length - 1, activeIndex + 1);
    carouselRef.current?.scrollTo({ index: newIndex, animated: true });
  };

  const renderMoodItem = ({ item, index }) => {
    const isActive = index === activeIndex;
    
    return (
      <TouchableOpacity
        style={[
          styles.moodItem,
          {
            backgroundColor: isActive ? item.color + '25' : (isDark ? '#333' : '#f8f9fa'),
            borderColor: isActive ? item.color : (isDark ? '#555' : '#e0e0e0'),
            borderWidth: isActive ? 3 : 1.5,
            transform: [{ scale: isActive ? 1 : 0.85 }],
            opacity: isActive ? 1 : 0.7,
          },
          getShadowStyle(isActive, item.color),
          isDark && !isActive && styles.moodItemDark
        ]}
        onPress={() => {
          carouselRef.current?.scrollTo({ index, animated: true });
        }}
        activeOpacity={0.8}
      >
        <Text style={[
          styles.moodEmoji, 
          { fontSize: isActive ? 38 : 30 }
        ]}>
          {item.emoji}
        </Text>
        <Text style={[
          styles.moodLabel,
          { 
            fontSize: isActive ? 16 : 13,
            color: isActive ? item.color : (isDark ? '#fff' : '#666'),
            fontWeight: isActive ? '700' : '500'
          }
        ]}>
          {item.label}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Navigation Container */}
      <View style={styles.carouselContainer}>
        {/* Left Chevron */}
        <IconButton
          icon="chevron-left"
          size={28}
          onPress={scrollToPrevious}
          disabled={activeIndex === 0}
          style={[
            styles.chevron,
            { opacity: activeIndex === 0 ? 0.3 : 1 }
          ]}
          iconColor={isDark ? '#fff' : '#666'}
        />

        {/* Carousel */}
        <View style={styles.carouselWrapper}>
          <Carousel
            ref={carouselRef}
            width={ITEM_WIDTH}
            height={120}
            style={styles.carousel}
            data={MOODS}
            onSnapToItem={handleSnapToItem}
            renderItem={renderMoodItem}
            defaultIndex={Math.max(0, currentIndex)}
            // Basic configuration - no custom animations
            scrollAnimationDuration={500}
            enabled={true}
            loop={false}
            // Use built-in parallax mode safely
            mode="parallax"
            modeConfig={{
              parallaxScrollingScale: 0.85,
              parallaxScrollingOffset: 30,
            }}
          />
        </View>

        {/* Right Chevron */}
        <IconButton
          icon="chevron-right"
          size={28}
          onPress={scrollToNext}
          disabled={activeIndex === MOODS.length - 1}
          style={[
            styles.chevron,
            { opacity: activeIndex === MOODS.length - 1 ? 0.3 : 1 }
          ]}
          iconColor={isDark ? '#fff' : '#666'}
        />
      </View>
      
      {/* Indicators */}
      <View style={styles.indicatorContainer}>
        {MOODS.map((mood, index) => (
          <TouchableOpacity
            key={index}
            onPress={() => {
              carouselRef.current?.scrollTo({ index, animated: true });
            }}
            style={[
              styles.indicator,
              {
                backgroundColor: index === activeIndex 
                  ? MOODS[activeIndex].color 
                  : (isDark ? '#555' : '#ddd'),
                width: index === activeIndex ? 16 : 8,
                height: index === activeIndex ? 8 : 6,
              }
            ]}
          />
        ))}
      </View>

      {/* Current Selection Display */}
      <View style={styles.selectionDisplay}>
        <Text style={[
          styles.selectionText,
          { color: MOODS[activeIndex].color }
        ]}>
          {MOODS[activeIndex].emoji} {MOODS[activeIndex].label}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 180,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 15,
  },
  carouselContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 130,
    width: '100%',
    justifyContent: 'center',
  },
  chevron: {
    margin: 0,
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: 20,
  },
  carouselWrapper: {
    width: CAROUSEL_WIDTH,
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
  },
  carousel: {
    width: CAROUSEL_WIDTH,
    justifyContent: 'center',
  },
  moodItem: {
    height: 110,
    width: ITEM_WIDTH - 25,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 10,
    backgroundColor: '#f8f9fa',
    marginHorizontal: 5,
  },
  moodItemDark: {
    backgroundColor: '#333',
  },
  moodEmoji: {
    marginBottom: 8,
    textAlign: 'center',
  },
  moodLabel: {
    textAlign: 'center',
    textTransform: 'capitalize',
    lineHeight: 20,
  },
  indicatorContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
    height: 12,
  },
  indicator: {
    borderRadius: 8,
    marginHorizontal: 4,
    backgroundColor: '#ddd',
  },
  selectionDisplay: {
    marginTop: 8,
    paddingHorizontal: 16,
    paddingVertical: 6,
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: 20,
  },
  selectionText: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
});