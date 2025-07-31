import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useThemeColors } from '@/constants/colors';
import { useSettings } from '@/context/SettingsContext';
import { Spacing, BorderRadius } from '@/constants/spacing';

interface SliderProps {
  value: number;
  onValueChange: (value: number) => void;
  minimumValue?: number;
  maximumValue?: number;
  step?: number;
  label?: string;
  showValue?: boolean;
  formatValue?: (value: number) => string;
}

export default function Slider({
  value,
  onValueChange,
  minimumValue = 0,
  maximumValue = 100,
  step = 1,
  label,
  showValue = true,
  formatValue,
}: SliderProps) {
  const { theme } = useSettings();
  const colors = useThemeColors(theme);
  const [sliderWidth, setSliderWidth] = useState(0);
  
  const normalizedValue = (value - minimumValue) / (maximumValue - minimumValue);
  const thumbPosition = normalizedValue * (sliderWidth - 24); // 24 is thumb width
  
  const handleSliderPress = (event: any) => {
    const { locationX } = event.nativeEvent;
    const newPosition = Math.max(0, Math.min(sliderWidth - 24, locationX - 12));
    const newValue = minimumValue + (newPosition / (sliderWidth - 24)) * (maximumValue - minimumValue);
    const steppedValue = Math.round(newValue / step) * step;
    const clampedValue = Math.max(minimumValue, Math.min(maximumValue, steppedValue));
    
    onValueChange(clampedValue);
  };
  
  const displayValue = formatValue ? formatValue(value) : value.toString();
  
  return (
    <View style={styles.container}>
      {label && (
        <View style={styles.labelContainer}>
          <Text style={[styles.label, { color: colors.text }]}>{label}</Text>
          {showValue && (
            <Text style={[styles.value, { color: colors.primary }]}>{displayValue}</Text>
          )}
        </View>
      )}
      
      <TouchableOpacity
        style={[styles.sliderContainer, { backgroundColor: colors.border }]}
        onPress={handleSliderPress}
        onLayout={(event) => setSliderWidth(event.nativeEvent.layout.width)}
        activeOpacity={1}
      >
        <View 
          style={[
            styles.track,
            { 
              width: `${normalizedValue * 100}%`,
              backgroundColor: colors.primary 
            }
          ]} 
        />
        
        <View
          style={[
            styles.thumb,
            {
              backgroundColor: colors.primary,
              left: Math.max(0, thumbPosition),
            },
          ]}
        />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: Spacing.md,
  },
  labelContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: -0.1,
    lineHeight: 20,
  },
  value: {
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: -0.1,
    lineHeight: 20,
  },
  sliderContainer: {
    height: 6,
    borderRadius: BorderRadius.sm,
    position: 'relative',
    justifyContent: 'center',
  },
  track: {
    height: 6,
    borderRadius: BorderRadius.sm,
    position: 'absolute',
    left: 0,
    top: 0,
  },
  thumb: {
    width: 24,
    height: 24,
    borderRadius: BorderRadius.full,
    position: 'absolute',
    top: -9, // Center on track
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
});