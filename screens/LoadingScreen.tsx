import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface LoadingScreenProps {
  message?: string;
}

export default function LoadingScreen({ message = "Finding your perfect spot..." }: LoadingScreenProps) {
  const carAnimation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(carAnimation, {
          toValue: 1,
          duration: 1000,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
        Animated.timing(carAnimation, {
          toValue: 0,
          duration: 1000,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const carStyle = {
    transform: [
      {
        translateY: carAnimation.interpolate({
          inputRange: [0, 1],
          outputRange: [0, 10],
        }),
      },
    ],
  };

  return (
    <View style={styles.container}>
      <Animated.View style={carStyle}>
        <Ionicons name="car" size={64} color="#4A0E4E" />
      </Animated.View>
      <View style={styles.parkingLot}>
        <View style={styles.parkingSpace} />
        <View style={styles.parkingSpace} />
        <View style={styles.parkingSpace} />
      </View>
      <Text style={styles.text}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  text: {
    marginTop: 20,
    fontSize: 18,
    color: '#4A0E4E',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  parkingLot: {
    flexDirection: 'row',
    marginTop: 20,
  },
  parkingSpace: {
    width: 40,
    height: 60,
    borderWidth: 2,
    borderColor: '#4A0E4E',
    marginHorizontal: 5,
  },
});
