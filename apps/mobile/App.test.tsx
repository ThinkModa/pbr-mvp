import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

// Minimal test app to isolate white screen issue
export default function TestApp() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Test App - If you see this, the basic React Native setup works</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FBF6F1',
  },
  text: {
    fontSize: 18,
    color: '#265451',
    textAlign: 'center',
    padding: 20,
  },
});

