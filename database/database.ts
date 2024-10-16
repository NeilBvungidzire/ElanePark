import * as SQLite from 'expo-sqlite';
import { z } from 'zod';

const operationLocks = new Map<string, Promise<any>>();

export interface User {
  id?: number;
  email: string;
  password: string;
  fullName: string;
  phoneNumber: string;
  loyaltyPoints: number;
}

export interface Reservation {
  id?: number;
  userId: number;
  parkingBayId: number;
  startTime: string;
  endTime: string;
  status: string;
  carPlate: string;
}

export interface Transaction {
  id?: number;
  userId: number;
  reservationId: number;
  amount: number;
  paymentMethod: string;
  status: string;
}

export interface ParkingBay {
  id?: number;
  title: string;
  latitude: number;
  longitude: number;
  price: number;
  available: boolean;
}

const db: any = SQLite.openDatabaseAsync('parkingApp.db');

class DatabaseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DatabaseError';
  }
}

const UserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  fullName: z.string().min(2),
  phoneNumber: z.string().regex(/^\+?[0-9]{10,14}$/),
});

const ReservationSchema = z.object({
  userId: z.number().positive(),
  parkingBayId: z.number().positive(),
  startTime: z.string().datetime(),
  endTime: z.string().datetime(),
  carPlate: z.string().regex(/^[A-Z0-9]{1,10}$/),
});

const TransactionSchema = z.object({
  userId: z.number().positive(),
  reservationId: z.number().positive(),
  amount: z.number().positive(),
  paymentMethod: z.string().min(1),
});

const ParkingBaySchema = z.object({
  title: z.string().min(1),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  price: z.number().positive(),
  available: z.boolean(),
});

// Add this function to create a lock for operations
const withLock = async <T>(key: string, operation: () => Promise<T>): Promise<T> => {
  while (operationLocks.has(key)) {
    await operationLocks.get(key);
  }

  const promise = operation();
  operationLocks.set(key, promise);

  try {
    return await promise;
  } finally {
    operationLocks.delete(key);
  }
};

