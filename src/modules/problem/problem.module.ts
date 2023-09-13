import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProblemController } from './problem.controller';
import { ProblemService } from './problem.service';
import { Problem } from '@/models/entity';

@Module({
  imports: [TypeOrmModule.forFeature([Problem])],
  controllers: [ProblemController],
  providers: [ProblemService],
})
export class ProblemModule {}
