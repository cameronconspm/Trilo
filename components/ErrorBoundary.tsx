import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  context?: string; // For identifying which part of the app failed
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
  errorCount: number;
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, errorCount: 0 };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const { context } = this.props;
    const contextLabel = context ? `[${context}]` : '[App]';
    
    // Enhanced error logging with context and categorization
    console.error(`${contextLabel} ErrorBoundary caught an error:`, {
      message: error.message,
      name: error.name,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      errorCount: this.state.errorCount + 1,
    });
    
    // Log to Metro console for debugging
    console.group(`${contextLabel} Error Details`);
    console.error('Error:', error);
    console.error('Error Stack:', error.stack);
    console.error('Component Stack:', errorInfo.componentStack);
    console.error('Error Count:', this.state.errorCount + 1);
    console.groupEnd();
    
    // Update state with error details
    this.setState(prevState => ({
      error,
      errorInfo,
      errorCount: prevState.errorCount + 1,
    }));
  }

  handleRetry = () => {
    // Reset the error state to attempt re-mounting
    this.setState({ 
      hasError: false, 
      error: undefined, 
      errorInfo: undefined 
    });
  };

  handleReportError = () => {
    const { error, errorInfo, errorCount } = this.state;
    const { context } = this.props;
    
    // Log additional debugging info
    console.group('Error Report for Developer');
    console.log('Context:', context || 'App Root');
    console.log('Error Count:', errorCount);
    console.log('Error:', error);
    console.log('Component Stack:', errorInfo?.componentStack);
    console.log('Timestamp:', new Date().toISOString());
    console.groupEnd();
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default fallback UI
      return (
        <DefaultFallback 
          onRetry={this.handleRetry}
          onReportError={this.handleReportError}
          error={this.state.error}
          errorInfo={this.state.errorInfo}
          context={this.props.context}
          errorCount={this.state.errorCount}
        />
      );
    }

    return this.props.children;
  }
}

// Enhanced default fallback component
function DefaultFallback({ 
  onRetry, 
  onReportError, 
  error, 
  errorInfo, 
  context, 
  errorCount 
}: { 
  onRetry: () => void;
  onReportError: () => void;
  error?: Error;
  errorInfo?: ErrorInfo;
  context?: string;
  errorCount: number;
}) {
  const colors = {
    background: '#FFFFFF',
    text: '#000000',
    primary: '#007AFF',
    secondary: '#5856D6',
    border: '#E0E0E0',
    error: '#FF3B30',
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.content}>
          <Text style={[styles.title, { color: colors.text }]}>
            App failed to load
          </Text>
          
          {context && (
            <Text style={[styles.context, { color: colors.text }]}>
              Failed in: {context}
            </Text>
          )}
          
          <Text style={[styles.subtitle, { color: colors.text }]}>
            See console for details
          </Text>
          
          {errorCount > 1 && (
            <Text style={[styles.errorCount, { color: colors.error }]}>
              This is error #{errorCount}
            </Text>
          )}
          
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.retryButton, { backgroundColor: colors.primary }]}
              onPress={onRetry}
              activeOpacity={0.7}
            >
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.reportButton, { backgroundColor: colors.secondary }]}
              onPress={onReportError}
              activeOpacity={0.7}
            >
              <Text style={styles.reportButtonText}>Report Error</Text>
            </TouchableOpacity>
          </View>
          
          <Text style={[styles.consoleNote, { color: colors.text }]}>
            Check Metro console for error details
          </Text>
          
          {__DEV__ && error && (
            <View style={[styles.debugInfo, { borderColor: colors.border }]}>
              <Text style={[styles.debugTitle, { color: colors.text }]}>
                Debug Info (Dev Mode)
              </Text>
              <Text style={[styles.debugText, { color: colors.text }]}>
                {error.name}: {error.message}
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  content: {
    alignItems: 'center',
    maxWidth: 350,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  context: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
    textAlign: 'center',
    opacity: 0.8,
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 16,
    textAlign: 'center',
    opacity: 0.7,
  },
  errorCount: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 24,
    textAlign: 'center',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  retryButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    minWidth: 80,
  },
  reportButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    minWidth: 80,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  reportButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  consoleNote: {
    fontSize: 12,
    textAlign: 'center',
    opacity: 0.5,
    fontStyle: 'italic',
    marginBottom: 16,
  },
  debugInfo: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    width: '100%',
    marginTop: 16,
  },
  debugTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  debugText: {
    fontSize: 12,
    textAlign: 'center',
    opacity: 0.8,
    fontFamily: 'monospace',
  },
});
