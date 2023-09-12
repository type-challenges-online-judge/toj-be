import 'dotenv/config';

class ConfigService {
  constructor(private env: { [key: string]: string | undefined }) {}

  private getEnvValue(key: string, throwOnMissing = true): string {
    const value = this.env[key];

    if (value === undefined && throwOnMissing) {
      throw new Error(`환경 변수 에러 - env.${key} 누락`);
    }

    return value;
  }

  public ensureValues(keys: string[]): ConfigService {
    keys.forEach((key) => {
      const value = this.getEnvValue(key, true);

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

const requiredEnvironments = [
  'MODE',
  'POSTGRE_HOST',
  'POSTGRE_PORT',
  'POSTGRE_USERNAME',
  'POSTGRE_PASSWORD',
  'POSTGRE_DATABASE',
] as const;

const configService = new ConfigService(process.env).ensureValues(
  Object.values(requiredEnvironments),
) as ConfigService & TupleToObject<typeof requiredEnvironments>;

export { configService };
