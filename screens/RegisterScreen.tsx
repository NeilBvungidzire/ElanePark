import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, Alert, ScrollView, TouchableOpacity, Image, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useForm, Controller } from 'react-hook-form';
import * as yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/RootStackParamList';
import { createUser } from '../database/database';
import LoadingScreen from './LoadingScreen';

type RegisterScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface IFormInput {
    fullName: string;
    email: string;
    phoneNumber: string;
    password: string;
}

const schema = yup.object({
    fullName: yup.string().required('Full Name is required'),
    email: yup.string().email('Invalid email').required('Email is required'),
    phoneNumber: yup.string().required('Phone number is required'),
    password: yup.string().min(6, 'Password must be at least 6 characters').required('Password is required'),
}).required();

export default function RegisterScreen({ navigation }: { navigation: RegisterScreenNavigationProp }) {
    const { control, handleSubmit, formState: { errors } } = useForm<IFormInput>({
        resolver: yupResolver(schema),
    });
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const onSubmit = async (data: IFormInput) => {
        try {
            const userId = await createUser({
                email: data.email,
                password: data.password,
                fullName: data.fullName,
                phoneNumber: data.phoneNumber,
            });
            if (userId) {
                Alert.alert('Registration Successful', 'You can now log in with your new account.');
                navigation.navigate('Login');
            } else {
                Alert.alert('Registration Failed', 'An error occurred during registration.');
            }
        } catch (error) {
            console.log(error);
            Alert.alert('Registration Failed', 'An error occurred during registration.');
        }
    };

    if (isLoading) {
        return <LoadingScreen message="Creating your account..." />;
    }

    return (
        <KeyboardAvoidingView 
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={styles.container}
        >
            <ScrollView contentContainerStyle={styles.scrollContainer}>
                <Image
                    source={require('../assets/adaptive-icon.png')} 
                    style={styles.logo}
                />
                <Text style={styles.title}>Smart Parking Mobile Application</Text>
                <Text style={styles.tagline}>Join the Smart Parking Revolution</Text>

                <View style={styles.form}>
                    <Controller
                        control={control}
                        name="fullName"
                        render={({ field: { onChange, onBlur, value } }) => (
                            <TextInput
                                style={styles.input}
                                placeholder="Full Name"
                                onBlur={onBlur}
                                onChangeText={onChange}
                                value={value}
                            />
                        )}
                    />
                    {errors.fullName && <Text style={styles.error}>{errors.fullName.message}</Text>}

                    <Controller
                        control={control}
                        name="email"
                        render={({ field: { onChange, onBlur, value } }) => (
                            <TextInput
                                style={styles.input}
                                placeholder="Email"
                                keyboardType="email-address"
                                onBlur={onBlur}
                                onChangeText={onChange}
                                value={value}
                                autoCapitalize="none"
                            />
                        )}
                    />
                    {errors.email && <Text style={styles.error}>{errors.email.message}</Text>}

                    <Controller
                        control={control}
                        name="phoneNumber"
                        render={({ field: { onChange, onBlur, value } }) => (
                            <TextInput
                                style={styles.input}
                                placeholder="Phone Number"
                                keyboardType="phone-pad"
                                onBlur={onBlur}
                                onChangeText={onChange}
                                value={value}
                            />
                        )}
                    />
                    {errors.phoneNumber && <Text style={styles.error}>{errors.phoneNumber.message}</Text>}

                    <Controller
                        control={control}
                        name="password"
                        render={({ field: { onChange, onBlur, value } }) => (
                            <View style={styles.passwordContainer}>
                                <TextInput
                                    style={styles.passwordInput}
                                    placeholder="Password"
                                    secureTextEntry={!showPassword}
                                    onBlur={onBlur}
                                    onChangeText={onChange}
                                    value={value}
                                />
                                <TouchableOpacity 
                                    style={styles.visibilityIcon} 
                                    onPress={() => setShowPassword(!showPassword)}
                                >
                                    <Ionicons 
                                        name={showPassword ? 'eye-off' : 'eye'} 
                                        size={24} 
                                        color="#4C1D1C"
                                    />
                                </TouchableOpacity>
                            </View>
                        )}
                    />
                    {errors.password && <Text style={styles.error}>{errors.password.message}</Text>}

                    <TouchableOpacity style={styles.registerButton} onPress={handleSubmit(onSubmit)}>
                        <Text style={styles.registerButtonText}>Register</Text>
                    </TouchableOpacity>

                    <View style={styles.loginContainer}>
                        <Text style={styles.loginText}>Already have an account? </Text>
                        <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                            <Text style={styles.loginLink}>Login</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </ScrollView>
            <Text style={styles.copyright}>© 2024 Built by Elaine Foroma</Text>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5E6E6', 
    },
    scrollContainer: {
        flexGrow: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    logo: {
        width: 120,
        height: 120,
        resizeMode: 'contain',
        marginBottom: 20,
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#4C1D1C', 
        marginBottom: 10,
    },
    tagline: {
        fontSize: 18,
        color: '#7A3E3D', 
        marginBottom: 30,
        textAlign: 'center',
    },
    form: {
        width: '100%',
    },
    input: {
        width: '100%',
        height: 50,
        backgroundColor: 'white',
        borderColor: '#4C1D1C',
        borderWidth: 1,
        borderRadius: 10,
        marginBottom: 15,
        paddingHorizontal: 15,
        fontSize: 16,
    },
    error: {
        color: '#D64545', 
        marginBottom: 10,
        fontSize: 14,
    },
    registerButton: {
        width: '100%',
        height: 50,
        backgroundColor: '#4C1D1C', 
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 10,
        marginTop: 10,
    },
    registerButtonText: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
    },
    loginContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 20,
    },
    loginText: {
        fontSize: 16,
        color: '#7A3E3D', 
    },
    loginLink: {
        fontSize: 16,
        color: '#4C1D1C', 
        fontWeight: 'bold',
    },
    copyright: {
        position: 'absolute',
        bottom: 10,
        alignSelf: 'center',
        fontSize: 12,
        color: '#7A3E3D', // Adjusted color to match this screen's theme
    },
    passwordContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        width: '100%',
        height: 50,
        backgroundColor: 'white',
        borderColor: '#4C1D1C',
        borderWidth: 1,
        borderRadius: 10,
        marginBottom: 15,
    },
    passwordInput: {
        flex: 1,
        height: '100%',
        paddingHorizontal: 15,
        fontSize: 16,
    },
    visibilityIcon: {
        padding: 10,
    },
});
