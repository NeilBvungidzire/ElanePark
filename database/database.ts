import { DataSource } from 'typeorm';
import { SqliteConnectionOptions } from 'typeorm/driver/sqlite/SqliteConnectionOptions';
import { User } from '../entity/User';
import { Reservation } from '../entity/Reservation';
import { Transaction } from '../entity/Transaction';
import { ParkingBay } from '../entity/ParkingBay';
import ormConfig from '../ormconfig';
import { z } from 'zod';
import { Like, Between, LessThanOrEqual, MoreThanOrEqual } from 'typeorm';
import bcrypt from 'react-native-bcrypt';

const dataSource = new DataSource(ormConfig as SqliteConnectionOptions);



class DatabaseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DatabaseError';
  }
}


export const initializeDatabase = async () => {
  try {
    await dataSource.initialize();
    console.log('Database connection established');
  } catch (error) {
    console.error('Error connecting to the database', error);
    throw new DatabaseError('Failed to initialize database');
  }
};

export const createUser = async (userData: Omit<User, 'id' | 'loyaltyPoints'>): Promise<number> => {
  try {
    const userRepository = dataSource.getRepository(User);
    
    const salt = bcrypt.genSaltSync(10);
    const hashedPassword = bcrypt.hashSync(userData.password, salt);

    const user = userRepository.create({ ...userData, password: hashedPassword, loyaltyPoints: 0 });
    const savedUser = await userRepository.save(user);
    return savedUser.id;
  } catch (error: any) {
    console.error('Error creating user:', error);
    throw new DatabaseError('Failed to create user');
  }
};


export const getUser = async (email: string): Promise<User | undefined> => {
  try {
    const userRepository = dataSource.getRepository(User);
    const user = await userRepository.findOne({ where: { email } });
    return user ?? undefined; 
  } catch (error: any) {
    console.error('Error getting user:', error);
    throw new DatabaseError('Failed to get user');
  }
};

export const createReservation = async (reservationData: Omit<Reservation, 'id' | 'status'>): Promise<number> => {
  try {
    const reservationRepository = dataSource.getRepository(Reservation);
    const reservation = reservationRepository.create({ ...reservationData, status: 'active' });
    const savedReservation = await reservationRepository.save(reservation);
    return savedReservation.id;
  } catch (error: any) {
    console.error('Error creating reservation:', error);
    throw new DatabaseError('Failed to create reservation');
  }
};

export const updateReservationStatus = async (reservationId: number, status: string): Promise<number> => {
  try {
    const reservationRepository = dataSource.getRepository(Reservation);
    const result = await reservationRepository.update(reservationId, { status });
    if (result.affected === 0) {
      throw new Error('Reservation not found');
    }
    return result.affected ?? 0;
  } catch (error: any) {
    console.error('Error updating reservation status:', error);
    throw new DatabaseError('Failed to update reservation status');
  }
};

export const createTransaction = async (transactionData: Omit<Transaction, 'id' | 'status'>): Promise<number> => {
  try {
    const transactionRepository = dataSource.getRepository(Transaction);
    const transaction = transactionRepository.create({ ...transactionData, status: 'completed' });
    const savedTransaction = await transactionRepository.save(transaction);
    return savedTransaction.id;
  } catch (error: any) {
    console.error('Error creating transaction:', error);
    throw new DatabaseError('Failed to create transaction');
  }
};

export const updateLoyaltyPoints = async (userId: number, points: number): Promise<number> => {
  try {
    const userRepository = dataSource.getRepository(User);
    const result = await userRepository.increment({ id: userId }, 'loyaltyPoints', points);
    if (result.affected === 0) {
      throw new Error('User not found');
    }
    return result.affected ?? 0;
  } catch (error: any) {
    console.error('Error updating loyalty points:', error);
    throw new DatabaseError('Failed to update loyalty points');
  }
};

export const getAllParkingBays = async (): Promise<ParkingBay[]> => {
  try {
    const parkingBayRepository = dataSource.getRepository(ParkingBay);
    return await parkingBayRepository.find();
  } catch (error: any) {
    console.error('Error getting all parking bays:', error);
    throw new DatabaseError('Failed to get all parking bays');
  }
};

export const updateParkingBayAvailability = async (id: number, available: boolean): Promise<number> => {
  try {
    const parkingBayRepository = dataSource.getRepository(ParkingBay);
    const result = await parkingBayRepository.update(id, { available });
    if (result.affected === 0) {
      throw new Error('Parking bay not found');
    }
    return result.affected ?? 0;
  } catch (error: any) {
    console.error('Error updating parking bay availability:', error);
    throw new DatabaseError('Failed to update parking bay availability');
  }
};

