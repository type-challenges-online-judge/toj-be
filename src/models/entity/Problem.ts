import { Entity, Column, PrimaryGeneratedColumn, OneToMany } from 'typeorm';
import { BaseEntity } from './BaseEntity';
import { SubmitCode, TestCase } from '.';

@Entity()
export class Problem extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 100 })
  title: string;

  @Column()
  description: string;

  @Column({ length: 20 })
  language: string;

  @Column('smallint')
  level: number;

  @Column()
  template: string;

  @OneToMany(() => SubmitCode, (submitCode) => submitCode.problem)
  submitCode: SubmitCode[];

  @OneToMany(() => TestCase, (testcase) => testcase.problem)
  testCase: TestCase[];
}
