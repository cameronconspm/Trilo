import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { ChevronDown, Filter } from 'lucide-react-native';
import { useThemeColors } from '../../constants/colors';
import { useSettings } from '../../context/SettingsContext';

export interface FilterOption {
  value: string;
  label: string;
}

interface FilterDropdownProps {
  options: FilterOption[];
  selectedValue: string;
  onSelect: (value: string) => void;
  isOpen: boolean;
  onToggle: () => void;
  backgroundColor?: string;
}

export const FilterDropdown: React.FC<FilterDropdownProps> = ({
  options,
  selectedValue,
  onSelect,
  isOpen,
  onToggle,
  backgroundColor,
}) => {
  const { theme } = useSettings();
  const colors = useThemeColors(theme);
  const selectedOption = options.find(option => option.value === selectedValue);

  const styles = createStyles(colors);
  
  return (
    <View style={styles.container}>
      <TouchableOpacity
        onPress={onToggle}
        style={[
          styles.filterButton,
          { backgroundColor: backgroundColor || colors.card }
        ]}
        activeOpacity={0.7}
      >
        <Filter size={16} color={colors.textSecondary} strokeWidth={2} />
        <ChevronDown 
          size={12} 
          color={colors.textSecondary} 
          strokeWidth={2}
          style={[styles.chevron, isOpen && styles.chevronRotated]}
        />
      </TouchableOpacity>

      {isOpen && (
        <View style={[styles.dropdown, { backgroundColor: colors.card }]}>
          {options.map((option) => (
            <TouchableOpacity
              key={option.value}
              onPress={() => {
                onSelect(option.value);
                onToggle();
              }}
              style={[
                styles.dropdownItem,
                selectedValue === option.value && styles.dropdownItemSelected
              ]}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.dropdownItemText,
                  { color: selectedValue === option.value ? colors.primary : colors.text },
                  selectedValue === option.value && styles.dropdownItemTextSelected
                ]}
              >
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
};

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    position: 'relative',
    zIndex: 1000,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 6,
    gap: 4,
  },
  chevron: {
    // React Native doesn't support CSS transitions
  },
  chevronRotated: {
    transform: [{ rotate: '180deg' }],
  },
  dropdown: {
    position: 'absolute',
    top: '100%',
    right: 0,
    marginTop: 4,
    borderRadius: 8,
    paddingVertical: 4,
    minWidth: 140,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
    borderWidth: 1,
    borderColor: colors.border,
  },
  dropdownItem: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  dropdownItemSelected: {
    backgroundColor: colors.primary + '10',
  },
  dropdownItemText: {
    fontSize: 14,
    fontWeight: '400',
  },
  dropdownItemTextSelected: {
    fontWeight: '500',
  },
});
