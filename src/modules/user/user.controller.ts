import {
  Controller,
  Get,
  Req,
  UseGuards,
  InternalServerErrorException,
} from '@nestjs/common';
import { AuthGuard } from '@/guards/auth.guard';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { UserService } from './user.service';
import type { Request } from 'express';
import type { JwtPayload } from 'jsonwebtoken';
import { responseTemplate } from '@/utils';

@ApiTags('user')
@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  @Get('info')
  async getUserInfo(@Req() req: Request) {
    const decodedUserToken = req['user'] as JwtPayload | undefined;

    /**
     * Guard를 통과하였을 경우 req.user 가 존재하여야 하지만 그렇지 않을 경우의 예외처리
     */
    if (!decodedUserToken) {
      throw new InternalServerErrorException('서버 오류.');
    }

    /**
     * JWT 토큰에 저장되어있는 snsId값을 추출해 사용자 정보를 획득
     */
    const { snsId } = decodedUserToken;

    if (typeof snsId !== 'number') {
      throw new InternalServerErrorException('서버 오류.');
    }

    const userInfo = await this.userService.getUserInfo(snsId);

    return responseTemplate('성공적으로 사용자 정보를 조회했습니다.', userInfo);
  }
}
