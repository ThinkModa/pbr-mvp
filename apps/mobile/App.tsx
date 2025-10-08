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
import { MockAuthProvider, useAuth } from './src/contexts/MockAuthContext';
import AuthScreen from './src/screens/AuthScreen';
import MainApp from './src/components/MainApp';


// App Content Component
const AppContent: React.FC = () => {
  const { user, loading } = useAuth();

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
    <MockAuthProvider>
      <AppContent />
    </MockAuthProvider>
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
});

// Register the main component
AppRegistry.registerComponent('main', () => App);