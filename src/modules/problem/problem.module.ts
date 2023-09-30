import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProblemController } from './problem.controller';
import { ProblemService } from './problem.service';
import { Problem } from '@/modules/problem/entities';
import { TestCase } from '@/modules/problem/entities';

@Module({
  imports: [TypeOrmModule.forFeature([Problem, TestCase])],
  controllers: [ProblemController],
  providers: [ProblemService],
  exports: [ProblemService, TypeOrmModule],
})
export class ProblemModule {}
