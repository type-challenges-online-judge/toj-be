import 'dotenv/config';

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
] as const;

const configService = new ConfigService(process.env)
  .ensureValues(Object.values(requiredEnvironments), true)
  .ensureValues(
    Object.values(nonRequiredEnvironments),
    false,
  ) as ConfigService &
  TupleToObject<typeof requiredEnvironments> &
  TupleToObject<typeof nonRequiredEnvironments>;

export { configService };
