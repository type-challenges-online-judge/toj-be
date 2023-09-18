import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import type { Response, Request } from 'express';
import { Cookies, Middleware, Req } from '@/decorators';
import { tokenService } from '@/utils/token.service';

@Injectable()
export class AuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<Request>();
    const res = context.switchToHttp().getResponse<Response>();

    if (!this.verifyUser.apply(this, [req, res])) {
      throw new UnauthorizedException('권한이 없습니다.');
    }

    return true;
  }

  @Middleware
  verifyUser(
    @Cookies('accessToken') accessToken: string,
    @Req req: Request,
  ): boolean {
    const decoded = tokenService.decodeToken(accessToken);

    if (!decoded) {
      return false;
    }

    req['user'] = decoded;

    return true;
  }
}
