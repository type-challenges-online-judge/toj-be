import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProblemController } from './problem.controller';
import { ProblemService } from './problem.service';
import { Problem, SubmitCode, User, TestCase } from '@/models/entity';

@Module({
  imports: [TypeOrmModule.forFeature([Problem, SubmitCode, User, TestCase])],
  controllers: [ProblemController],
  providers: [ProblemService],
})
export class ProblemModule {}
