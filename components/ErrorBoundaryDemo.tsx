import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Button from './layout/Button';

interface Props {
  title?: string;
}

// Component that can be made to throw an error
const ThrowErrorComponent: React.FC<{ shouldThrow: boolean }> = ({ shouldThrow }) => {
  if (shouldThrow) {
    throw new Error('This is a test error for ErrorBoundary demo');
  }
  
  return (
    <View style={styles.content}>
      <Text style={styles.text}>✅ Component loaded successfully!</Text>
      <Text style={styles.subtext}>No errors occurred</Text>
    </View>
  );
};

export const ErrorBoundaryDemo: React.FC<Props> = ({ title = 'ErrorBoundary Demo' }) => {
  const [shouldThrow, setShouldThrow] = useState(false);
  const [key, setKey] = useState(0);

  const handleToggleError = () => {
    setShouldThrow(!shouldThrow);
  };

  const handleReset = () => {
    setShouldThrow(false);
    setKey(prev => prev + 1); // Force re-mount
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      
      <View style={styles.buttonContainer}>
        <Button 
          title={shouldThrow ? "Hide Error" : "Show Error"}
          onPress={handleToggleError}
          variant={shouldThrow ? "secondary" : "primary"}
        />
        
        <Button 
          title="Reset Component"
          onPress={handleReset}
          variant="outline"
        />
      </View>

      <View style={styles.demoContainer}>
        <Text style={styles.demoTitle}>Demo Component:</Text>
        <View style={styles.componentWrapper}>
          <ThrowErrorComponent key={key} shouldThrow={shouldThrow} />
        </View>
      </View>

      <View style={styles.instructions}>
        <Text style={styles.instructionTitle}>Instructions:</Text>
        <Text style={styles.instructionText}>
          • Click "Show Error" to make the component throw an error
        </Text>
        <Text style={styles.instructionText}>
          • The ErrorBoundary should catch it and show fallback UI
        </Text>
        <Text style={styles.instructionText}>
          • Click "Reset Component" to re-mount the component
        </Text>
        <Text style={styles.instructionText}>
          • Check the console for error logs
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 20,
    color: '#333',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
    justifyContent: 'center',
  },
  demoContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  demoTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    color: '#333',
  },
  componentWrapper: {
    minHeight: 80,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  content: {
    alignItems: 'center',
    padding: 16,
  },
  text: {
    fontSize: 16,
    fontWeight: '500',
    color: '#28a745',
    marginBottom: 4,
  },
  subtext: {
    fontSize: 14,
    color: '#6c757d',
  },
  instructions: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  instructionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    color: '#333',
  },
  instructionText: {
    fontSize: 14,
    color: '#6c757d',
    marginBottom: 4,
    lineHeight: 20,
  },
});

export default ErrorBoundaryDemo;
