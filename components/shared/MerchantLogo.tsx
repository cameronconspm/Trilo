import React, { useState } from 'react';
import { View, Image, StyleSheet, Text } from 'react-native';
import { useThemeColors } from '@/constants/colors';
import { useSettings } from '@/context/SettingsContext';
import { Spacing, BorderRadius } from '@/constants/spacing';
import categories from '@/constants/categories';

interface MerchantLogoProps {
  logoUrl?: string | null;
  merchantName?: string;
  category?: string;
  size?: number;
}

// Helper function to get category emoji/icon
const getCategoryIcon = (category?: string): string => {
  const iconMap: { [key: string]: string } = {
    'Food and Drink': '🍽️',
    'Transportation': '🚗',
    'Shopping': '🛒',
    'Entertainment': '🎬',
    'Healthcare': '🏥',
    'Travel': '✈️',
    'Gas Stations': '⛽',
    'Groceries': '🛍️',
    'Restaurants': '🍕',
    'Coffee Shops': '☕',
    'Banks': '🏦',
    'ATM': '💳',
    'Deposit': '💰',
    'Income': '💵',
  };
  
  // Try to find category in our categories list
  if (category) {
    const categoryInfo = categories.find(c => c.id === category || c.name === category);
    if (categoryInfo?.icon) {
      return categoryInfo.icon;
    }
    
    // Try direct match
    if (iconMap[category]) {
      return iconMap[category];
    }
  }
  
  return '💳'; // Default icon
};

// Helper function to get initials from merchant name
const getInitials = (name?: string): string => {
  if (!name) return '?';
  
  // Remove common prefixes/suffixes
  const cleanName = name
    .replace(/^(THE|A|AN)\s+/i, '')
    .replace(/\s+(INC|LLC|CORP|LTD|CO)\.?$/i, '')
    .trim();
  
  // Get first letter of each word (max 2 letters)
  const words = cleanName.split(/\s+/).filter(w => w.length > 0);
  if (words.length === 0) return '?';
  
  if (words.length === 1) {
    return cleanName.substring(0, 2).toUpperCase();
  }
  
  return (words[0][0] + words[1][0]).toUpperCase();
};

export default function MerchantLogo({
  logoUrl,
  merchantName,
  category,
  size = 44,
}: MerchantLogoProps) {
  const { theme } = useSettings();
  const colors = useThemeColors(theme);
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);

  // If we have a logo URL and no error, try to load it
  if (logoUrl && !imageError) {
    return (
      <View
        style={[
          styles.container,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: colors.card,
          },
        ]}
      >
        <Image
          source={{ uri: logoUrl }}
          style={[
            styles.image,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
            },
          ]}
          onError={() => {
            setImageError(true);
            setImageLoading(false);
          }}
          onLoad={() => setImageLoading(false)}
          resizeMode="cover"
        />
        {imageLoading && (
          <View
            style={[
              styles.placeholder,
              {
                width: size,
                height: size,
                borderRadius: size / 2,
                backgroundColor: colors.background,
              },
            ]}
          />
        )}
      </View>
    );
  }

  // Fallback: Show initials or category icon
  const fallbackContent = imageError && merchantName
    ? getInitials(merchantName)
    : getCategoryIcon(category);

  return (
    <View
      style={[
        styles.container,
        styles.fallbackContainer,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: category
            ? categories.find(c => c.id === category || c.name === category)?.color || colors.primary
            : colors.primary,
        },
      ]}
    >
      {typeof fallbackContent === 'string' && fallbackContent.length <= 2 ? (
        // Show initials
        <Text
          style={[
            styles.initials,
            {
              fontSize: size * 0.4,
              color: colors.surface,
            },
          ]}
        >
          {fallbackContent}
        </Text>
      ) : (
        // Show emoji/icon
        <Text
          style={[
            styles.emoji,
            {
              fontSize: size * 0.5,
            },
          ]}
        >
          {fallbackContent}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  image: {
    backgroundColor: 'transparent',
  },
  placeholder: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  fallbackContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  initials: {
    fontWeight: '600',
    textAlign: 'center',
  },
  emoji: {
    textAlign: 'center',
  },
});


