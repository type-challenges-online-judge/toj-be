import { Module } from '@nestjs/common';
import { SubmitController } from './submit.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SubmitCode } from '@/models/entities';
import { SubmitService } from './submit.service';

@Module({
  imports: [TypeOrmModule.forFeature([SubmitCode])],
  controllers: [SubmitController],
  providers: [SubmitService],
})
export class SubmitModule {}
