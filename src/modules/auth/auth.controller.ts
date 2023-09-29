import { Controller, Get, Post, Query, Res, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { ApiTags } from '@nestjs/swagger';
import { responseTemplate } from '@/utils';
import { AuthGuard, ReverseAuthGuard } from '@/guards';
import { ApiLogin, ApiLogout } from './swagger';
import type { Response } from 'express';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @ApiLogin()
  @UseGuards(ReverseAuthGuard)
  @Post('login')
  async login(@Query('code') code: string) {
    /**
     * 1. 인증 코드로부터 사용자 정보를 얻어온다.
     */
    const githubAccessToken = await this.authService.getGithubAccessToken(code);

    const { snsId, name, profileUrl } =
      await this.authService.getGithubUserInfo(githubAccessToken);

    /**
     * 2. 사용자 정보를 이용해 회원가입을 진행한다.
     */
    await this.authService.registerUser(snsId, name, profileUrl);

    /**
     * 3. 사용자 정보를 이용하여 JWT 토큰을 발급해 반환한다.
     */
    const jwtToken = this.authService.createJwtToken(snsId);

    return responseTemplate('정상적으로 로그인 되었습니다.', {
      accessToken: jwtToken,
    });
  }

  /**
   * 로그인 인증을 위한 accessToken을 쿠키에 저장하여 관리하던 방식에서,
   * Authorization 헤더에 저장하도록 변경되면서 해당 API를 사용하지 않도록 처리함.
   */
  @ApiLogout()
  @UseGuards(AuthGuard)
  @Get('logout')
  async logout(@Res() res: Response) {
    res.cookie('accessToken', '', {
      maxAge: 0,
    });

    res.send(responseTemplate('성공적으로 로그아웃 되었습니다.', {}));
  }
}
