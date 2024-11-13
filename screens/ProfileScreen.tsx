import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, Image, StyleSheet, ScrollView, FlatList, TouchableOpacity, Dimensions, Alert, Linking, RefreshControl } from 'react-native';
import { Button } from 'react-native-paper';
import { useAuth } from '../auth/AuthContext';
import { getRecentReservations, getParkingBayById, checkCarReservation, updateReservationStatus, cancelUserReservation } from '../database/database';
import { Reservation } from '../entity/Reservation';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import LoadingScreen from './LoadingScreen';

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
    const [pastReservations, setPastReservations] = useState<ReservationWithBayDetails[]>([]);
    const [activeReservations, setActiveReservations] = useState<ReservationWithBayDetails[]>([]);
    const [showMap, setShowMap] = useState(false);
    const [selectedLocation, setSelectedLocation] = useState<{latitude: number, longitude: number} | null>(null);
    const [userLocation, setUserLocation] = useState<{latitude: number, longitude: number} | null>(null);
    const [refreshing, setRefreshing] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [activeReservation, setActiveReservation] = useState<ReservationWithBayDetails | null>(null);

    useEffect(() => {
        if (user) {
            loadRecentActivities();
            getUserLocation();
            checkActiveReservation();
        }
    }, [user]);

    const checkActiveReservation = async () => {
        if (user && user.id) {
            setIsLoading(true);
            const result = await checkCarReservation(user.carPlate);
            if (result.isValid && result.reservation) {
                const parkingBay = await getParkingBayById(result.reservation.parkingBayId);
                setActiveReservation({
                    ...result.reservation,
                    parkingBayName: parkingBay?.title || 'Unknown Location',
                    latitude: parkingBay?.latitude || 0,
                    longitude: parkingBay?.longitude || 0
                });
            } else {
                setActiveReservation(null);
            }
            setIsLoading(false);
        }
    };

    const handleCheckIn = async () => {
        if (activeReservation) {
            setIsLoading(true);
            await updateReservationStatus(activeReservation.id, 'checked-in');
            await checkActiveReservation();
            setIsLoading(false);
        }
    };

    const handleCheckOut = async () => {
        if (activeReservation) {
            setIsLoading(true);
            await updateReservationStatus(activeReservation.id, 'completed');
            await checkActiveReservation();
            setIsLoading(false);
        }
    };

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

            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const past = activitiesWithBayDetails.filter(activity => new Date(activity.startTime) < today);
            const active = activitiesWithBayDetails.filter(activity => new Date(activity.startTime) >= today);

            setPastReservations(past);
            setActiveReservations(active);
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

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await loadRecentActivities();
        await getUserLocation();
        setRefreshing(false);
    }, [user]);

    const handleCancelReservation = async (reservation: ReservationWithBayDetails) => {
        Alert.alert(
            "Cancel Reservation",
            "Are you sure you want to cancel this reservation?",
            [
                { text: "No", style: "cancel" },
                {
                    text: "Yes",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            setIsLoading(true);
                            await cancelUserReservation(reservation.id!);
                            Alert.alert("Success", "Reservation cancelled successfully");
                            await loadRecentActivities();
                            await checkActiveReservation();
                        } catch (error: any) {
                            Alert.alert("Error", error.message || "Failed to cancel reservation");
                        } finally {
                            setIsLoading(false);
                        }
                    }
                }
            ]
        );
    };

    const renderReservationItem = (item: ReservationWithBayDetails, isPast: boolean) => {
        const now = new Date();
        const startTime = new Date(item.startTime);
        const canCancel = !isPast && now < startTime && item.status === 'active';

        return (
            <TouchableOpacity onPress={() => handleActivityPress(item.latitude, item.longitude)}>
                <View style={[styles.activityCard, { backgroundColor: isPast ? COLORS.accent : COLORS.secondary }]}>
                    <Text style={[styles.activityLocation, { color: isPast ? COLORS.text : COLORS.surface }]}>
                        {item.parkingBayName}
                    </Text>
                    <Text style={[styles.activityDate, { color: isPast ? COLORS.text : COLORS.surface }]}>
                        {new Date(item.startTime).toLocaleString()} - {new Date(item.endTime).toLocaleString()}
                    </Text>
                    <Text style={[styles.activityStatus, { color: isPast ? COLORS.text : COLORS.surface }]}>
                        Status: <Text style={item.status === 'active' ? styles.completedStatus : styles.cancelledStatus}>
                            {item.status}
                        </Text>
                    </Text>
                    {canCancel && (
                        <TouchableOpacity 
                            style={styles.cancelButton}
                            onPress={() => handleCancelReservation(item)}
                        >
                            <Text style={styles.cancelButtonText}>Cancel Reservation</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </TouchableOpacity>
        );
    };

    if (isLoading) {
        return <LoadingScreen message="Loading your profile..." />;
    }

    if (!user) {
        return <Text>Loading...</Text>;
    }

    return (
        <View style={{ flex: 1 }}>
            <ScrollView 
                contentContainerStyle={[styles.container, { backgroundColor: COLORS.background }]}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        colors={[COLORS.primary]}
                        tintColor={COLORS.primary}
                    />
                }
            >
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
                            <Text style={styles.statNumber}>{activeReservations.length}</Text>
                            <Text style={styles.statLabel}>Active/Upcoming Reservations</Text>
                        </View>
                    </View>
                </View>

                {activeReservation && (
                    <View style={[styles.activeReservationSection, { backgroundColor: COLORS.surface }]}>
                        <Text style={[styles.sectionTitle, { color: COLORS.primary }]}>Active Reservation</Text>
                        <Text style={styles.activeReservationText}>
                            {activeReservation.parkingBayName}
                        </Text>
                        <Text style={styles.activeReservationText}>
                            {new Date(activeReservation.startTime).toLocaleString()} - {new Date(activeReservation.endTime).toLocaleString()}
                        </Text>
                        <Text style={styles.activeReservationText}>
                            Status: {activeReservation.status}
                        </Text>
                        {activeReservation.status === 'active' && (
                            <Button mode="contained" onPress={handleCheckIn} style={styles.actionButton} color={COLORS.secondary}>
                                Check In
                            </Button>
                        )}
                        {activeReservation.status === 'checked-in' && (
                            <Button mode="contained" onPress={handleCheckOut} style={styles.actionButton} color={COLORS.secondary}>
                                Check Out
                            </Button>
                        )}
                    </View>
                )}

                <View style={[styles.reservationSection, { backgroundColor: COLORS.surface }]}>
                    <Text style={[styles.sectionTitle, { color: COLORS.primary }]}>Active/Upcoming Reservations</Text>
                    <FlatList
                        data={activeReservations}
                        keyExtractor={(item) => item.id?.toString() || ''}
                        renderItem={({ item }) => renderReservationItem(item, false)}
                        scrollEnabled={false}
                        nestedScrollEnabled={true}
                        ListEmptyComponent={<Text style={styles.emptyListText}>No active or upcoming reservations</Text>}
                    />
                </View>

                <View style={[styles.reservationSection, styles.pastReservationSection, { backgroundColor: COLORS.surface }]}>
                    <Text style={[styles.sectionTitle, { color: COLORS.primary }]}>Past Reservations</Text>
                    <FlatList
                        data={pastReservations}
                        keyExtractor={(item) => item.id?.toString() || ''}
                        renderItem={({ item }) => renderReservationItem(item, true)}
                        scrollEnabled={false}
                        nestedScrollEnabled={true}
                        ListEmptyComponent={<Text style={styles.emptyListText}>No past reservations</Text>}
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
    reservationSection: {
        backgroundColor: COLORS.surface,
        padding: 15,
        borderRadius: 10,
        marginBottom: 20,
    },
    pastReservationSection: {
        marginTop: 20, // Add space above the past reservations section
    },
    activityCard: {
        marginBottom: 15,
        padding: 10,
        borderRadius: 8,
    },
    activityLocation: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    activityDate: {
        fontSize: 14,
    },
    activityStatus: {
        fontSize: 14,
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
    activeReservationSection: {
        backgroundColor: '#fff',
        padding: 15,
        borderRadius: 10,
        marginBottom: 20,
    },
    activeReservationText: {
        fontSize: 16,
        marginBottom: 5,
    },
    actionButton: {
        marginTop: 10,
    },
    emptyListText: {
        fontSize: 14,
        color: COLORS.text,
        fontStyle: 'italic',
        textAlign: 'center',
        marginTop: 10,
    },
    cancelButton: {
        backgroundColor: '#FF3B30',
        padding: 8,
        borderRadius: 5,
        marginTop: 8,
        alignSelf: 'flex-start',
    },
    cancelButtonText: {
        color: 'white',
        fontSize: 14,
        fontWeight: 'bold',
    },
});
