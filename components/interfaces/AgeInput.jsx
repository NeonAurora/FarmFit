
// components/interfaces/AgeInput.jsx
import React, { useState, useCallback, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import Slider from '@react-native-community/slider';
import { ThemedView } from '@/components/themes/ThemedView';
import { ThemedText } from '@/components/themes/ThemedText';
import { useColorScheme } from '@/hooks/useColorScheme.native';

export default function AgeInput({ 
  value = '', 
  onAgeChange, 
  maxYears = 20,
  style 
}) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  
  const [years, setYears] = useState(0);
  const [months, setMonths] = useState(0);
  
  // Parse initial value
  useEffect(() => {
    if (value) {
      const yearMatch = value.match(/(\d+)\s*years?/);
      const monthMatch = value.match(/(\d+)\s*months?/);
      
      const initialYears = yearMatch ? parseInt(yearMatch[1]) : 0;
      const initialMonths = monthMatch ? parseInt(monthMatch[1]) : 0;
      
      setYears(initialYears);
      setMonths(initialMonths);
    }
  }, [value]);
  
  // Format age string
  const formatAgeString = useCallback((y, m) => {
    if (y === 0 && m === 0) return '';
    if (y === 0) return m === 1 ? '1 month' : `${m} months`;
    if (m === 0) return y === 1 ? '1 year' : `${y} years`;
    
    const yearStr = y === 1 ? '1 year' : `${y} years`;
    const monthStr = m === 1 ? '1 month' : `${m} months`;
    return `${yearStr} ${monthStr}`;
  }, []);
  
  // Update age callback
  const updateAge = useCallback((newYears, newMonths) => {
    const ageString = formatAgeString(newYears, newMonths);
    onAgeChange?.(ageString, newYears, newMonths);
  }, [formatAgeString, onAgeChange]);
  
  // Handle years change
  const handleYearsChange = useCallback((value) => {
    const newYears = Math.round(value);
    setYears(newYears);
    updateAge(newYears, months);
  }, [months, updateAge]);
  
  // Handle months change
  const handleMonthsChange = useCallback((value) => {
    const newMonths = Math.round(value);
    setMonths(newMonths);
    updateAge(years, newMonths);
  }, [years, updateAge]);
  
  // Theme colors
  const colors = {
    primary: '#7B68EE',
    track: isDark ? '#3C3C3E' : '#E5E5EA',
    thumb: '#7B68EE',
    text: isDark ? '#FFFFFF' : '#000000',
    label: isDark ? '#8E8E93' : '#6D6D70',
    background: isDark ? '#1C1C1E' : '#F2F2F7',
    cardBackground: isDark ? '#2C2C2E' : '#FFFFFF',
  };
  
  return (
    <ThemedView style={[styles.container, style]}>
      {/* Years Slider */}
      <View style={[styles.sliderCard, { backgroundColor: colors.cardBackground }]}>
        <View style={styles.sliderHeader}>
          <ThemedText style={[styles.label, { color: colors.label }]}>
            Years
          </ThemedText>
          <View style={[styles.valueIndicator, { backgroundColor: colors.primary }]}>
            <Text style={styles.valueText}>{years}</Text>
          </View>
        </View>
        
        <Slider
          style={styles.slider}
          minimumValue={0}
          maximumValue={maxYears}
          value={years}
          onValueChange={handleYearsChange}
          step={1}
          minimumTrackTintColor={colors.primary}
          maximumTrackTintColor={colors.track}
          thumbStyle={[styles.thumbStyle, { backgroundColor: colors.thumb }]}
          trackStyle={styles.trackStyle}
        />
        
        <View style={styles.scaleContainer}>
          <ThemedText style={[styles.scaleText, { color: colors.label }]}>0</ThemedText>
          <ThemedText style={[styles.scaleText, { color: colors.label }]}>{maxYears}</ThemedText>
        </View>
      </View>
      
      {/* Months Slider */}
      <View style={[styles.sliderCard, { backgroundColor: colors.cardBackground }]}>
        <View style={styles.sliderHeader}>
          <ThemedText style={[styles.label, { color: colors.label }]}>
            Months
          </ThemedText>
          <View style={[styles.valueIndicator, { backgroundColor: colors.primary }]}>
            <Text style={styles.valueText}>{months}</Text>
          </View>
        </View>
        
        <Slider
          style={styles.slider}
          minimumValue={0}
          maximumValue={11}
          value={months}
          onValueChange={handleMonthsChange}
          step={1}
          minimumTrackTintColor={colors.primary}
          maximumTrackTintColor={colors.track}
          thumbStyle={[styles.thumbStyle, { backgroundColor: colors.thumb }]}
          trackStyle={styles.trackStyle}
        />
        
        <View style={styles.scaleContainer}>
          <ThemedText style={[styles.scaleText, { color: colors.label }]}>0</ThemedText>
          <ThemedText style={[styles.scaleText, { color: colors.label }]}>11</ThemedText>
        </View>
      </View>
      
      {/* Age Display */}
      {(years > 0 || months > 0) && (
        <View style={[styles.ageDisplay, { backgroundColor: colors.primary }]}>
          <ThemedText style={[styles.ageText, { color: '#FFFFFF' }]}>
            {formatAgeString(years, months)}
          </ThemedText>
        </View>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 16,
  },
  sliderCard: {
    marginBottom: 16,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sliderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
  },
  valueIndicator: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    minWidth: 40,
    alignItems: 'center',
  },
  valueText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  slider: {
    width: '100%',
    height: 40,
    marginVertical: 8,
  },
  thumbStyle: {
    width: 24,
    height: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  trackStyle: {
    height: 4,
    borderRadius: 2,
  },
  scaleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  scaleText: {
    fontSize: 12,
  },
  ageDisplay: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  ageText: {
    fontSize: 18,
    fontWeight: '600',
  },
});