export const loginUser = async (email: string, password: string): Promise<User | null> => {
  try {
    const userRepository = dataSource.getRepository(User);
    const user = await userRepository.findOne({ where: { email } });

    if (user && bcrypt.compareSync(password, user.password)) { 
      return user;
    }
    return null;
  } catch (error: any) {
    console.error('Error logging in user:', error);
    throw new DatabaseError('Failed to login user');
  }
};


export const getRecentReservations = async (userId: number): Promise<Reservation[]> => {
  try {
    const reservationRepository = dataSource.getRepository(Reservation);
    return await reservationRepository.find({
      where: { userId },
      order: { startTime: 'DESC' },
      take: 5,
    });
  } catch (error: any) {
    console.error('Error getting recent reservations:', error);
    throw new DatabaseError('Failed to get recent reservations');
  }
};

export const createParkingBay = async (bayData: Omit<ParkingBay, 'id'>): Promise<number> => {
  try {
    const parkingBayRepository = dataSource.getRepository(ParkingBay);
    const parkingBay = parkingBayRepository.create(bayData);
    const savedBay = await parkingBayRepository.save(parkingBay);
    return savedBay.id;
  } catch (error: any) {
    console.error('Error creating parking bay:', error);
    throw new DatabaseError('Failed to create parking bay');
  }
};

export const updateParkingBay = async (bayData: ParkingBay): Promise<number> => {
  try {
    const parkingBayRepository = dataSource.getRepository(ParkingBay);
    const result = await parkingBayRepository.save(bayData);
    return result.id;
  } catch (error: any) {
    console.error('Error updating parking bay:', error);
    throw new DatabaseError('Failed to update parking bay');
  }
};

export const deleteParkingBay = async (id: number): Promise<number> => {
  try {
    const parkingBayRepository = dataSource.getRepository(ParkingBay);
    const result = await parkingBayRepository.delete(id);
    if (result.affected === 0) {
      throw new Error('Parking bay not found');
    }
    return result.affected ?? 0;
  } catch (error: any) {
    console.error('Error deleting parking bay:', error);
    throw new DatabaseError('Failed to delete parking bay');
  }
};

export const getParkingBayById = async (id: number): Promise<ParkingBay | null> => {
  try {
    const parkingBayRepository = dataSource.getRepository(ParkingBay);
    return await parkingBayRepository.findOne({ where: { id } });
  } catch (error: any) {
    console.error('Error getting parking bay:', error);
    throw new DatabaseError('Failed to get parking bay');
  }
};

export const searchParkingBays = async (query: string): Promise<ParkingBay[]> => {
  try {
    const parkingBayRepository = dataSource.getRepository(ParkingBay);
    return await parkingBayRepository.find({
      where: { title: Like(`%${query}%`) },
    });
  } catch (error: any) {
    console.error('Error searching parking bays:', error);
    throw new DatabaseError('Failed to search parking bays');
  }
};

export const checkTimeSlotAvailability = async (parkingBayId: number, startTime: string, endTime: string): Promise<boolean> => {
  try {
    const reservationRepository = dataSource.getRepository(Reservation);
    const count = await reservationRepository.count({
      where: {
        parkingBayId,
        status: 'active',
        startTime: LessThanOrEqual(new Date(endTime)),
        endTime: MoreThanOrEqual(new Date(startTime)),
      },
    });
    return count === 0;
  } catch (error: any) {
    console.error('Error checking time slot availability:', error);
    throw new DatabaseError('Failed to check time slot availability');
  }
};

export const getAvailableTimeSlots = async (parkingBayId: number, date: string): Promise<{ startTime: string, endTime: string }[]> => {
  try {
    const reservationRepository = dataSource.getRepository(Reservation);
    const reservations = await reservationRepository.find({
        where: {
        parkingBayId,
        startTime: Between(new Date(`${date}T00:00:00`), new Date(`${date}T23:59:59`)),
        status: 'active',
      },
      order: { startTime: 'ASC' },
    });

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
  } catch (error: any) {
    console.error('Error getting available time slots:', error);
    throw new DatabaseError('Failed to get available time slots');
  }
};

export const checkCarReservation = async (carPlate: string): Promise<{ isValid: boolean, reservation?: Reservation }> => {
  try {
    const reservationRepository = dataSource.getRepository(Reservation);
    const now = new Date();
    const reservation = await reservationRepository.findOne({
      where: {
        carPlate,
        status: 'active',
        startTime: LessThanOrEqual(now),
        endTime: MoreThanOrEqual(now),
      },
    });

    return {
      isValid: !!reservation,
      reservation: reservation ?? undefined, 
    };
  } catch (error: any) {
    console.error('Error checking car reservation:', error);
    throw new DatabaseError('Failed to check car reservation');
  }
};

