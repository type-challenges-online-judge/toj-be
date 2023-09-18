import * as jwt from 'jsonwebtoken';
import { configService } from '@/config/config.service';

class TokenService {
  JWT_EXPIRES_IN = '1h';
  JWT_ISSUER = 'toj';

  createToken(payload: string | Buffer | object): string {
    return jwt.sign(payload, configService.JWT_SECRET, {
      expiresIn: this.JWT_EXPIRES_IN,
      issuer: this.JWT_ISSUER,
    });
  }

  decodeToken(accessToken: string): jwt.JwtPayload | null {
    try {
      const decoded = jwt.verify(accessToken, configService.JWT_SECRET);

      if (typeof decoded === 'string') {
        return null;
      }

      return decoded;
    } catch (e) {
      console.error(e);

      return null;
    }
  }

  get issuer() {
    return this.JWT_ISSUER;
  }
}

export const tokenService = new TokenService();
