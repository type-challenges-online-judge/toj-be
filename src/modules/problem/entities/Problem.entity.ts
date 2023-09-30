import { Entity, Column, PrimaryGeneratedColumn, OneToMany } from 'typeorm';
import { BaseEntity } from '@/common/entities';
import { SubmitCode } from '@/modules/submit/entities';
import { TestCase } from '@/modules/problem/entities';

@Entity()
export class Problem extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 100, unique: true })
  title: string;

  @Column('smallint')
  number: number;

  @Column()
  description: string;

  @Column({ length: 20 })
  language: string;

  @Column({ length: 20 })
  level: string;

  @Column()
  template: string;

  @OneToMany(() => SubmitCode, (submitCode) => submitCode.problem)
  submitCode: SubmitCode[];

  @OneToMany(() => TestCase, (testcase) => testcase.problem)
  testCase: TestCase[];
}
