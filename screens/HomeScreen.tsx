import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ScrollView, Dimensions } from 'react-native';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/RootStackParamList';
import { useAuth } from '../auth/AuthContext';
import MapView, { PROVIDER_GOOGLE, Marker } from 'react-native-maps';
import * as Location from 'expo-location';

const { width, height } = Dimensions.get('window');

export default function HomeScreen() {
    const navigation = useNavigation<NavigationProp<RootStackParamList>>();
    const { user } = useAuth();
    const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);

    useEffect(() => {
        (async () => {
            let { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                console.error('Permission to access location was denied');
                return;
            }

            let location = await Location.getCurrentPositionAsync({});
            setUserLocation({
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
            });
        })();
    }, []);

    if (!user) {
        return <Text>Loading...</Text>;
    }

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.header}>
                    <Text style={styles.title}>ElanePark</Text>
                    <Text style={styles.subtitle}>Zimbabwe's E-Parking Solution</Text>
                </View>

                <View style={styles.mapContainer}>
                    {userLocation && (
                        <MapView
                            provider={PROVIDER_GOOGLE}
                            style={styles.map}
                            initialRegion={{
                                latitude: userLocation.latitude,
                                longitude: userLocation.longitude,
                                latitudeDelta: 0.0922,
                                longitudeDelta: 0.0421,
                            }}
                        >
                            <Marker
                                coordinate={{
                                    latitude: userLocation.latitude,
                                    longitude: userLocation.longitude,
                                }}
                                title="You are here"
                            />
                        </MapView>
                    )}
                </View>

                <View style={styles.welcomeContainer}>
                    <Text style={styles.welcomeText}>Welcome, {user.fullName}!</Text>
                    <Text style={styles.loyaltyPoints}>Loyalty Points: {user.loyaltyPoints}</Text>
                </View>

                <TouchableOpacity
                    style={styles.findParkingButton}
                    onPress={() => navigation.navigate('Park')}
                >
                    <Text style={styles.findParkingButtonText}>Find Parking</Text>
                </TouchableOpacity>

                <View style={styles.infoContainer}>
                    <Text style={styles.infoText}>
                        ElanePark makes finding and paying for parking easy. Explore nearby parking spots, reserve in advance, and earn loyalty points with every use!
                    </Text>
                </View>
            </ScrollView>
            <Text style={styles.copyright}>© 2024 Built by Elain Foroma</Text>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5E6D3',
    },
    scrollContent: {
        flexGrow: 1,
        paddingBottom: 20,
    },
    header: {
        alignItems: 'center',
        marginVertical: 20,
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#4A0E4E',
    },
    subtitle: {
        fontSize: 18,
        color: '#89609E',
        marginTop: 5,
    },
    mapContainer: {
        height: height * 0.3,
        marginHorizontal: 20,
        marginBottom: 20,
        borderRadius: 15,
        overflow: 'hidden',
        elevation: 5,
    },
    map: {
        ...StyleSheet.absoluteFillObject,
    },
    welcomeContainer: {
        alignItems: 'center',
        marginBottom: 20,
        backgroundColor: '#FFFFFF',
        padding: 15,
        borderRadius: 10,
        marginHorizontal: 20,
        elevation: 3,
    },
    welcomeText: {
        fontSize: 20,
        color: '#4A0E4E',
        fontWeight: 'bold',
    },
    loyaltyPoints: {
        fontSize: 18,
        color: '#89609E',
        marginTop: 5,
    },
    findParkingButton: {
        backgroundColor: '#4A0E4E',
        paddingVertical: 15,
        paddingHorizontal: 30,
        borderRadius: 25,
        alignSelf: 'center',
        marginVertical: 20,
        elevation: 3,
    },
    findParkingButtonText: {
        color: '#F5E6D3',
        fontSize: 18,
        fontWeight: 'bold',
    },
    infoContainer: {
        backgroundColor: '#FFFFFF',
        padding: 20,
        borderRadius: 10,
        marginHorizontal: 20,
        elevation: 3,
    },
    infoText: {
        fontSize: 16,
        color: '#4A0E4E',
        textAlign: 'center',
        lineHeight: 24,
    },
    copyright: {
        position: 'absolute',
        bottom: 10,
        alignSelf: 'center',
        fontSize: 12,
        color: '#89609E',
    },
});
