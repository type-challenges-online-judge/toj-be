import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { User } from '@/models/entity/User';
import { configService } from '@/config/config.service';

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: configService.POSTGRE_HOST,
  port: parseInt(configService.POSTGRE_PORT),
  username: configService.POSTGRE_USERNAME,
  password: configService.POSTGRE_PASSWORD,
  database: configService.POSTGRE_DATABASE,
  synchronize: configService.isProduction() ? false : true,
  logging: false,
  entities: [User],
  migrations: [],
  subscribers: [],
});
