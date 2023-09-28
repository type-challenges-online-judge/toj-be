import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { Middleware, Req, Auth } from '@/decorators';
import { tokenService } from '@/utils/token.service';
import type { Response, Request } from 'express';

class ValidationMiddlewars {
  @Middleware()
  verifyUser(
    @Auth('Bearer') accessToken: string,
    @Req() req: Request,
  ): boolean {
    const decoded = tokenService.decodeToken(accessToken);

    if (!decoded) {
      return false;
    }

    if (decoded.exp * 1000 < Date.now()) {
      return false;
    }

    if (decoded.iss !== tokenService.issuer) {
      return false;
    }

    // 토큰의 유효성을 검사하는 함수에서 응답 객체에 토큰 값을 저장하는 것이 맞을까?
    req['user'] = decoded;

    return true;
  }
}

@Injectable()
export class AuthGuard extends ValidationMiddlewars implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<Request>();
    const res = context.switchToHttp().getResponse<Response>();

    if (!this.verifyUser.apply(this, [req, res])) {
      throw new UnauthorizedException('권한이 없습니다.');
    }

    return true;
  }
}

export class ReverseAuthGuard
  extends ValidationMiddlewars
  implements CanActivate
{
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<Request>();
    const res = context.switchToHttp().getResponse<Response>();

    if (this.verifyUser.apply(this, [req, res])) {
      throw new BadRequestException('로그인 된 상태로 처리할 수 없습니다.');
    }

    return true;
  }
}
