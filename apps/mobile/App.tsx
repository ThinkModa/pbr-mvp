import React, { useState, useCallback, useEffect } from 'react';
import {
  SafeAreaView,
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
  AppRegistry,
  FlatList,
} from 'react-native';
// import { PerformanceProfiler, RenderPassReport, LogLevel } from '@shopify/react-native-performance';
import { AuthProvider, useAuth } from './src/contexts/SupabaseAuthContext';
import AuthScreen from './src/screens/AuthScreen';
import MainApp from './src/components/MainApp';
import CacheService from './src/services/cacheService';

// Error Boundary Component
interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('🚨 App Error Boundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <SafeAreaView style={styles.container}>
          <View style={styles.errorContainer}>
            <Text style={styles.errorTitle}>Something went wrong</Text>
            <Text style={styles.errorSubtitle}>The app encountered an unexpected error</Text>
            <TouchableOpacity 
              style={styles.retryButton} 
              onPress={() => this.setState({ hasError: false, error: null })}
            >
              <Text style={styles.retryButtonText}>Restart App</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      );
    }

    return this.props.children;
  }
}


// App Content Component
const AppContent: React.FC = () => {
  const { user, loading, isConnected, connectionError, testConnection } = useAuth();

  // Check for corrupted cache on app start
  useEffect(() => {
    const checkCache = async () => {
      try {
        await CacheService.clearCorruptedCache();
      } catch (error) {
        console.error('Error checking cache on app start:', error);
      }
    };
    
    checkCache();
  }, []);

  // Handle connection errors
  if (connectionError && !loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>{connectionError}</Text>
          <TouchableOpacity 
            style={styles.retryButton} 
            onPress={async () => {
              const connected = await testConnection();
              if (!connected) {
                // Optionally retry after a delay
                setTimeout(testConnection, 2000);
              }
            }}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
          {isConnected === false && connectionError === 'Authentication service unavailable' && (
            <TouchableOpacity 
              style={styles.offlineButton} 
              onPress={() => {
                // Handle offline mode - for now just clear error
                // In future: could load cached data or provide limited functionality
              }}
            >
              <Text style={styles.offlineButtonText}>Continue Offline</Text>
            </TouchableOpacity>
          )}
        </View>
      </SafeAreaView>
    );
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!user) {
    return <AuthScreen onAuthSuccess={() => {}} />;
  }

  return <MainApp />;
};

// Main App Component
export default function App() {
  // const onReportPrepared = useCallback((report: RenderPassReport) => {
  //   // Log performance reports in development
  //   if (__DEV__) {
  //     console.log('🚀 Performance Report:', {
  //       screen: report.destinationScreen,
  //       renderTime: `${report.timeToRenderMillis}ms`,
  //       interactive: report.interactive,
  //       flowInstanceId: report.flowInstanceId
  //     });
  //   }
  //   
  //   // In production, you could send this to analytics
  //   // Example: Analytics.track('performance_report', report);
  // }, []);

  return (
    <ErrorBoundary>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FBF6F1',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 18,
    color: '#265451',
    marginTop: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorTitle: {
    fontSize: 18,
    color: '#933B25',
    marginBottom: 24,
    textAlign: 'center',
  },
  errorSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 24,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#D29507',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  offlineButton: {
    backgroundColor: 'transparent',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D29507',
  },
  offlineButtonText: {
    color: '#D29507',
    fontSize: 16,
    fontWeight: '600',
  },
});

// Register the main component
AppRegistry.registerComponent('main', () => App);