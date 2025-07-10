import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView } from 'react-native';
import { Check, ChevronDown } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { Spacing, BorderRadius, Shadow } from '@/constants/spacing';
import { CategoryType } from '@/types/finance';
import categories from '@/constants/categories';

interface CategoryPickerProps {
  selectedCategory: CategoryType;
  onCategorySelect: (category: CategoryType) => void;
  excludeCategories?: CategoryType[];
  label?: string;
}

export default function CategoryPicker({
  selectedCategory,
  onCategorySelect,
  excludeCategories = [],
  label = "Category",
}: CategoryPickerProps) {
  const [isVisible, setIsVisible] = useState(false);
  
  const availableCategories = categories.filter(
    category => !excludeCategories.includes(category.id)
  );
  
  const selectedCategoryInfo = categories.find(c => c.id === selectedCategory) || categories[0];
  
  const handleSelect = (category: CategoryType) => {
    onCategorySelect(category);
    setIsVisible(false);
  };
  
  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      
      <TouchableOpacity
        style={styles.picker}
        onPress={() => setIsVisible(true)}
        activeOpacity={0.8}
      >
        <View style={styles.selectedOption}>
          <View style={[styles.colorDot, { backgroundColor: selectedCategoryInfo.color }]} />
          <Text style={styles.selectedText}>{selectedCategoryInfo.name}</Text>
        </View>
        <ChevronDown size={20} color={Colors.inactive} />
      </TouchableOpacity>
      
      <Modal
        visible={isVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsVisible(false)}
      >
        <TouchableOpacity
          style={styles.overlay}
          activeOpacity={1}
          onPress={() => setIsVisible(false)}
        >
          <View style={styles.modal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Category</Text>
            </View>
            
            <ScrollView style={styles.optionsList} showsVerticalScrollIndicator={false}>
              {availableCategories.map((category) => (
                <TouchableOpacity
                  key={category.id}
                  style={[
                    styles.option,
                    selectedCategory === category.id && styles.selectedOptionStyle
                  ]}
                  onPress={() => handleSelect(category.id)}
                  activeOpacity={0.7}
                >
                  <View style={styles.optionContent}>
                    <View style={[styles.colorDot, { backgroundColor: category.color }]} />
                    <Text style={[
                      styles.optionText,
                      selectedCategory === category.id && styles.selectedOptionText
                    ]}>
                      {category.name}
                    </Text>
                  </View>
                  {selectedCategory === category.id && (
                    <Check size={20} color={Colors.primary} strokeWidth={2.5} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.lg,
  },
  label: {
    fontSize: 17,
    fontWeight: '600',
    marginBottom: Spacing.md,
    color: Colors.text,
    letterSpacing: -0.2,
  },
  picker: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadow.light,
  },
  selectedOption: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  colorDot: {
    width: 12,
    height: 12,
    borderRadius: BorderRadius.full,
    marginRight: Spacing.md,
  },
  selectedText: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.text,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  modal: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.xxl,
    width: '100%',
    maxHeight: '70%',
    ...Shadow.heavy,
  },
  modalHeader: {
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    letterSpacing: -0.3,
  },
  optionsList: {
    maxHeight: 400,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  selectedOptionStyle: {
    backgroundColor: Colors.cardSecondary,
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  optionText: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.text,
  },
  selectedOptionText: {
    color: Colors.primary,
    fontWeight: '600',
  },
});