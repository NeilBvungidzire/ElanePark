import React, { useEffect } from 'react';
import 'reflect-metadata';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View } from 'react-native';
import MainStackNavigator from './navigation/AppNavigator';
import { AuthProvider } from './auth/AuthContext';
import { initializeDatabase } from './database/database';

export default function App() {
  useEffect(() => {
    initializeDatabase().catch(console.error);
  }, []);

  return (
    <AuthProvider>
      <View style={styles.container}>
        <MainStackNavigator />
        <StatusBar style="auto" />
      </View>
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
});
