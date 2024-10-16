import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, Alert, Modal, ScrollView, SafeAreaView } from 'react-native';
import { getAllParkingBays, ParkingBay, createParkingBay, updateParkingBay, deleteParkingBay, updateParkingBayAvailability } from '../database/database';

// Define colors here
const colors = {
  primary: '#007AFF',
  background: '#F2F2F7',
  cardBackground: '#FFFFFF',
  text: '#000000',
  textSecondary: '#8E8E93',
  border: '#C7C7CC',
  buttonText: '#FFFFFF',
  success: '#34C759',
  error: '#FF3B30',
  shadow: '#000000',
};

export default function ManageParkingBays() {
    const [parkingBays, setParkingBays] = useState<ParkingBay[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [modalVisible, setModalVisible] = useState(false);
    const [editingBay, setEditingBay] = useState<ParkingBay | null>(null);
    const [title, setTitle] = useState('');
    const [latitude, setLatitude] = useState('');
    const [longitude, setLongitude] = useState('');
    const [price, setPrice] = useState('');
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        fetchParkingBays();
    }, []);

    const fetchParkingBays = async () => {
        try {
            setIsLoading(true);
            const bays = await getAllParkingBays();
            setParkingBays(bays);
        } catch (error) {
            console.error("Error fetching parking bays:", error);
            Alert.alert("Error", "Unable to fetch parking bays");
        } finally {
            setIsLoading(false);
        }
    };

    const handleToggleAvailability = async (id: number, currentAvailability: boolean) => {
        try {
            await updateParkingBayAvailability(id, !currentAvailability);
            fetchParkingBays();
        } catch (error) {
            console.error("Error updating availability:", error);
            Alert.alert("Error", "Unable to update parking bay availability");
        }
    };

    const handleEditBay = (bay: ParkingBay) => {
        setEditingBay(bay);
        setTitle(bay.title);
        setLatitude(bay.latitude.toString());
        setLongitude(bay.longitude.toString());
        setPrice(bay.price.toString());
        setModalVisible(true);
    };

    const handleSaveBay = async () => {
        try {
            const bayData: ParkingBay = {
                id: editingBay?.id,
                title,
                latitude: parseFloat(latitude),
                longitude: parseFloat(longitude),
                price: parseFloat(price),
                available: editingBay ? editingBay.available : true,
            };

            if (editingBay) {
                await updateParkingBay(bayData);
            } else {
                await createParkingBay(bayData);
            }

            setModalVisible(false);
            fetchParkingBays();
        } catch (error) {
            console.error("Error saving parking bay:", error);
            Alert.alert("Error", "Unable to save parking bay");
        }
    };

    const handleDeleteBay = async (id: number) => {
        Alert.alert(
            "Delete Parking Bay",
            "Are you sure you want to delete this parking bay?",
            [
                { text: "Cancel", style: "cancel" },
                { 
                    text: "Delete", 
                    style: "destructive",
                    onPress: async () => {
                        try {
                            await deleteParkingBay(id);
                            fetchParkingBays();
                        } catch (error) {
                            console.error("Error deleting parking bay:", error);
                            Alert.alert("Error", "Unable to delete parking bay");
                        }
                    }
                }
            ]
        );
    };

    const filteredBays = parkingBays.filter(bay => 
        bay.title.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const renderParkingBayItem = ({ item }: { item: ParkingBay }) => (
        <View style={styles.parkingItem}>
            <View style={styles.parkingInfo}>
                <Text style={styles.parkingTitle}>{item.title}</Text>
                <Text>Price: ${item.price}</Text>
                <Text>Lat: {item.latitude}, Lon: {item.longitude}</Text>
            </View>
            <View style={styles.parkingActions}>
                <TouchableOpacity 
                    style={[styles.button, item.available ? styles.availableButton : styles.unavailableButton]}
                    onPress={() => handleToggleAvailability(item.id!, item.available)}
                >
                    <Text style={styles.buttonText}>{item.available ? "Available" : "Unavailable"}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.button, styles.editButton]} onPress={() => handleEditBay(item)}>
                    <Text style={styles.buttonText}>Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.button, styles.deleteButton]} onPress={() => handleDeleteBay(item.id!)}>
                    <Text style={styles.buttonText}>Delete</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.container}>
                <Text style={styles.title}>Manage Parking Bays</Text>
                <TextInput
                    style={styles.searchInput}
                    placeholder="Search parking bays..."
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    placeholderTextColor={colors.textSecondary}
                />
                <TouchableOpacity style={styles.addButton} onPress={() => {
                    setEditingBay(null);
                    setTitle('');
                    setLatitude('');
                    setLongitude('');
                    setPrice('');
                    setModalVisible(true);
                }}>
                    <Text style={styles.addButtonText}>Add New Parking Bay</Text>
                </TouchableOpacity>
                <FlatList
                    data={filteredBays}
                    renderItem={renderParkingBayItem}
                    keyExtractor={(item) => item.id!.toString()}
                    style={styles.list}
                    ListEmptyComponent={
                        <Text style={styles.emptyText}>No parking bays available</Text>
                    }
                />
                <Modal
                    animationType="slide"
                    transparent={true}
                    visible={modalVisible}
                    onRequestClose={() => setModalVisible(false)}
                >
                    <View style={styles.centeredView}>
                        <View style={styles.modalView}>
                            <ScrollView>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Title"
                                    value={title}
                                    onChangeText={setTitle}
                                />
                                <TextInput
                                    style={styles.input}
                                    placeholder="Latitude"
                                    value={latitude}
                                    onChangeText={setLatitude}
                                    keyboardType="numeric"
                                />
                                <TextInput
                                    style={styles.input}
                                    placeholder="Longitude"
                                    value={longitude}
                                    onChangeText={setLongitude}
                                    keyboardType="numeric"
                                />
                                <TextInput
                                    style={styles.input}
                                    placeholder="Price"
                                    value={price}
                                    onChangeText={setPrice}
                                    keyboardType="numeric"
                                />
                                <TouchableOpacity style={styles.saveButton} onPress={handleSaveBay}>
                                    <Text style={styles.buttonText}>Save</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.cancelButton} onPress={() => setModalVisible(false)}>
                                    <Text style={styles.buttonText}>Cancel</Text>
                                </TouchableOpacity>
                            </ScrollView>
                        </View>
                    </View>
                </Modal>
                <Text style={styles.copyright}>© 2024 Elaine Foroma. All rights reserved.</Text>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: colors.background,
    },
    container: {
        flex: 1,
        padding: 20,
        paddingTop: 40, // Add extra space at the top
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: colors.primary,
        marginBottom: 20,
        textAlign: 'center',
    },
    searchInput: {
        height: 40,
        borderColor: colors.border,
        borderWidth: 1,
        paddingLeft: 10,
        borderRadius: 5,
        marginBottom: 10,
        color: colors.text,
    },
    list: {
        flex: 1,
    },
    parkingItem: {
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: 15,
        marginVertical: 8,
        backgroundColor: colors.cardBackground,
        borderRadius: 8,
        elevation: 2,
        shadowColor: colors.shadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    parkingInfo: {
        marginBottom: 10,
    },
    parkingTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 4,
        color: colors.text,
    },
    parkingActions: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    button: {
        padding: 10,
        borderRadius: 5,
        flex: 1,
        marginHorizontal: 5,
    },
    availableButton: {
        backgroundColor: colors.success,
    },
    unavailableButton: {
        backgroundColor: colors.error,
    },
    editButton: {
        backgroundColor: colors.primary,
    },
    deleteButton: {
        backgroundColor: colors.error,
    },
    buttonText: {
        color: colors.buttonText,
        textAlign: 'center',
    },
    emptyText: {
        textAlign: 'center',
        marginTop: 50,
        fontSize: 18,
        color: colors.textSecondary,
    },
    addButton: {
        backgroundColor: colors.success,
        padding: 15,
        borderRadius: 5,
        marginBottom: 10,
    },
    addButtonText: {
        color: colors.buttonText,
        textAlign: 'center',
        fontWeight: 'bold',
    },
    copyright: {
        textAlign: 'center',
        marginTop: 20,
        color: colors.textSecondary,
        fontSize: 12,
    },
    centeredView: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    modalView: {
        backgroundColor: 'white',
        borderRadius: 20,
        padding: 35,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2
        },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
        width: '80%',
        maxHeight: '80%',
    },
    input: {
        height: 40,
        width: '100%',
        borderColor: 'gray',
        borderWidth: 1,
        marginBottom: 20,
        paddingHorizontal: 10,
    },
    saveButton: {
        backgroundColor: 'blue',
        padding: 10,
        borderRadius: 5,
        marginBottom: 10,
        width: '100%',
    },
    cancelButton: {
        backgroundColor: 'red',
        padding: 10,
        borderRadius: 5,
        width: '100%',
    },
});
