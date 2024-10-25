import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, ScrollView, RefreshControl } from 'react-native';
import { checkCarReservation } from '../database/database';
import { useAuth } from '../auth/AuthContext';
import { Reservation } from '../entity/Reservation';
import LoadingScreen from './LoadingScreen';

export default function CheckParking() {
  const { user } = useAuth();
  const [carPlate, setCarPlate] = useState('');
  const [checkResult, setCheckResult] = useState<{ isValid: boolean; reservation?: Reservation } | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleCheckReservation = async () => {
    if (!carPlate) {
      Alert.alert('Error', 'Please enter a car plate number');
      return;
    }

    setIsLoading(true);
    try {
      const result = await checkCarReservation(carPlate);
      setCheckResult(result);

      if (result.isValid) {
        Alert.alert('Valid Reservation', 'This car has a valid parking reservation.');
      } else {
        Alert.alert('No Reservation', 'No valid reservation found for this car plate.');
      }
    } catch (error) {
      console.error('Error checking reservation:', error);
      Alert.alert('Error', 'Failed to check reservation. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    setCarPlate('');
    setCheckResult(null);
    setRefreshing(false);
  }, []);

  if (isLoading) {
    return <LoadingScreen message="Checking reservation..." />;
  }

  return (
    <ScrollView 
      contentContainerStyle={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={['#4C1D1C']} 
        />
      }
    >
      <View style={styles.contentContainer}>
        <Text style={styles.title}>Check Parking Reservation</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter Car Plate Number"
          value={carPlate}
          onChangeText={setCarPlate}
          autoCapitalize="characters"
        />
        <TouchableOpacity style={styles.button} onPress={handleCheckReservation}>
          <Text style={styles.buttonText}>Check Reservation</Text>
        </TouchableOpacity>

        {checkResult && (
          <View style={styles.resultContainer}>
            <Text style={styles.resultText}>
              Status: {checkResult.isValid ? 'Valid Reservation' : 'No Valid Reservation'}
            </Text>
            {checkResult.reservation && (
              <>
                <Text style={styles.resultText}>Parking Bay: {checkResult.reservation.parkingBayId}</Text>
                <Text style={styles.resultText}>Start Time: {new Date(checkResult.reservation.startTime).toLocaleString()}</Text>
                <Text style={styles.resultText}>End Time: {new Date(checkResult.reservation.endTime).toLocaleString()}</Text>
              </>
            )}
          </View>
        )}
      </View>
      <View style={styles.footer}>
        <Text style={styles.footerText}>© 2024 Built by Elaine Foroma</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
  },
  contentContainer: {
    padding: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 30,
    textAlign: 'center',
    color: '#333',
  },
  input: {
    height: 50,
    borderColor: '#ccc',
    borderWidth: 1,
    marginBottom: 25,
    paddingHorizontal: 15,
    borderRadius: 8,
    fontSize: 16,
    width: '100%',
    backgroundColor: 'white',
  },
  button: {
    backgroundColor: '#4C1D1C',
    padding: 15,
    borderRadius: 8,
    width: '100%',
    marginBottom: 25,
  },
  buttonText: {
    color: 'white',
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: 18,
  },
  resultContainer: {
    marginTop: 10,
    padding: 20,
    backgroundColor: 'white',
    borderRadius: 8,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  resultText: {
    fontSize: 16,
    marginBottom: 10,
    color: '#333',
  },
  footer: {
    position: 'absolute',
    bottom: 10,
    alignSelf: 'center',
    fontSize: 12,
    color: '#fff',
  },
  footerText: {
    color: 'white',
    fontSize: 14,
  },
});
