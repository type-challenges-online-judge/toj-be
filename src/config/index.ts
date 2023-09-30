import 'dotenv/config';
import type { DataSourceOptions } from 'typeorm';
import { ROOT_PATH } from '@/constants';
import { join } from 'path';
import { User } from '@/modules/user/entities';
import { SubmitCode } from '@/modules/submit/entities';
import { Problem } from '@/modules/problem/entities';
import { TestCase } from '@/modules/problem/entities';

class ConfigService {
  constructor(private env: { [key: string]: string | undefined }) {}

  private getEnvValue(key: string, throwOnMissing: boolean): string {
    const value = this.env[key];

    if (value === undefined && throwOnMissing) {
      throw new Error(`환경 변수 에러 - env.${key} 누락`);
    }

    return value;
  }

  public ensureValues(keys: string[], throwOnMissing = false): ConfigService {
    keys.forEach((key) => {
      const value = this.getEnvValue(key, throwOnMissing);

      if (this.hasOwnProperty(key)) {
        return;
      }

      Object.defineProperty(this, key, {
        get() {
          return value;
        },
      });
    });

    return this;
  }

  public isProduction() {
    const mode = this['MODE'];

    return mode !== 'DEV';
  }
}

const nonRequiredEnvironments = ['GITHUB_PERSONAL_TOKEN'] as const;

const requiredEnvironments = [
  'MODE',
  'POSTGRE_HOST',
  'POSTGRE_PORT',
  'POSTGRE_USERNAME',
  'POSTGRE_PASSWORD',
  'POSTGRE_DATABASE',
  'GITHUB_OAUTH_CLIENT_ID',
  'GITHUB_OAUTH_CLIENT_SECRET',
  'JWT_SECRET',
] as const;

export const configService = new ConfigService(process.env)
  .ensureValues(Object.values(requiredEnvironments), true)
  .ensureValues(
    Object.values(nonRequiredEnvironments),
    false,
  ) as ConfigService &
  TupleToObject<typeof requiredEnvironments> &
  TupleToObject<typeof nonRequiredEnvironments>;

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