export const initDatabase = async (): Promise<void> => {
  try {
    const database = await db;
    await database.execAsync(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE,
        password TEXT,
        fullName TEXT,
        phoneNumber TEXT,
        loyaltyPoints INTEGER
      );
    `);
    await database.execAsync(`
      CREATE TABLE IF NOT EXISTS reservations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        userId INTEGER,
        parkingBayId INTEGER,
        startTime DATETIME,
        endTime DATETIME,
        status TEXT,
        carPlate TEXT,
        FOREIGN KEY (userId) REFERENCES users (id)
      );
    `);
    await database.execAsync(`
      CREATE TABLE IF NOT EXISTS transactions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        userId INTEGER,
        reservationId INTEGER,
        amount REAL,
        paymentMethod TEXT,
        status TEXT,
        FOREIGN KEY (userId) REFERENCES users (id),
        FOREIGN KEY (reservationId) REFERENCES reservations (id)
      );
    `);
    await database.execAsync(`
      CREATE TABLE IF NOT EXISTS parking_bays (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT,
        latitude REAL,
        longitude REAL,
        price REAL,
        available INTEGER
      );
    `);

    const count = await database.getFirstAsync('SELECT COUNT(*) as count FROM parking_bays');
    if (count.count === 0) {
      await populateParkingBays();
    }
  } catch (error) {
    console.error('Error initializing database:', error);
    throw new DatabaseError('Failed to initialize database');
  }
};

const populateParkingBays = async (): Promise<void> => {
  try {
    const database = await db;
    const parkingBays: Omit<ParkingBay, 'id'>[] = [
      { title: 'Harare Gardens Parking', latitude: -17.8252, longitude: 31.0335, price: 2, available: true },
      { title: 'Sam Nujoma Street Parking', latitude: -17.8187, longitude: 31.0442, price: 3, available: true },
      { title: 'Eastgate Mall Parking', latitude: -17.8308, longitude: 31.0587, price: 4, available: true },
      { title: 'Avondale Shopping Centre Parking', latitude: -17.7972, longitude: 31.0511, price: 2, available: true },
      { title: 'Fife Avenue Shopping Centre Parking', latitude: -17.8134, longitude: 31.0394, price: 3, available: true },
      { title: 'Joina City Parking', latitude: -17.8302, longitude: 31.0479, price: 5, available: true },
      { title: 'Westgate Shopping Centre Parking', latitude: -17.7889, longitude: 31.0011, price: 2, available: true },
      { title: 'Borrowdale Village Parking', latitude: -17.7232, longitude: 31.1075, price: 4, available: true },
      { title: 'Arundel Village Parking', latitude: -17.7814, longitude: 31.0778, price: 3, available: true },
      { title: 'Chisipite Shopping Centre Parking', latitude: -17.7667, longitude: 31.1167, price: 2, available: true },
      { title: 'Belgravia Shopping Centre Parking', latitude: -17.8069, longitude: 31.0444, price: 3, available: true },
      { title: 'Newlands Shopping Centre Parking', latitude: -17.7833, longitude: 31.0667, price: 2, available: true },
      { title: 'Longcheng Plaza Parking', latitude: -17.8461, longitude: 31.0264, price: 4, available: true },
      { title: 'Mbare Musika Parking', latitude: -17.8636, longitude: 31.0344, price: 1, available: true },
      { title: 'Machipisa Shopping Centre Parking', latitude: -17.8833, longitude: 31.0167, price: 2, available: true },
      { title: 'Highfield Shopping Centre Parking', latitude: -17.8667, longitude: 31.0333, price: 2, available: true },
      { title: 'Mabelreign Shopping Centre Parking', latitude: -17.7833, longitude: 31.0000, price: 2, available: true },
      { title: 'Marlborough Shopping Centre Parking', latitude: -17.7500, longitude: 31.0167, price: 3, available: true },
      { title: 'Kamfinsa Shopping Centre Parking', latitude: -17.7833, longitude: 31.1000, price: 3, available: true },
      { title: 'Greendale Shopping Centre Parking', latitude: -17.8000, longitude: 31.1167, price: 3, available: true },
    ];

    for (const bay of parkingBays) {
      ParkingBaySchema.parse(bay);
      await database.runAsync(
        'INSERT INTO parking_bays (title, latitude, longitude, price, available) VALUES (?, ?, ?, ?, ?)',
        [bay.title, bay.latitude, bay.longitude, bay.price, bay.available ? 1 : 0]
      );
    }
  } catch (error) {
    console.error('Error populating parking bays:', error);
    throw new DatabaseError('Failed to populate parking bays');
  }
};

export const createUser = async (user: Omit<User, 'id' | 'loyaltyPoints'>): Promise<number> => { 
    try {
      UserSchema.parse(user);
      const database = await db;
      const result = await database.runAsync(
        'INSERT INTO users (email, password, fullName, phoneNumber, loyaltyPoints) VALUES (?, ?, ?, ?, ?)',
        [user.email, user.password, user.fullName, user.phoneNumber, 0]
      );
      return result.insertId;
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        throw new Error('Invalid user data: ' + error.errors.map(e => e.message).join(', '));
      }
      if (error.message.includes('UNIQUE constraint failed: users.email')) {
        throw new Error('Email already exists');
      }
      console.error('Error creating user:', error);
      throw new DatabaseError('Failed to create user');
    }
};

export const getUser = async (email: string): Promise<User | undefined> => {
  try {
    const database = await db;
    const result = await database.getFirstAsync(
      'SELECT * FROM users WHERE email = ?',
      [email]
    ) as User | undefined;
    return result ?? undefined;
  } catch (error: any) {
    console.error('Error getting user:', error);
    throw new DatabaseError('Failed to get user');
  }
};

export const createReservation = async (reservation: Omit<Reservation, 'id' | 'status'>): Promise<number> => {
  
    try {
      ReservationSchema.parse(reservation);
      const database = await db;

      const isAvailable = await checkTimeSlotAvailability(reservation.parkingBayId, reservation.startTime, reservation.endTime);
      if (!isAvailable) {
        throw new Error('The selected time slot is not available');
      }

      const hours = (new Date(reservation.endTime).getTime() - new Date(reservation.startTime).getTime()) / (1000 * 60 * 60);
      const price = Math.ceil(hours);

      const result = await database.runAsync(
        'INSERT INTO reservations (userId, parkingBayId, startTime, endTime, status, carPlate) VALUES (?, ?, ?, ?, ?, ?)',
        [reservation.userId, reservation.parkingBayId, reservation.startTime, reservation.endTime, 'active', reservation.carPlate]
      );

      await createTransaction({
        userId: reservation.userId,
        reservationId: result.insertId,
        amount: price,
        paymentMethod: 'paynow', 
      });

      return result.insertId;
    } catch (error: any) {
      console.log(error);
      if (error instanceof z.ZodError) {
        throw new Error('Invalid reservation data: ' + error.errors.map(e => e.message).join(', '));
      }
      console.error('Error creating reservation:', error);
      throw new DatabaseError('Failed to create reservation');
    }
};

export const updateReservationStatus = async (reservationId: number, status: string): Promise<number> => {
  try {
    const database = await db;
    const result = await database.runAsync(
      'UPDATE reservations SET status = ? WHERE id = ?',
      [status, reservationId]
    );
    if (result.rowsAffected === 0) {
      throw new Error('Reservation not found');
    }
    return result.rowsAffected;
  } catch (error: any) {
    console.error('Error updating reservation status:', error);
    throw new DatabaseError('Failed to update reservation status');
  }
};

export const createTransaction = async (transaction: Omit<Transaction, 'id' | 'status'>): Promise<number> => {
  try {
    TransactionSchema.parse(transaction);
    const database = await db;
    const result = await database.runAsync(
      'INSERT INTO transactions (userId, reservationId, amount, paymentMethod, status) VALUES (?, ?, ?, ?, ?)',
      [transaction.userId, transaction.reservationId, transaction.amount, transaction.paymentMethod, 'completed']
    );
    return result.insertId;
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error('Invalid transaction data: ' + error.errors.map(e => e.message).join(', '));
    }
    console.error('Error creating transaction:', error);
    throw new DatabaseError('Failed to create transaction');
  }
};

export const updateLoyaltyPoints = async (userId: number, points: number): Promise<number> => {
  try {
    const database = await db;
    const result = await database.runAsync(
      'UPDATE users SET loyaltyPoints = loyaltyPoints + ? WHERE id = ?',
      [points, userId]
    );
    if (result.rowsAffected === 0) {
      throw new Error('User not found');
    }
    return result.rowsAffected;
  } catch (error) {
    console.error('Error updating loyalty points:', error);
    throw new DatabaseError('Failed to update loyalty points');
  }
};

export const getAllParkingBays = async (): Promise<ParkingBay[]> => {
  try {
    const database = await db;
    const result = await database.getAllAsync('SELECT * FROM parking_bays') as ParkingBay[];
    return result.map(bay => ({
      ...bay,
      available: Boolean(bay.available)
    }));
  } catch (error) {
    console.error('Error getting all parking bays:', error);
    throw new DatabaseError('Failed to get all parking bays');
  }
};

export const updateParkingBayAvailability = async (id: number, available: boolean): Promise<number> => {
  try {
    const database = await db;
    const result = await database.runAsync(
      'UPDATE parking_bays SET available = ? WHERE id = ?',
      [available ? 1 : 0, id]
    );
    if (result.rowsAffected === 0) {
      throw new Error('Parking bay not found');
    }
    return result.rowsAffected;
  } catch (error) {
    console.error('Error updating parking bay availability:', error);
    throw new DatabaseError('Failed to update parking bay availability');
  }
};

export const loginUser = async (email: string, password: string): Promise<User | null> => {
  try {
    const database = await db;
    const user = await database.getFirstAsync(
      'SELECT * FROM users WHERE email = ? AND password = ?',
      [email, password]
    ) as User | null;
    return user;
  } catch (error) {
    console.error('Error logging in user:', error);
    throw new DatabaseError('Failed to login user');
  }
};

export const getRecentReservations = async (userId: number): Promise<Reservation[]> => {
  try {
    const database = await db;
    const result = await database.getAllAsync(
      'SELECT * FROM reservations WHERE userId = ? ORDER BY startTime DESC LIMIT 5',
      [userId]
    ) as Reservation[];
    return result;
  } catch (error) {
    console.error('Error getting recent reservations:', error);
    throw new DatabaseError('Failed to get recent reservations');
  }
};

export const createParkingBay = async (bay: Omit<ParkingBay, 'id'>): Promise<number> => {
  try {
    ParkingBaySchema.parse(bay);
    const database = await db;
    const result = await database.runAsync(
      'INSERT INTO parking_bays (title, latitude, longitude, price, available) VALUES (?, ?, ?, ?, ?)',
      [bay.title, bay.latitude, bay.longitude, bay.price, bay.available ? 1 : 0]
    );
    return result.insertId;
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error('Invalid parking bay data: ' + error.errors.map(e => e.message).join(', '));
    }
    console.error('Error creating parking bay:', error);
    throw new DatabaseError('Failed to create parking bay');
  }
};

export const updateParkingBay = async (bay: ParkingBay): Promise<number> => {
  try {
    ParkingBaySchema.parse(bay);
    const database = await db;
    const result = await database.runAsync(
      'UPDATE parking_bays SET title = ?, latitude = ?, longitude = ?, price = ?, available = ? WHERE id = ?',
      [bay.title, bay.latitude, bay.longitude, bay.price, bay.available ? 1 : 0, bay.id]
    );
    if (result.rowsAffected === 0) {
      throw new Error('Parking bay not found');
    }
    return result.rowsAffected;
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error('Invalid parking bay data: ' + error.errors.map(e => e.message).join(', '));
    }
    console.error('Error updating parking bay:', error);
    throw new DatabaseError('Failed to update parking bay');
  }
};

export const deleteParkingBay = async (id: number): Promise<number> => {
  try {
    const database = await db;
    const result = await database.runAsync('DELETE FROM parking_bays WHERE id = ?', [id]);
    if (result.rowsAffected === 0) {
      throw new Error('Parking bay not found');
    }
    return result.rowsAffected;
  } catch (error) {
    console.error('Error deleting parking bay:', error);
    throw new DatabaseError('Failed to delete parking bay');
  }
};

export const getParkingBayById = async (id: number): Promise<ParkingBay | null> => {
  try {
    const database = await db;
    const result = await database.getFirstAsync('SELECT * FROM parking_bays WHERE id = ?', [id]) as ParkingBay | null;
    if (result) {
      result.available = Boolean(result.available);
    }
    return result;
  } catch (error) {
    console.error('Error getting parking bay:', error);
    throw new DatabaseError('Failed to get parking bay');
  }
};

export const searchParkingBays = async (query: string): Promise<ParkingBay[]> => {
  try {
    const database = await db;
    const result = await database.getAllAsync(
      'SELECT * FROM parking_bays WHERE title LIKE ?',
      [`%${query}%`]
    ) as ParkingBay[];
    return result.map(bay => ({
      ...bay,
      available: Boolean(bay.available)
    }));
  } catch (error) {
    console.error('Error searching parking bays:', error);
    throw new DatabaseError('Failed to search parking bays');
  }
};

export const checkTimeSlotAvailability = async (parkingBayId: number, startTime: string, endTime: string): Promise<boolean> => {
    try {
      const database = await db;
      const result = await database.getFirstAsync(
        `SELECT COUNT(*) as count FROM reservations 
         WHERE parkingBayId = ? AND status = 'active'
         AND ((startTime <= ? AND endTime > ?) OR (startTime < ? AND endTime >= ?) OR (startTime >= ? AND endTime <= ?))`,
        [parkingBayId, startTime, startTime, endTime, endTime, startTime, endTime]
      );
      return result.count === 0;
    } catch (error) {
      console.error('Error checking time slot availability:', error);
      throw new DatabaseError('Failed to check time slot availability');
    }
};

export const getAvailableTimeSlots = async (parkingBayId: number, date: string): Promise<{ startTime: string, endTime: string }[]> => {
  try {
    const database = await db;
    const reservations = await database.getAllAsync(
      `SELECT startTime, endTime FROM reservations 
       WHERE parkingBayId = ? AND date(startTime) = ? AND status = 'active'
       ORDER BY startTime`,
      [parkingBayId, date]
    );

    const availableSlots = [];
    let currentTime = new Date(`${date}T08:00:00`);
    const endOfDay = new Date(`${date}T17:00:00`);

    for (const reservation of reservations) {
      const reservationStart = new Date(reservation.startTime);
      if (currentTime < reservationStart) {
        availableSlots.push({
          startTime: currentTime.toISOString(),
          endTime: reservationStart.toISOString(),
        });
      }
      currentTime = new Date(reservation.endTime);
    }

    if (currentTime < endOfDay) {
      availableSlots.push({
        startTime: currentTime.toISOString(),
        endTime: endOfDay.toISOString(),
      });
    }

    return availableSlots;
  } catch (error) {
    console.error('Error getting available time slots:', error);
    throw new DatabaseError('Failed to get available time slots');
  }
};

export const checkCarReservation = async (carPlate: string): Promise<{ isValid: boolean, reservation?: Reservation }> => {
  try {
    const database = await db;
    const now = new Date().toISOString();
    const reservation = await database.getFirstAsync(
      `SELECT * FROM reservations 
       WHERE carPlate = ? AND status = 'active' AND startTime <= ? AND endTime >= ?`,
      [carPlate, now, now]
    ) as Reservation | undefined;

    return {
      isValid: !!reservation,
      reservation,
    };
  } catch (error) {
    console.error('Error checking car reservation:', error);
    throw new DatabaseError('Failed to check car reservation');
  }
};

export const refundReservation = async (reservationId: number, adminId: number): Promise<void> => {
  try {
    const database = await db;
    await database.runAsync('BEGIN TRANSACTION');

    await updateReservationStatus(reservationId, 'refunded');

    const transaction = await database.getFirstAsync(
      'SELECT * FROM transactions WHERE reservationId = ?',
      [reservationId]
    ) as Transaction;

    if (!transaction) {
      throw new Error('No transaction found for this reservation');
    }

    await createTransaction({
      userId: transaction.userId,
      reservationId: reservationId,
      amount: -transaction.amount, 
      paymentMethod: 'refund',
    });

    await database.runAsync(
      'INSERT INTO admin_actions (adminId, action, reservationId) VALUES (?, ?, ?)',
      [adminId, 'refund', reservationId]
    );

    await database.runAsync('COMMIT');
  } catch (error) {
    await db.runAsync('ROLLBACK');
    console.error('Error refunding reservation:', error);
    throw new DatabaseError('Failed to refund reservation');
  }
};

export const cancelReservation = async (reservationId: number, adminId: number): Promise<void> => {
  try {
    const database = await db;
    await database.runAsync('BEGIN TRANSACTION');

    await updateReservationStatus(reservationId, 'cancelled');

    await database.runAsync(
      'INSERT INTO admin_actions (adminId, action, reservationId) VALUES (?, ?, ?)',
      [adminId, 'cancel', reservationId]
    );

    await database.runAsync('COMMIT');
  } catch (error) {
    await db.runAsync('ROLLBACK');
    console.error('Error cancelling reservation:', error);
    throw new DatabaseError('Failed to cancel reservation');
  }
};

export const checkAndLockTimeSlot = async (parkingBayId: number, startTime: string, endTime: string): Promise<boolean> => {
    try {
      const database = await db;      
      const result = await database.getFirstAsync(
        'SELECT COUNT(*) as count FROM reservations WHERE parkingBayId = ? AND ((startTime <= ? AND endTime > ?) OR (startTime < ? AND endTime >= ?) OR (startTime >= ? AND endTime <= ?))',
        [parkingBayId, startTime, startTime, endTime, endTime, startTime, endTime]
      );
      
      if (result.count > 0) {
        return false;
      }

      await database.runAsync(
        'INSERT INTO reservation_locks (parkingBayId, startTime, endTime, lockExpiration) VALUES (?, ?, ?, ?)',
        [parkingBayId, startTime, endTime, new Date(Date.now() + 5 * 60 * 1000).toISOString()] 
      );
      
      return true;
    } catch (error) {
      console.error('Error checking and locking time slot:', error);
      return false;
    }
};
