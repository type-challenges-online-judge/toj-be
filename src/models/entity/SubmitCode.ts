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

  @Column('real')
  correct_score: number;

  @Column('real')
  valid_score: number;

  @ManyToOne(() => User, (user) => user.submitCode, { nullable: false })
  user: User;

  @ManyToOne(() => Problem, (problem) => problem.submitCode, {
    nullable: false,
  })
  problem: Problem;
}
