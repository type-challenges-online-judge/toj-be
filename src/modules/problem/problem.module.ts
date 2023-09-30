import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProblemController } from './problem.controller';
import { ProblemService } from './problem.service';
import { Problem } from '@/modules/problem/entities';
import { TestCase } from '@/modules/problem/entities';
import { SubmitCode } from '@/modules/submit/entities';
import { User } from '@/modules/user/entities';

@Module({
  imports: [TypeOrmModule.forFeature([Problem, SubmitCode, User, TestCase])],
  controllers: [ProblemController],
  providers: [ProblemService],
})
export class ProblemModule {}
