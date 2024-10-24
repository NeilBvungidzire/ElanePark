import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert, ScrollView } from 'react-native';

const totalAmount = 50.00;

export default function PaymentScreen() {
    const [mobileNumber, setMobileNumber] = useState('');
    const [paymentInstructions, setPaymentInstructions] = useState('');
    const [paymentStatus, setPaymentStatus] = useState('');

    useEffect(() => {
        const timer = setInterval(() => {
            if (Math.random() < 0.2) { 
                Alert.alert('Bay Available', 'A new parking bay has become available!');
            }
        }, 30000); 

        return () => clearInterval(timer);
    }, []);

    const simulatePayNowResponse = () => {
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve({
                    success: true,
                    instructions: "Please follow these steps to complete your payment:\n1. Dial *151#\n2. Choose option 3 for payments\n3. Enter merchant code 123456\n4. Enter amount $50.00\n5. Confirm payment with your PIN",
                    pollUrl: "https://api.paynow.co.zw/poll/123456789"
                });
            }, 1500); 
        });
    };

    const simulatePollTransaction = () => {
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve({ paid: Math.random() > 0.5 }); 
            }, 3000); 
        });
    };

    const handlePayment = async () => {
        if (!mobileNumber) {
            Alert.alert('Error', 'Please enter a mobile number');
            return;
        }

        setPaymentStatus('Processing');
        try {
            const response: any = await simulatePayNowResponse();
            if (response.success) {
                setPaymentInstructions(response.instructions);
                setPaymentStatus('Awaiting payment');
                pollPaymentStatus(response.pollUrl);
            } else {
                Alert.alert('Payment Error', 'Failed to initiate payment');
                setPaymentStatus('');
            }
        } catch (error) {
            Alert.alert('Payment Error', 'An error occurred while processing your payment.');
            setPaymentStatus('');
        }
    };

    const pollPaymentStatus = async (url: string) => {
        const maxAttempts = 3;
        let attempts = 0;

        const checkStatus = async () => {
            if (attempts >= maxAttempts) {
                Alert.alert('Payment Timeout', 'The payment process has timed out. Please try again.');
                setPaymentStatus('');
                return;
            }

            const status: any = await simulatePollTransaction();
            if (status.paid) {
                Alert.alert('Payment Success', 'Your payment has been processed successfully.');
                setPaymentStatus('Paid');
            } else {
                attempts++;
                setPaymentStatus(`Checking payment status (Attempt ${attempts}/${maxAttempts})`);
                setTimeout(checkStatus, 5000); 
            }
        };

        checkStatus();
    };

    return (
        <ScrollView contentContainerStyle={styles.container}>
            <View style={styles.paymentSection}>
                <Text style={styles.title}>PayNow Payment</Text>

                <Text style={styles.label}>Total Amount: ${totalAmount.toFixed(2)}</Text>

                <View style={styles.paymentForm}>
                    <Text style={styles.label}>Mobile Number</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="+263777000000"
                        keyboardType="phone-pad"
                        value={mobileNumber}
                        onChangeText={setMobileNumber}
                    />
                    {paymentInstructions ? (
                        <View>
                            <Text style={styles.instructions}>{paymentInstructions}</Text>
                        </View>
                    ) : null}
                    {paymentStatus ? (
                        <Text style={styles.status}>{paymentStatus}</Text>
                    ) : null}
                </View>

                <Button title="Pay Now" onPress={handlePayment} />
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flexGrow: 1,
        padding: 20,
        justifyContent: 'center',
        backgroundColor: '#f5f5f5',
    },
    paymentSection: {
        backgroundColor: '#fff',
        padding: 20,
        borderRadius: 10,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        marginBottom: 20,
        textAlign: 'center',
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 15,
    },
    label: {
        fontSize: 16,
        marginBottom: 8,
    },
    paymentMethodsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 20,
    },
    paymentForm: {
        marginBottom: 20,
    },
    input: {
        borderWidth: 1,
        borderColor: '#ccc',
        padding: 10,
        borderRadius: 5,
        marginBottom: 12,
    },
    instructions: {
        marginTop: 10,
        padding: 10,
        backgroundColor: '#f0f0f0',
        borderRadius: 5,
    },
    status: {
        marginTop: 10,
        fontWeight: 'bold',
        color: 'blue',
    },
});
