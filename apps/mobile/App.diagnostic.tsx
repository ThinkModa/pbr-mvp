import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';

// Diagnostic app to test each component individually
export default function DiagnosticApp() {
  const [testResults, setTestResults] = useState<Record<string, string>>({});

  const runTest = async (testName: string, testFn: () => Promise<void> | void) => {
    try {
      await testFn();
      setTestResults(prev => ({ ...prev, [testName]: '✅ PASS' }));
    } catch (error) {
      setTestResults(prev => ({ ...prev, [testName]: `❌ FAIL: ${error.message}` }));
    }
  };

  const testMMKV = () => {
    try {
      const { MMKV } = require('react-native-mmkv');
      const storage = new MMKV({ id: 'test' });
      storage.set('test', 'value');
      const value = storage.getString('test');
      if (value !== 'value') throw new Error('MMKV read/write failed');
    } catch (error) {
      throw new Error(`MMKV test failed: ${error.message}`);
    }
  };

  const testBigList = () => {
    try {
      const BigList = require('react-native-big-list').default;
      if (!BigList) throw new Error('BigList not available');
    } catch (error) {
      throw new Error(`BigList test failed: ${error.message}`);
    }
  };

  const testSupabase = () => {
    try {
      const { supabase } = require('./src/lib/supabase');
      if (!supabase) throw new Error('Supabase client not available');
    } catch (error) {
      throw new Error(`Supabase test failed: ${error.message}`);
    }
  };

  const testAuthContext = () => {
    try {
      const { AuthProvider } = require('./src/contexts/SupabaseAuthContext');
      if (!AuthProvider) throw new Error('AuthProvider not available');
    } catch (error) {
      throw new Error(`AuthContext test failed: ${error.message}`);
    }
  };

  const runAllTests = () => {
    setTestResults({});
    runTest('MMKV Storage', testMMKV);
    runTest('BigList Component', testBigList);
    runTest('Supabase Client', testSupabase);
    runTest('Auth Context', testAuthContext);
  };

  useEffect(() => {
    runAllTests();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>PBR MVP Diagnostic</Text>
      <Text style={styles.subtitle}>Testing critical components...</Text>
      
      <View style={styles.results}>
        {Object.entries(testResults).map(([test, result]) => (
          <Text key={test} style={styles.result}>
            {test}: {result}
          </Text>
        ))}
      </View>

      <TouchableOpacity style={styles.button} onPress={runAllTests}>
        <Text style={styles.buttonText}>Run Tests Again</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FBF6F1',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#265451',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 30,
  },
  results: {
    marginBottom: 30,
  },
  result: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 8,
    fontFamily: 'monospace',
  },
  button: {
    backgroundColor: '#D29507',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

