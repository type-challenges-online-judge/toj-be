import 'dotenv/config';

class ConfigService {
  constructor(private env: { [key: string]: string | undefined }) {}

  private getValue(key: string, throwOnMissing = true): string {
    const value = this.env[key];

    if (value === undefined && throwOnMissing) {
      throw new Error(`환경 변수 에러 - env.${key} 누락`);
    }

    return value;
  }

  public ensureValues(keys: string[]): ConfigService {
    keys.forEach((key) => {
      this.getValue(key, true);
    });

    return this;
  }

  public isProduction() {
    const mode = this.getValue('MODE');

    return mode !== 'DEV';
  }
}

const configService = new ConfigService(process.env).ensureValues(['MODE']);

export { configService };
