import { Controller, Get, Post, Query, Res, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import {
  ApiBadRequestResponse,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { responseTemplate } from '@/utils';
import { AuthGuard, ReverseAuthGuard } from '@/guards/auth.guard';
import type { Response } from 'express';

const TWO_MONTH_MILLISECOND = 1000 * 60 * 60 * 24 * 30 * 2;

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @ApiCreatedResponse({
    description:
      '로그인(회원가입)이 성공적으로 수행되었고 `accessToken` 쿠키가 발급되었습니다.',
  })
  @ApiBadRequestResponse({
    description:
      '이미 로그인 된 상태이거나, Authorization Code가 올바르지 않습니다.',
  })
  @ApiOperation({
    summary: 'Github OAuth를 이용한 로그인(회원가입)을 수행합니다.',
  })
  @ApiQuery({
    name: 'code',
    required: true,
    description: 'Github OAuth의 Authorization Code',
  })
  @UseGuards(ReverseAuthGuard)
  @Post('login')
  async login(@Query('code') code: string, @Res() res: Response) {
    /**
     * 1. 인증 코드로부터 사용자 정보를 얻어온다.
     */
    const accessToken = await this.authService.getGithubAccessToken(code);

    const { snsId, name, profileUrl } =
      await this.authService.getGithubUserInfo(accessToken);

    /**
     * 2. 사용자 정보를 이용해 회원가입을 진행한다.
     */
    await this.authService.registerUser(snsId, name, profileUrl);

    /**
     * 3. 사용자 정보를 이용하여 JWT 토큰을 발급해 쿠키에 저장한다.
     */
    const jwtToken = this.authService.createJwtToken(snsId);

    res.cookie('accessToken', jwtToken, {
      maxAge: TWO_MONTH_MILLISECOND,
      httpOnly: true,
    });

    return res.send(responseTemplate('정상적으로 로그인 되었습니다.', {}));
  }

  @ApiOkResponse({
    description: '성공적으로 로그아웃 되었습니다.',
  })
  @ApiUnauthorizedResponse({
    description: '로그인 되어있지 않습니다.',
  })
  @ApiOperation({
    summary: '로그인 인증에 사용되는 accessToken 쿠키를 삭제합니다.',
  })
  @Get('logout')
  @UseGuards(AuthGuard)
  async logout(@Res() res: Response) {
    res.cookie('accessToken', '', {
      maxAge: 0,
    });

    res.send(responseTemplate('성공적으로 로그아웃 되었습니다.', {}));
  }
}
