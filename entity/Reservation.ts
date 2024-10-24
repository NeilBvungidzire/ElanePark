import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { User } from './User';
import { ParkingBay } from './ParkingBay';
import { IsString, IsDateString, IsInt } from 'class-validator';

@Entity()
export class Reservation {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'int' })
  @IsInt()
  @ManyToOne(() => User, user => user.id)
  userId!: number;

  @Column({ type: 'int' })
  @IsInt()
  @ManyToOne(() => ParkingBay, parkingBay => parkingBay.id)
  parkingBayId!: number;

  @Column({ type: 'datetime' })
  @IsDateString()
  startTime!: Date;

  @Column({ type: 'datetime' })
  @IsDateString()
  endTime!: Date;

  @Column({ type: 'varchar', length: 20 })
  @IsString()
  status!: string;

  @Column({ type: 'varchar', length: 20 })
  @IsString()
  carPlate!: string;
}
