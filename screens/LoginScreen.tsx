import React, { useState } from 'react';
import { 
  View, 
  TextInput, 
  TouchableOpacity, 
  Alert, 
  Text, 
  StyleSheet, 
  Image, 
  KeyboardAvoidingView, 
  Platform,
  ScrollView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../auth/AuthContext';
import { loginUser } from '../database/database';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';

type AuthStackParamList = {
    Login: undefined;
    Register: undefined;
};

type LoginScreenNavigationProp = StackNavigationProp<AuthStackParamList, 'Login'>;

const LoginScreen = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const { signIn } = useAuth();
    const navigation = useNavigation<LoginScreenNavigationProp>();

    const handleLogin = async () => {
        try {
            const user = await loginUser(email, password);
            if (user) {
                await signIn(user);
            } else {
                Alert.alert('Login Failed', 'Invalid email or password');
            }
        } catch (error) {
            console.error('Login error:', error);
            Alert.alert('Login Error', 'An error occurred during login');
        }
    };

    const navigateToRegister = () => {
        navigation.navigate('Register');
    };

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
                <Text style={styles.tagline}>Smart Parking for a Smarter City</Text>
                <View style={styles.inputContainer}>
                    <TextInput
                        style={styles.input}
                        placeholder="Email"
                        value={email}
                        onChangeText={setEmail}
                        keyboardType="email-address"
                        autoCapitalize="none"
                    />
                    <View style={styles.passwordContainer}>
                        <TextInput
                            style={styles.passwordInput}
                            placeholder="Password"
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry={!showPassword}
                        />
                        <TouchableOpacity 
                            style={styles.eyeIcon} 
                            onPress={() => setShowPassword(!showPassword)}
                        >
                            <Ionicons 
                                name={showPassword ? 'eye-off' : 'eye'} 
                                size={24} 
                                color="#4C1D1C"
                            />
                        </TouchableOpacity>
                    </View>
                </View>
                <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
                    <Text style={styles.loginButtonText}>Login</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={navigateToRegister} style={styles.registerLink}>
                    <Text style={styles.registerText}>Don't have an account? Register</Text>
                </TouchableOpacity>
            </ScrollView>
            <Text style={styles.copyright}>© 2024 Built by Elaine Foroma</Text>
        </KeyboardAvoidingView>
    );
};

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
        width: 150,
        height: 150,
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
    inputContainer: {
        width: '100%',
        marginBottom: 20,
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
    loginButton: {
        width: '100%',
        height: 50,
        backgroundColor: '#4C1D1C', 
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 10,
        marginTop: 10,
    },
    loginButtonText: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
    },
    registerLink: {
        marginTop: 20,
    },
    registerText: {
        color: '#4C1D1C', 
        fontSize: 16,
    },
    copyright: {
        position: 'absolute',
        bottom: 10,
        alignSelf: 'center',
        fontSize: 12,
        color: '#7A3E3D', // Matching the color scheme of the LoginScreen
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
    eyeIcon: {
        padding: 10,
    },
});

export default LoginScreen;
