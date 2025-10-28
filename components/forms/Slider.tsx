import React, { useState, useRef } from 'react';
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
  
  // Local state for immediate UI updates
  const [localValue, setLocalValue] = useState(value);
  
  // Update local value when value changes externally
  React.useEffect(() => {
    setLocalValue(value);
  }, [value]);

  // Simple tap handler for slider positioning
  const handleSliderTap = (event: any) => {
    const { locationX } = event.nativeEvent;
    const newPosition = Math.max(0, Math.min(sliderWidth - 24, locationX - 12));
    const newValue =
      minimumValue +
      (newPosition / (sliderWidth - 24)) * (maximumValue - minimumValue);
    const steppedValue = Math.round(newValue / step) * step;
    const clampedValue = Math.max(
      minimumValue,
      Math.min(maximumValue, steppedValue)
    );

    setLocalValue(clampedValue);
    onValueChange(clampedValue);
  };

  const displayValue = formatValue ? formatValue(localValue) : localValue.toString();

  return (
    <View style={styles.container}>
      {label && (
        <View style={styles.labelContainer}>
          <Text style={[styles.label, { color: colors.text }]}>{label}</Text>
          {showValue && (
            <Text style={[styles.value, { color: colors.primary }]}>
              {displayValue}
            </Text>
          )}
        </View>
      )}

      <View style={styles.sliderWrapper}>
        <TouchableOpacity
          style={[styles.sliderContainer, { backgroundColor: colors.border }]}
          onPress={handleSliderTap}
          onLayout={event => setSliderWidth(event.nativeEvent.layout.width)}
          activeOpacity={1}
        >
          <View
            style={[
              styles.track,
              {
                width: `${((localValue - minimumValue) / (maximumValue - minimumValue)) * 100}%`,
                backgroundColor: colors.primary,
              },
            ]}
          />
          
          <View
            style={[
              styles.thumb,
              {
                backgroundColor: colors.primary,
                left: `${((localValue - minimumValue) / (maximumValue - minimumValue)) * 100}%`,
              },
            ]}
          />
        </TouchableOpacity>
      </View>
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
  sliderWrapper: {
    position: 'relative',
  },
  sliderContainer: {
    height: 4,
    borderRadius: BorderRadius.full,
    position: 'relative',
  },
  track: {
    height: 4,
    borderRadius: BorderRadius.full,
  },
  thumb: {
    position: 'absolute',
    top: -10,
    width: 24,
    height: 24,
    borderRadius: BorderRadius.full,
    borderWidth: 2,
    borderColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
});
