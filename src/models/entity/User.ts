import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { BaseEntity } from './BaseEntity';
import { SubmitCode } from '.';

@Entity()
export class User extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column('int')
  snsId: number;

  @Column({ length: 255 })
  name: string;

  @Column({ length: 320 })
  email: string;

  @OneToMany(() => SubmitCode, (submitCode) => submitCode.user)
  submitCode: SubmitCode[];
}
