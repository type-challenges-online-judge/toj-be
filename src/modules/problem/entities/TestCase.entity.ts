import { Column, Entity, PrimaryGeneratedColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '@/common/entities';
import { Problem } from './Problem.entity';

@Entity()
export class TestCase extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  case: string;

  @Column()
  template: string;

  @Column({ length: 20 })
  type: string;

  @ManyToOne(() => Problem, (problem) => problem.testCase)
  problem: Problem;
}
