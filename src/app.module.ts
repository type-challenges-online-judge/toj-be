import { Module } from '@nestjs/common';
import { AppController } from '@/app.controller';
import { ProblemModule } from '@/modules/problem/problem.module';
import { AppService } from '@/app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { dataSourceOptions } from '@/models/data-source';

@Module({
  imports: [TypeOrmModule.forRoot(dataSourceOptions), ProblemModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
