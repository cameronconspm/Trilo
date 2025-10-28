import React, { useRef, useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Easing } from 'react-native';
import { useThemeColors } from '@/constants/colors';
import { useSettings } from '@/context/SettingsContext';
import { Spacing, BorderRadius, Typography, Shadow } from '@/constants/spacing';

export interface ToggleOption {
  id: string;
  label: string;
}

interface ToggleProps {
  options: ToggleOption[];
  activeOption: string;
  onOptionChange: (optionId: string) => void;
  style?: any;
}

export default function Toggle({ 
  options, 
  activeOption, 
  onOptionChange, 
  style 
}: ToggleProps) {
  const { theme } = useSettings();
  const colors = useThemeColors(theme);
  const slideAnimation = useRef(new Animated.Value(0)).current;
  const [containerWidth, setContainerWidth] = useState(0);
  
  // Find the index of the active option
  const activeIndex = options.findIndex(option => option.id === activeOption);
  
  // Calculate segment width based on container width
  const segmentWidth = containerWidth / options.length;
  
  // Animate the sliding pill when active option changes
  useEffect(() => {
    Animated.timing(slideAnimation, {
      toValue: activeIndex,
      duration: 200,
      useNativeDriver: false,
      easing: Easing.out(Easing.cubic),
    }).start();
  }, [activeIndex, slideAnimation]);

  // Handle container layout measurement
  const handleLayout = (event: any) => {
    const { width } = event.nativeEvent.layout;
    setContainerWidth(width);
  };

  return (
    <View 
      style={[
        styles.container, 
        { 
          backgroundColor: colors.card,
          borderColor: colors.border,
          ...Shadow.light,
        },
        style
      ]}
      onLayout={handleLayout}
    >
      {/* Animated background pill */}
      {containerWidth > 0 && (
        <Animated.View
        style={[
          styles.selectedPill,
          {
            backgroundColor: colors.primary,
            width: segmentWidth,
            left: slideAnimation.interpolate({
              inputRange: options.map((_, index) => index),
              outputRange: options.map((_, index) => index * segmentWidth),
              extrapolate: 'clamp',
            }),
          },
        ]}
      />
      )}
      
      {/* Option buttons */}
      {options.map((option, index) => {
        const isActive = activeOption === option.id;
        
        return (
          <TouchableOpacity
            key={option.id}
            style={styles.optionButton}
            onPress={() => onOptionChange(option.id)}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityState={{ selected: isActive }}
            accessibilityLabel={`${option.label} ${isActive ? 'selected' : 'not selected'}`}
          >
            <Text
              style={[
                styles.optionText,
                {
                  color: isActive ? colors.card : colors.textSecondary,
                  fontWeight: isActive ? '600' : '500',
                },
              ]}
            >
              {option.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    borderRadius: 999,
    marginBottom: Spacing.lg,
    position: 'relative',
    minHeight: 44,
    alignItems: 'center',
    borderWidth: 1,
    justifyContent: 'center',
    overflow: 'hidden', // ⬅️ IMPORTANT to prevent pill overflow
  },
  selectedPill: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    borderRadius: 999,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 0,
  },
  optionButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.sm,
    borderRadius: BorderRadius.full,
    zIndex: 1,
    minHeight: 36,
  },
  optionText: {
    ...Typography.bodySmall,
    fontWeight: '500',
    textAlign: 'center',
    fontSize: 15,
    lineHeight: 20,
    letterSpacing: -0.1,
  },
});