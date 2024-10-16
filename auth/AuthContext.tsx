import React, { createContext, useState, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getAllParkingBays, ParkingBay, User } from '../database/database';

interface AuthContextData {
  user: User | null;
  loading: boolean;
  isLoggedIn: boolean;
  signIn: (user: User) => Promise<void>;
  signOut: () => Promise<void>;
  fetchAllData: () => Promise<{ parkingBays: ParkingBay[] }>;
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    async function loadStoredData() {
      const storedUser = await AsyncStorage.getItem('@ParkingApp:user');
      if (storedUser) {
        setUser(JSON.parse(storedUser));
        setIsLoggedIn(true);
      }
      setLoading(false);
    }
    loadStoredData();
  }, []);

  const signIn = async (user: User) => {
    await AsyncStorage.setItem('@ParkingApp:user', JSON.stringify(user));
    setUser(user);
    setIsLoggedIn(true);
  };

  const signOut = async () => {
    await AsyncStorage.removeItem('@ParkingApp:user');
    setUser(null);
    setIsLoggedIn(false);
  };

  const fetchAllData = async () => {
    const parkingBays = await getAllParkingBays();
    return { parkingBays };
  };

  return (
    <AuthContext.Provider value={{ user, loading, isLoggedIn, signIn, signOut, fetchAllData }}>
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth(): AuthContextData {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
}
