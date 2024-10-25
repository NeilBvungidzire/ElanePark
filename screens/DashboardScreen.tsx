import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, RefreshControl } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { Dimensions } from 'react-native';
import { getTodayBookings, getReservationsTimeSeries, getTotalRevenue } from '../database/database';
import { Reservation } from '../entity/Reservation'; 
import LoadingScreen from './LoadingScreen'; 

const screenWidth = Dimensions.get('window').width;

type LineChartData = {
    labels: string[];
    datasets: { data: number[] }[];
};

export default function DashboardScreen() {
    const [todayBookings, setTodayBookings] = useState<Reservation[]>([]);
    const [reservationsData, setReservationsData] = useState<LineChartData>({
        labels: [],
        datasets: [{ data: [] }]
    });
    const [totalRevenue, setTotalRevenue] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        setIsLoading(true);
        try {
            const bookings = await getTodayBookings();
            const timeSeries = await getReservationsTimeSeries();
            const revenue = await getTotalRevenue();

            setTodayBookings(bookings);
            setReservationsData({
                labels: timeSeries.map(item => item.date),
                datasets: [{ data: timeSeries.map(item => item.count) }]
            });
            setTotalRevenue(revenue);
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await fetchDashboardData();
        setRefreshing(false);
    }, []);

    if (isLoading) {
        return <LoadingScreen message="Loading dashboard data..." />;
    }

    return (
        <ScrollView 
            style={styles.container}
            refreshControl={
                <RefreshControl
                    refreshing={refreshing}
                    onRefresh={onRefresh}
                    colors={["#4A0E4E"]}
                    tintColor="#4A0E4E"
                />
            }
        >
            <Text style={styles.headerText}>Dashboard</Text>

            <View style={styles.card}>
                <Text style={styles.cardTitle}>Today's Bookings</Text>
                <Text style={styles.cardValue}>{todayBookings.length}</Text>
            </View>

            <View style={styles.card}>
                <Text style={styles.cardTitle}>Total Revenue</Text>
                <Text style={styles.cardValue}>${totalRevenue.toFixed(2)}</Text>
            </View>

            <View style={styles.card}>
                <Text style={styles.cardTitle}>Reservations Over Time</Text>
                <LineChart
                    data={reservationsData}
                    width={screenWidth - 40}
                    height={220}
                    chartConfig={{
                        backgroundColor: '#ffffff',
                        backgroundGradientFrom: '#ffffff',
                        backgroundGradientTo: '#ffffff',
                        decimalPlaces: 0,
                        color: (opacity = 1) => `rgba(74, 14, 78, ${opacity})`,
                        style: {
                            borderRadius: 16
                        }
                    }}
                    bezier
                    style={{
                        marginVertical: 8,
                        borderRadius: 16
                    }}
                />
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5E6D3',
        padding: 20,
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F5E6D3',
    },
    headerText: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#4A0E4E',
        marginBottom: 20,
        textAlign: 'center',
    },
    card: {
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 20,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#4A0E4E',
        marginBottom: 10,
    },
    cardValue: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#89609E',
    },
});
