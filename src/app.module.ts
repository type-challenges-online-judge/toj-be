import { Module } from '@nestjs/common';
import { ProblemModule } from '@/modules/problem/problem.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { dataSourceOptions } from '@/models/data-source';
import { AuthModule } from './modules/auth/auth.module';
import { UserModule } from './modules/user/user.module';

@Module({
  imports: [
    TypeOrmModule.forRoot(dataSourceOptions),
    ProblemModule,
    AuthModule,
    UserModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
