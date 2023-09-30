import { Module } from '@nestjs/common';
import { SubmitController } from './submit.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SubmitCode } from '@/modules/submit/entities';
import { SubmitService } from './submit.service';
import { ProblemService } from '@/modules/problem/problem.service';
import { ProblemModule } from '@/modules/problem/problem.module';
import { UserService } from '@/modules/user/user.service';
import { UserModule } from '@/modules/user/user.module';

@Module({
  imports: [UserModule, ProblemModule, TypeOrmModule.forFeature([SubmitCode])],
  controllers: [SubmitController],
  providers: [SubmitService, ProblemService, UserService],
})
export class SubmitModule {}
