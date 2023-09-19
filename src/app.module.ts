import { Module } from '@nestjs/common';
import { AppController } from '@/app.controller';
import { ProblemModule } from '@/modules/problem/problem.module';
import { AppService } from '@/app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { dataSourceOptions } from '@/models/data-source';
import { AuthModule } from './modules/auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forRoot(dataSourceOptions),
    ProblemModule,
    AuthModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
