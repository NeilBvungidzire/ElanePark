import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { IsNotEmpty, IsNumber, IsBoolean } from 'class-validator';

@Entity()
export class ParkingBay {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar' })  
  @IsNotEmpty()  
  title!: string;

  @Column({ type: 'decimal', precision: 10, scale: 7 })  
  @IsNumber()  
  latitude!: number;

  @Column({ type: 'decimal', precision: 10, scale: 7 })  
  @IsNumber()  
  longitude!: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 1.00 })  
  @IsNumber()  
  price!: number;

  @Column({ type: 'boolean', default: true }) 
  @IsBoolean()  
  available!: boolean;
}