export const refundReservation = async (reservationId: number, adminId: number): Promise<void> => {
  try {
    await dataSource.transaction(async transactionalEntityManager => {
      await transactionalEntityManager.update(Reservation, reservationId, { status: 'refunded' });

      const transaction = await transactionalEntityManager.findOne(Transaction, { where: { reservationId } });

      if (!transaction) {
        throw new Error('No transaction found for this reservation');
      }

      await transactionalEntityManager.save(Transaction, {
        userId: transaction.userId,
        reservationId,
        amount: -transaction.amount,
        paymentMethod: 'refund',
        status: 'completed',
      });

      await transactionalEntityManager.insert('admin_actions', {
        adminId,
        action: 'refund',
        reservationId,
      });
    });
  } catch (error: any) {
    console.error('Error refunding reservation:', error);
    throw new DatabaseError('Failed to refund reservation');
  }
};

export const cancelReservation = async (reservationId: number, adminId: number): Promise<void> => {
  try {
    await dataSource.transaction(async transactionalEntityManager => {
      await transactionalEntityManager.update(Reservation, reservationId, { status: 'cancelled' });

      await transactionalEntityManager.insert('admin_actions', {
        adminId,
        action: 'cancel',
        reservationId,
      });
    });
  } catch (error: any) {
    console.error('Error cancelling reservation:', error);
    throw new DatabaseError('Failed to cancel reservation');
  }
};

export const checkAndLockTimeSlot = async (parkingBayId: number, startTime: string, endTime: string): Promise<boolean> => {
  try {
    const reservationRepository = dataSource.getRepository(Reservation);
    const count = await reservationRepository.count({
      where: {
        parkingBayId,
        startTime: LessThanOrEqual(new Date(endTime)),
        endTime: MoreThanOrEqual(new Date(startTime)),
      },
    });

    if (count > 0) {
      return false;
    }

    await dataSource.getRepository('reservation_locks').insert({
      parkingBayId,
      startTime,
      endTime,
      lockExpiration: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
    });

    return true;
  } catch (error: any) {
    console.error('Error checking and locking time slot:', error);
    return false;
  }
};

export const initializeGweruParkingBays = async (): Promise<void> => {
  try {
    const parkingBayRepository = dataSource.getRepository(ParkingBay);
    
    const gweruParkingBays = [
      { title: "Gweru Central 1", latitude: -19.451123, longitude: 29.816234, available: true },
      { title: "Gweru Central 2", latitude: -19.451456, longitude: 29.816789, available: true },
      { title: "Gweru Main Street 1", latitude: -19.452345, longitude: 29.817890, available: true },
      { title: "Gweru Main Street 2", latitude: -19.452678, longitude: 29.818123, available: true },
      { title: "Gweru City Hall", latitude: -19.453210, longitude: 29.819345, available: true },
      { title: "Gweru Market Square 1", latitude: -19.453789, longitude: 29.820123, available: true },
      { title: "Gweru Market Square 2", latitude: -19.454012, longitude: 29.820456, available: true },
      { title: "Gweru Hospital", latitude: -19.454567, longitude: 29.821234, available: true },
      { title: "Gweru Park 1", latitude: -19.455123, longitude: 29.822345, available: true },
      { title: "Gweru Park 2", latitude: -19.455456, longitude: 29.822678, available: true },
      { title: "Gweru Shopping Center 1", latitude: -19.456012, longitude: 29.823456, available: true },
      { title: "Gweru Shopping Center 2", latitude: -19.456345, longitude: 29.823789, available: true },
      { title: "Gweru Library", latitude: -19.456789, longitude: 29.824123, available: true },
      { title: "Gweru Sports Complex 1", latitude: -19.457234, longitude: 29.824567, available: true },
      { title: "Gweru Sports Complex 2", latitude: -19.457567, longitude: 29.824890, available: true },
      { title: "Gweru Train Station", latitude: -19.458012, longitude: 29.825234, available: true },
      { title: "Gweru Bus Terminal 1", latitude: -19.458456, longitude: 29.825678, available: true },
      { title: "Gweru Bus Terminal 2", latitude: -19.458789, longitude: 29.826012, available: true },
      { title: "Gweru Industrial Area 1", latitude: -19.459234, longitude: 29.826456, available: true },
      { title: "Gweru Industrial Area 2", latitude: -19.459567, longitude: 29.826789, available: true },
    ];

    for (const bay of gweruParkingBays) {
      const existingBay = await parkingBayRepository.findOne({ where: { title: bay.title } });
      if (!existingBay) {
        await parkingBayRepository.save(bay);
      }
    }

    console.log('Gweru parking bays initialized successfully');
  } catch (error: any) {
    console.error('Error initializing Gweru parking bays:', error);
    throw new DatabaseError('Failed to initialize Gweru parking bays');
  }
};





