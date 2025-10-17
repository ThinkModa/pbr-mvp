import React, { useState } from 'react';
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
import { AuthProvider, useAuth } from './src/contexts/SupabaseAuthContext';
import AuthScreen from './src/screens/AuthScreen';
import MainApp from './src/components/MainApp';


// App Content Component
const AppContent: React.FC = () => {
  const { user, loading, isConnected, connectionError, testConnection } = useAuth();

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
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
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