import { Entity, Column, PrimaryGeneratedColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from './BaseEntity';
import { User, Problem } from '.';

@Entity()
export class SubmitCode extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  code: string;

  @Column({ type: 'boolean', default: false, nullable: true })
  isHidden: boolean;

  @Column('smallint')
  correct_score: number;

  @Column('smallint')
  valid_score: number;

  @ManyToOne(() => User, (user) => user.submitCode, { nullable: false })
  user: User;

  @ManyToOne(() => Problem, (problem) => problem.submitCode, {
    nullable: false,
  })
  problem: Problem;
}
