import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { User } from '@/modules/user/entities';
import { SubmitCode } from '@/modules/submit/entities';

@Module({
  imports: [TypeOrmModule.forFeature([User, SubmitCode])],
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService, TypeOrmModule],
})
export class UserModule {}
