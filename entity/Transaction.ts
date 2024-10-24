import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { User } from './User';
import { Reservation } from './Reservation';
import { IsDecimal, IsString } from 'class-validator';

@Entity()
export class Transaction {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => User, user => user.id)
  userId!: number;

  @ManyToOne(() => Reservation, reservation => reservation.id)
  reservationId!: number;

  @Column('decimal')
  @IsDecimal()
  amount!: number;

  @Column({ type: 'varchar' })
  @IsString()
  paymentMethod!: string;

  @Column({ type: 'varchar' })
  @IsString()
  status!: string;
}
