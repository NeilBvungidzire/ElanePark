import { DataSourceOptions } from 'typeorm';
import { User } from './entity/User';
import { Reservation } from './entity/Reservation';
import { Transaction } from './entity/Transaction';
import { ParkingBay } from './entity/ParkingBay';

const config: DataSourceOptions = {
  type: 'react-native',
  database: 'parkingapp.db',
  location: 'default',
  logging: ['error', 'query', 'schema'],
  synchronize: true,
  entities: [User, Reservation, Transaction, ParkingBay],
};

export default config;
