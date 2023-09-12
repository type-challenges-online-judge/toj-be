import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { BaseEntity } from './BaseEntity';

@Entity()
export class User extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  snsId: number;

  @Column({ length: 255 })
  name: string;

  @Column({ length: 320 })
  email: string;
}
