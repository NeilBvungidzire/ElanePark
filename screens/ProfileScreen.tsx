import React, { useEffect, useState } from 'react';
import { View, Text, Image, StyleSheet, ScrollView, FlatList, TouchableOpacity, Dimensions, Alert, Linking } from 'react-native';
import { Button } from 'react-native-paper';
import { useAuth } from '../auth/AuthContext';
import { getRecentReservations, getParkingBayById } from '../database/database';
import { Reservation } from '../entity/Reservation';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';

const COLORS = {
  primary: '#4C1D1C',
  secondary: '#8C3330',
  background: '#F5E6E6',
  surface: '#FFFFFF',
  text: '#2C0D0C',
  accent: '#D4A59A',
};

const { width, height } = Dimensions.get('window');
const ASPECT_RATIO = width / height;
const LATITUDE_DELTA = 0.0922;
const LONGITUDE_DELTA = LATITUDE_DELTA * ASPECT_RATIO;

interface ReservationWithBayDetails extends Reservation {
  parkingBayName: string;
  latitude: number;
  longitude: number;
}

export default function ProfileScreen() {
    const { user, signOut } = useAuth();
    const [recentActivities, setRecentActivities] = useState<ReservationWithBayDetails[]>([]);
    const [showMap, setShowMap] = useState(false);
    const [selectedLocation, setSelectedLocation] = useState<{latitude: number, longitude: number} | null>(null);
    const [userLocation, setUserLocation] = useState<{latitude: number, longitude: number} | null>(null);

    useEffect(() => {
        if (user) {
            loadRecentActivities();
            getUserLocation();
        }
    }, [user]);

    const loadRecentActivities = async () => {
        if (user && user.id) {
            const activities = await getRecentReservations(user.id);
            const activitiesWithBayDetails = await Promise.all(activities.map(async (activity) => {
                const parkingBay = await getParkingBayById(activity.parkingBayId);
                return {
                    ...activity,
                    parkingBayName: parkingBay?.title || 'Unknown Location',
                    latitude: parkingBay?.latitude || 0,
                    longitude: parkingBay?.longitude || 0
                };
            }));
            setRecentActivities(activitiesWithBayDetails);
        }
    };

    const getUserLocation = async () => {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
            alert('Permission to access location was denied');
            return;
        }

        let location = await Location.getCurrentPositionAsync({});
        setUserLocation({
            latitude: location.coords.latitude,
            longitude: location.coords.longitude
        });
    };

    const openDirections = async (latitude: number, longitude: number) => {
        const url = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;
        const canOpen = await Linking.canOpenURL(url);
        if (canOpen) {
            await Linking.openURL(url);
        } else {
            Alert.alert("Error", "Unable to open maps for directions");
        }
    };

    const handleActivityPress = (latitude: number, longitude: number) => {
        Alert.alert(
            "View Location",
            "What would you like to do?",
            [
                {
                    text: "Show on Map",
                    onPress: () => {
                        setSelectedLocation({ latitude, longitude });
                        setShowMap(true);
                    }
                },
                {
                    text: "Get Directions",
                    onPress: () => openDirections(latitude, longitude)
                },
                {
                    text: "Cancel",
                    style: "cancel"
                }
            ]
        );
    };

    const closeMap = () => {
        setShowMap(false);
        setSelectedLocation(null);
    };

    if (!user) {
        return <Text>Loading...</Text>;
    }

    return (
        <View style={{ flex: 1 }}>
            <ScrollView contentContainerStyle={[styles.container, { backgroundColor: COLORS.background }]}>
                <View style={[styles.profileSection, { backgroundColor: COLORS.surface }]}>
                    <Image source={{ uri: 'https://via.placeholder.com/150' }} style={styles.profileImage} />
                    <View style={styles.userInfo}>
                        <Text style={styles.userName}>{user.fullName}</Text>
                        <Text style={styles.userEmail}>{user.email}</Text>
                        <Button mode="contained" style={styles.editProfileButton} onPress={() => alert('Edit Profile')} color={COLORS.secondary}>
                            Edit Profile
                        </Button>
                    </View>
                </View>

                <View style={[styles.statsSection, { backgroundColor: COLORS.surface }]}>
                    <Text style={[styles.sectionTitle, { color: COLORS.primary }]}>Your Stats</Text>
                    <View style={styles.statsContainer}>
                        <View style={styles.statBox}>
                            <Text style={styles.statNumber}>{user.loyaltyPoints}</Text>
                            <Text style={styles.statLabel}>Loyalty Points</Text>
                        </View>
                        <View style={styles.statBox}>
                            <Text style={styles.statNumber}>{recentActivities.length}</Text>
                            <Text style={styles.statLabel}>Recent Reservations</Text>
                        </View>
                    </View>
                </View>

                <View style={[styles.recentActivitySection, { backgroundColor: COLORS.surface }]}>
                    <Text style={[styles.sectionTitle, { color: COLORS.primary }]}>Recent Activity</Text>
                    <FlatList
                        data={recentActivities}
                        keyExtractor={(item) => item.id?.toString() || ''}
                        renderItem={({ item }) => (
                            <TouchableOpacity onPress={() => handleActivityPress(item.latitude, item.longitude)}>
                                <View style={[styles.activityCard, { backgroundColor: COLORS.accent }]}>
                                    <Text style={styles.activityLocation}>{item.parkingBayName}</Text>
                                    <Text style={styles.activityDate}>
                                        {new Date(item.startTime).toLocaleString()} - {new Date(item.endTime).toLocaleString()}
                                    </Text>
                                    <Text style={[styles.activityStatus, { color: COLORS.text }]}>
                                        Status: <Text style={item.status === 'active' ? styles.completedStatus : styles.cancelledStatus}>
                                        {item.status}
                                    </Text>
                                    </Text>
                                </View>
                            </TouchableOpacity>
                        )}
                        scrollEnabled={false}
                        nestedScrollEnabled={true}
                    />
                </View>

                <Button mode="contained" onPress={signOut} style={styles.signOutButton} color={COLORS.primary}>
                    Sign Out
                </Button>
            </ScrollView>
            {showMap && selectedLocation && userLocation && (
                <View style={StyleSheet.absoluteFillObject}>
                    <MapView
                        style={StyleSheet.absoluteFillObject}
                        initialRegion={{
                            ...selectedLocation,
                            latitudeDelta: LATITUDE_DELTA,
                            longitudeDelta: LONGITUDE_DELTA,
                        }}
                    >
                        <Marker coordinate={userLocation} title="You are here" />
                        <Marker coordinate={selectedLocation} title="Parking Bay" />
                    </MapView>
                    <Button mode="contained" onPress={closeMap} style={styles.closeMapButton} color={COLORS.primary}>
                        Close Map
                    </Button>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        padding: 20,
        flexGrow: 1,
    },
    profileSection: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
        backgroundColor: '#fff',
        padding: 15,
        borderRadius: 10,
    },
    profileImage: {
        width: 80,
        height: 80,
        borderRadius: 40,
        marginRight: 15,
    },
    userInfo: {
        flex: 1,
    },
    userName: {
        fontSize: 22,
        fontWeight: 'bold',
        marginBottom: 5,
    },
    userEmail: {
        fontSize: 16,
        color: '#666',
    },
    editProfileButton: {
        marginTop: 10,
        alignSelf: 'flex-start',
    },
    statsSection: {
        backgroundColor: '#fff',
        padding: 15,
        borderRadius: 10,
        marginBottom: 20,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 15,
    },
    statsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    statBox: {
        alignItems: 'center',
    },
    statNumber: {
        fontSize: 24,
        fontWeight: 'bold',
    },
    statLabel: {
        fontSize: 14,
        color: '#666',
        marginTop: 5,
    },
    recentActivitySection: {
        backgroundColor: '#fff',
        padding: 15,
        borderRadius: 10,
    },
    activityCard: {
        marginBottom: 15,
        backgroundColor: '#e0f7fa',
        padding: 10,
        borderRadius: 8,
    },
    activityLocation: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    activityDate: {
        fontSize: 14,
        color: '#666',
    },
    activityStatus: {
        fontSize: 14,
        color: '#666',
    },
    completedStatus: {
        color: '#4CAF50',
    },
    cancelledStatus: {
        color: '#F44336',
    },
    signOutButton: {
        marginTop: 20,
    },
    closeMapButton: {
        position: 'absolute',
        top: 40,
        right: 20,
    },
});
