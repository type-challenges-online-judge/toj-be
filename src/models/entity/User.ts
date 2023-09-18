import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { BaseEntity } from './BaseEntity';
import { SubmitCode } from '.';

@Entity()
export class User extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int', unique: true })
  snsId: number;

  @Column({ length: 255 })
  name: string;

  @OneToMany(() => SubmitCode, (submitCode) => submitCode.user)
  submitCode: SubmitCode[];
}
