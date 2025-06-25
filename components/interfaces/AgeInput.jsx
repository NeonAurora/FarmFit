// components/interfaces/AgeInput.jsx
import React, { useState, useCallback, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import Slider from '@react-native-community/slider';
import { ThemedView } from '@/components/themes/ThemedView';
import { ThemedText } from '@/components/themes/ThemedText';
import { ThemedCard } from '@/components/themes/ThemedCard';
import { useTheme } from '@/contexts/ThemeContext';
import { useInputColors } from '@/hooks/useThemeColor';
import { BrandColors } from '@/constants/Colors';

export default function AgeInput({ 
  value = '', 
  onAgeChange, 
  maxYears = 20,
  style 
}) {
  const { colors, isDark } = useTheme();
  const inputColors = useInputColors();
  
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
  
  return (
    <ThemedView style={[styles.container, style]}>
      {/* Years Slider */}
      <ThemedCard variant="elevated" style={styles.sliderCard}>
        <View style={styles.cardContent}>
          <View style={styles.sliderHeader}>
            <ThemedText style={styles.label}>Years</ThemedText>
            <View style={[
              styles.valueIndicator, 
              { backgroundColor: BrandColors.primary }
            ]}>
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
            minimumTrackTintColor={BrandColors.primary}
            maximumTrackTintColor={colors.border}
            thumbStyle={[
              styles.thumbStyle, 
              { backgroundColor: BrandColors.primary }
            ]}
            trackStyle={styles.trackStyle}
          />
          
          <View style={styles.scaleContainer}>
            <ThemedText style={[styles.scaleText, { color: colors.textSecondary }]}>
              0
            </ThemedText>
            <ThemedText style={[styles.scaleText, { color: colors.textSecondary }]}>
              {maxYears}
            </ThemedText>
          </View>
        </View>
      </ThemedCard>
      
      {/* Months Slider */}
      <ThemedCard variant="elevated" style={styles.sliderCard}>
        <View style={styles.cardContent}>
          <View style={styles.sliderHeader}>
            <ThemedText style={styles.label}>Months</ThemedText>
            <View style={[
              styles.valueIndicator, 
              { backgroundColor: BrandColors.primary }
            ]}>
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
            minimumTrackTintColor={BrandColors.primary}
            maximumTrackTintColor={colors.border}
            thumbStyle={[
              styles.thumbStyle, 
              { backgroundColor: BrandColors.primary }
            ]}
            trackStyle={styles.trackStyle}
          />
          
          <View style={styles.scaleContainer}>
            <ThemedText style={[styles.scaleText, { color: colors.textSecondary }]}>
              0
            </ThemedText>
            <ThemedText style={[styles.scaleText, { color: colors.textSecondary }]}>
              11
            </ThemedText>
          </View>
        </View>
      </ThemedCard>
      
      {/* Age Display */}
      {(years > 0 || months > 0) && (
        <ThemedCard variant="elevated" style={styles.ageDisplayCard}>
          <View style={[
            styles.ageDisplay, 
            { backgroundColor: BrandColors.primary }
          ]}>
            <ThemedText style={styles.ageText}>
              {formatAgeString(years, months)}
            </ThemedText>
          </View>
        </ThemedCard>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 16,
  },
  sliderCard: {
    elevation: 1,
  },
  cardContent: {
    padding: 20,
  },
  sliderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
  },
  valueIndicator: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    minWidth: 36,
    alignItems: 'center',
  },
  valueText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  slider: {
    width: '100%',
    height: 40,
    marginVertical: 8,
  },
  thumbStyle: {
    width: 20,
    height: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  trackStyle: {
    height: 3,
    borderRadius: 2,
  },
  scaleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  scaleText: {
    fontSize: 12,
    fontWeight: '400',
  },
  ageDisplayCard: {
    elevation: 1,
  },
  ageDisplay: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    margin: 4,
  },
  ageText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});