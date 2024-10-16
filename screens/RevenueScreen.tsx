import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function RevenueScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Revenue Dashboard</Text>
      <Text>Revenue information will be displayed here.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
});

