import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { IsEmail, Length, IsString, IsPhoneNumber, Min } from 'class-validator';

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar', unique: true })  
  @IsEmail()
  email!: string;

  @Column({ type: 'varchar' })  
  password!: string;

  @Column({ type: 'varchar' })  
  @IsString()
  fullName!: string;

  @Column({ type: 'varchar' })  
  @IsPhoneNumber(undefined)
  phoneNumber!: string;

  @Column({ type: 'int', default: 0 })  
  @Min(0)
  loyaltyPoints!: number;
}
