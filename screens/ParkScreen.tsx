import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, Alert, TextInput, TouchableOpacity, Linking, ScrollView, SafeAreaView, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import MapView, { Marker, Region } from 'react-native-maps';
import * as Location from 'expo-location';
import { getAllParkingBays, ParkingBay as DBParkingBay, getAvailableTimeSlots, createReservation, checkAndLockTimeSlot } from '../database/database';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useAuth } from '../auth/AuthContext';

type ParkingBay = {
    id: number;
    title: string;
    latitude: number;
    longitude: number;
    price: number;
    available: boolean;
};

export default function ParkScreen() {
    const { user } = useAuth();
    const [parkingBays, setParkingBays] = useState<ParkingBay[]>([]);
    const [filteredBays, setFilteredBays] = useState<ParkingBay[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedParking, setSelectedParking] = useState<ParkingBay | null>(null);
    const [userLocation, setUserLocation] = useState<Region | null>(null);
    const [selectedDateTime, setSelectedDateTime] = useState(new Date());
    const [availableSlots, setAvailableSlots] = useState<{ startTime: string, endTime: string }[]>([]);
    const [selectedSlot, setSelectedSlot] = useState<{ startTime: string, endTime: string } | null>(null);
    const [carPlate, setCarPlate] = useState('');
    const [duration, setDuration] = useState(1);
    const [bookingCost, setBookingCost] = useState(0);
    const [paymentStatus, setPaymentStatus] = useState<'pending' | 'processing' | 'completed' | 'failed' | null>(null);
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [showTimePicker, setShowTimePicker] = useState(false);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [phoneNumber, setPhoneNumber] = useState('');

    useEffect(() => {
        fetchParkingBays();
        getUserLocation();
    }, []);

    useEffect(() => {
        const filtered = parkingBays.filter(bay =>
            bay.title.toLowerCase().includes(searchQuery.toLowerCase())
        );
        setFilteredBays(filtered);
    }, [searchQuery, parkingBays]);

    const fetchParkingBays = async () => {
        try {
            setIsLoading(true);
            const dbParkingBays = await getAllParkingBays();
            const formattedBays: ParkingBay[] = dbParkingBays.map((bay: DBParkingBay) => ({
                id: bay.id!,
                title: bay.title,
                latitude: bay.latitude,
                longitude: bay.longitude,
                price: bay.price,
                available: bay.available
            }));
            setParkingBays(formattedBays);
            setFilteredBays(formattedBays);
        } catch (error) {
            Alert.alert("Error", "Unable to fetch parking bays");
        } finally {
            setIsLoading(false);
        }
    };

    const getUserLocation = async () => {
        try {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Permission to access location was denied');
                return;
            }

            const location = await Location.getCurrentPositionAsync({});
            setUserLocation({
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
                latitudeDelta: 0.01,
                longitudeDelta: 0.01,
            });
        } catch (error) {
            Alert.alert("Error", "Unable to get your current location");
        }
    };

    const handleSelectParking = async (parking: ParkingBay) => {
        setSelectedParking(parking);
        await fetchAvailableSlots(parking.id, selectedDateTime);
    };

    const fetchAvailableSlots = async (parkingBayId: number, date: Date) => {
        try {
            const formattedDate = date.toISOString().split('T')[0];
            const slots = await getAvailableTimeSlots(parkingBayId, formattedDate);
            setAvailableSlots(slots);
            if (slots.length > 0) {
                setSelectedSlot(slots[0]);
                handleSlotSelection(slots[0]);
            } else {
                setSelectedSlot(null);
                setDuration(0);
                setBookingCost(0);
            }
        } catch (error) {
            console.error("Error fetching available time slots:", error);
            Alert.alert("Error", "Unable to fetch available time slots");
            setSelectedSlot(null);
            setDuration(0);
            setBookingCost(0);
        }
    };

    const handleSlotSelection = (slot: { startTime: string, endTime: string }) => {
        setSelectedSlot(slot);
        const duration = (new Date(slot.endTime).getTime() - new Date(slot.startTime).getTime()) / (1000 * 60 * 60);
        setDuration(duration);
        calculateBookingCost(selectedDateTime, duration);
    };

    const simulatePayment = async (amount: number): Promise<boolean> => {
        setPaymentStatus('processing');
        return new Promise((resolve) => {
            setTimeout(() => {
                const success = true; 
                setPaymentStatus(success ? 'completed' : 'failed');
                resolve(success);
            }, 2000); 
        });
    };

    const handleBookReservation = async () => {
        if (!user || !user.id) {
            Alert.alert("Error", "You must be logged in to make a reservation");
            return;
        }
        if (!selectedParking || !selectedSlot || !carPlate) {
            Alert.alert("Error", "Please fill in all required fields");
            return;
        }

        setShowPaymentModal(true);
    };

    const processPayment = async () => {
        if (!phoneNumber) {
            Alert.alert("Error", "Please enter a phone number for payment");
            return;
        }

        try {
            setPaymentStatus('processing');
            
            const paymentSuccess = await simulatePayment(bookingCost);
            
            if (paymentSuccess && user && user.id) {
                const reservation = {
                    userId: user.id,
                    parkingBayId: selectedParking!.id,
                    startTime: new Date(selectedSlot!.startTime).toISOString(),
                    endTime: new Date(selectedSlot!.endTime).toISOString(),
                    carPlate: carPlate,
                };

                const result = await createReservation(reservation);
                
                if (typeof result === 'number') {
                    Alert.alert("Success", "Payment successful and reservation created", [
                        { text: "OK", onPress: () => openDirections() }
                    ]);
                } else {
                    throw new Error("Failed to create reservation");
                }
                
                resetBookingState();
            } else {
                Alert.alert("Error", "Payment failed. Please try again.");
            }
        } catch (error: any) {
            console.error("Error creating reservation:", error);
            Alert.alert("Error", error.message || "Unable to process payment or create reservation");
        } finally {
            setPaymentStatus(null);
            setShowPaymentModal(false);
        }
    };

    const openDirections = async () => {
        const url = `https://www.google.com/maps/dir/?api=1&destination=${selectedParking!.latitude},${selectedParking!.longitude}`;
        const canOpen = await Linking.canOpenURL(url);
        if (canOpen) {
            await Linking.openURL(url);
        } else {
            Alert.alert("Error", "Unable to open maps for directions");
        }
    };

    const resetBookingState = () => {
        setSelectedParking(null);
        setSelectedSlot(null);
        setCarPlate('');
        setPhoneNumber('');
        setPaymentStatus(null);
    };

    const handleDateTimeChange = (event: any, selectedDate?: Date) => {
        const currentDate = selectedDate || selectedDateTime;
        setShowDatePicker(false);
        setShowTimePicker(false);
        setSelectedDateTime(currentDate);
        if (selectedParking) {
            fetchAvailableSlots(selectedParking.id, currentDate);
        }
    };

    const calculateBookingCost = (date: Date, hours: number) => {
        if (selectedParking) {
            const cost = hours * selectedParking.price;
            setBookingCost(cost);
        }
    };

    const handleDurationChange = (value: number) => {
        setDuration(value);
        calculateBookingCost(selectedDateTime, value);
    };

    const renderParkingItem = ({ item }: { item: ParkingBay }) => (
        <TouchableOpacity 
            style={[styles.parkingItem, !item.available && styles.unavailableItem]}
            onPress={() => item.available && handleSelectParking(item)}
        >
            <View style={styles.parkingInfo}>
                <Text style={styles.parkingTitle}>{item.title}</Text>
                <Text style={styles.parkingPrice}>Price: ${item.price}</Text>
            </View>
            <View style={styles.parkingStatus}>
                <Ionicons 
                    name={item.available ? "checkmark-circle" : "close-circle"} 
                    size={24} 
                    color={item.available ? "green" : "red"} 
                />
                <Text style={[styles.statusText, { color: item.available ? "green" : "red" }]}>
                    {item.available ? "Available" : "Unavailable"}
                </Text>
            </View>
        </TouchableOpacity>
    );

    if (isLoading) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" color="#4A0E4E" />
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollContent}>
                {selectedParking ? (
                    <View>
                        <Text style={styles.headerText}>Booking Details</Text>
                        <TouchableOpacity 
                            style={styles.dateTimeButton}
                            onPress={() => setShowDatePicker(true)}
                        >
                            <Text style={styles.dateTimeButtonText}>
                                Select Date: {selectedDateTime.toDateString()}
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity 
                            style={styles.dateTimeButton}
                            onPress={() => setShowTimePicker(true)}
                        >
                            <Text style={styles.dateTimeButtonText}>
                                Select Time: {selectedDateTime.toLocaleTimeString()}
                            </Text>
                        </TouchableOpacity>
                        {showDatePicker && (
                            <DateTimePicker
                                value={selectedDateTime}
                                mode="date"
                                display="default"
                                onChange={handleDateTimeChange}
                                minimumDate={new Date()}
                            />
                        )}
                        {showTimePicker && (
                            <DateTimePicker
                                value={selectedDateTime}
                                mode="time"
                                display="default"
                                onChange={handleDateTimeChange}
                            />
                        )}
                        <View style={styles.durationContainer}>
                            <Text style={styles.labelText}>Duration (hours): </Text>
                            <TextInput
                                style={styles.durationInput}
                                keyboardType="numeric"
                                value={duration.toString()}
                                onChangeText={(text) => handleDurationChange(parseInt(text) || 1)}
                            />
                        </View>
                        <TextInput
                            style={styles.input}
                            placeholder="Car Plate Number"
                            value={carPlate}
                            onChangeText={setCarPlate}
                        />
                        <Text style={styles.costText}>Booking Cost: ${bookingCost.toFixed(2)}</Text>
                        {paymentStatus && (
                            <Text style={[styles.paymentStatus, 
                                paymentStatus === 'completed' ? styles.successText : 
                                paymentStatus === 'failed' ? styles.errorText : 
                                styles.processingText]}>
                                Payment Status: {paymentStatus.charAt(0).toUpperCase() + paymentStatus.slice(1)}
                            </Text>
                        )}
                        <TouchableOpacity 
                            style={[styles.bookButton, paymentStatus === 'processing' && styles.disabledButton]} 
                            onPress={handleBookReservation}
                            disabled={paymentStatus === 'processing'}
                        >
                            <Text style={styles.bookButtonText}>
                                {paymentStatus === 'processing' ? 'Processing...' : 'Book and Pay'}
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.backButton}
                            onPress={() => {
                                setSelectedParking(null);
                                setPaymentStatus(null);
                            }}
                        >
                            <Text style={styles.backButtonText}>Back to List</Text>
                        </TouchableOpacity>
                        <FlatList
                            data={availableSlots}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    style={[
                                        styles.slotItem,
                                        selectedSlot && selectedSlot.startTime === item.startTime ? styles.selectedSlot : null
                                    ]}
                                    onPress={() => handleSlotSelection(item)}
                                >
                                    <Text style={styles.slotText}>
                                        {`${new Date(item.startTime).toLocaleTimeString()} - ${new Date(item.endTime).toLocaleTimeString()}`}
                                    </Text>
                                </TouchableOpacity>
                            )}
                            keyExtractor={(item) => item.startTime}
                            ListEmptyComponent={<Text style={styles.emptyText}>No available slots for this date</Text>}
                        />
                    </View>
                ) : (
                    <View>
                        <TextInput
                            style={styles.searchInput}
                            placeholder="Search parking spots..."
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                        />
                        <MapView
                            style={styles.map}
                            region={userLocation || undefined}
                            showsUserLocation={true}
                        >
                            {filteredBays.map((bay) => (
                                <Marker
                                    key={bay.id}
                                    coordinate={{ latitude: bay.latitude, longitude: bay.longitude }}
                                    title={bay.title}
                                    description={`Price: $${bay.price}/hour`}
                                    pinColor={bay.available ? 'green' : 'red'}
                                    onPress={() => bay.available && handleSelectParking(bay)}
                                />
                            ))}
                        </MapView>
                        <FlatList
                            data={filteredBays}
                            renderItem={renderParkingItem}
                            keyExtractor={(item) => item.id.toString()}
                            style={styles.list}
                            ListEmptyComponent={
                                <Text style={styles.emptyText}>No parking bays available</Text>
                            }
                        />
                    </View>
                )}
                
                <Modal
                    visible={showPaymentModal}
                    transparent={true}
                    animationType="slide"
                >
                    <View style={styles.modalContainer}>
                        <View style={styles.modalContent}>
                            <Text style={styles.modalTitle}>Payment Details</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Enter phone number for PayNow"
                                value={phoneNumber}
                                onChangeText={setPhoneNumber}
                                keyboardType="phone-pad"
                            />
                            <Text style={styles.costText}>Amount to pay: ${bookingCost.toFixed(2)}</Text>
                            <TouchableOpacity 
                                style={styles.payButton}
                                onPress={processPayment}
                            >
                                <Text style={styles.payButtonText}>Pay Now</Text>
                            </TouchableOpacity>
                            <TouchableOpacity 
                                style={styles.cancelButton}
                                onPress={() => setShowPaymentModal(false)}
                            >
                                <Text style={styles.cancelButtonText}>Cancel</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </Modal>
            </ScrollView>
            <Text style={styles.copyright}>© 2024 Built by Elaine Foroma</Text>
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
        paddingTop: 60,
        paddingBottom: 20,
        paddingHorizontal: 20,
    },
    headerText: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#4A0E4E',
        marginBottom: 20,
        textAlign: 'center',
    },
    labelText: {
        fontSize: 16,
        color: '#4A0E4E',
        marginRight: 10,
    },
    costText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#89609E',
        marginVertical: 10,
        textAlign: 'center',
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F5E6D3',
    },
    searchInput: {
        height: 50,
        marginVertical: 16,
        borderWidth: 1,
        borderColor: '#89609E',
        padding: 12,
        borderRadius: 25,
        backgroundColor: 'white',
        width: '100%',
        fontSize: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    list: {
        flex: 1,
        width: '100%',
    },
    parkingItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        marginVertical: 8,
        backgroundColor: 'white',
        borderRadius: 12,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    unavailableItem: {
        opacity: 0.6,
    },
    parkingInfo: {
        flex: 1,
    },
    parkingTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 6,
        color: '#4A0E4E',
    },
    parkingPrice: {
        fontSize: 16,
        color: '#89609E',
    },
    parkingStatus: {
        alignItems: 'center',
        marginLeft: 16,
    },
    statusText: {
        marginTop: 4,
        fontSize: 14,
        fontWeight: 'bold',
    },
    emptyText: {
        textAlign: 'center',
        marginTop: 50,
        fontSize: 18,
        color: '#89609E',
    },
    map: {
        height: 200,
        marginVertical: 16,
        width: '100%',
        borderRadius: 12,
        overflow: 'hidden',
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    backButton: {
        backgroundColor: 'white',
        padding: 12,
        borderRadius: 25,
        marginTop: 20,
        alignSelf: 'center',
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    backButtonText: {
        fontWeight: 'bold',
        color: '#4A0E4E',
    },
    input: {
        height: 50,
        borderColor: '#89609E',
        borderWidth: 1,
        marginBottom: 16,
        paddingHorizontal: 16,
        borderRadius: 25,
        backgroundColor: 'white',
        width: '100%',
        fontSize: 16,
    },
    slotItem: {
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#89609E',
        backgroundColor: 'white',
        marginVertical: 8,
        borderRadius: 12,
    },
    selectedSlot: {
        backgroundColor: '#F5E6D3',
        borderColor: '#4A0E4E',
        borderWidth: 2,
    },
    slotText: {
        fontSize: 16,
        color: '#4A0E4E',
    },
    bookButton: {
        backgroundColor: '#4A0E4E',
        padding: 16,
        borderRadius: 25,
        marginTop: 24,
        width: '100%',
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    bookButtonText: {
        color: '#F5E6D3',
        textAlign: 'center',
        fontWeight: 'bold',
        fontSize: 18,
    },
    paymentStatus: {
        marginTop: 16,
        fontSize: 16,
        fontWeight: 'bold',
        textAlign: 'center',
    },
    successText: {
        color: '#4CAF50',
    },
    errorText: {
        color: '#F44336',
    },
    processingText: {
        color: '#FFC107',
    },
    disabledButton: {
        backgroundColor: '#cccccc',
    },
    durationContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 16,
    },
    durationInput: {
        borderWidth: 1,
        borderColor: '#89609E',
        borderRadius: 12,
        padding: 8,
        width: 60,
        fontSize: 16,
        textAlign: 'center',
    },
    dateTimeButton: {
        backgroundColor: '#89609E',
        padding: 12,
        borderRadius: 25,
        marginVertical: 8,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    dateTimeButtonText: {
        color: '#F5E6D3',
        textAlign: 'center',
        fontWeight: 'bold',
        fontSize: 16,
    },
    copyright: {
        position: 'absolute',
        bottom: 10,
        alignSelf: 'center',
        fontSize: 12,
        color: '#89609E',
    },
    modalContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    modalContent: {
        backgroundColor: 'white',
        padding: 20,
        borderRadius: 10,
        width: '80%',
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 15,
        textAlign: 'center',
    },
    payButton: {
        backgroundColor: '#4A0E4E',
        padding: 12,
        borderRadius: 25,
        marginTop: 20,
    },
    payButtonText: {
        color: 'white',
        textAlign: 'center',
        fontWeight: 'bold',
    },
    cancelButton: {
        backgroundColor: '#ccc',
        padding: 12,
        borderRadius: 25,
        marginTop: 10,
    },
    cancelButtonText: {
        color: '#333',
        textAlign: 'center',
        fontWeight: 'bold',
    },
});
