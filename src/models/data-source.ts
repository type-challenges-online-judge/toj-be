import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { User, SubmitCode, Problem, TestCase } from '@/models/entity';
import { configService } from '@/config/config.service';
import { join } from 'path';
import type { DataSourceOptions } from 'typeorm';
import { ROOT_PATH } from '@/constants';

export const dataSourceOptions: DataSourceOptions = {
  type: 'postgres',
  host: configService.POSTGRE_HOST,
  port: parseInt(configService.POSTGRE_PORT),
  username: configService.POSTGRE_USERNAME,
  password: configService.POSTGRE_PASSWORD,
  database: configService.POSTGRE_DATABASE,
  synchronize: !configService.isProduction(),
  logging: !configService.isProduction(),
  entities: [User, SubmitCode, Problem, TestCase],
  migrations: [
    configService.isProduction()
      ? join(ROOT_PATH, 'src', 'models', 'migrations', '*.ts')
      : '',
  ],
  subscribers: [],
};

export const AppDataSource = new DataSource(dataSourceOptions);
