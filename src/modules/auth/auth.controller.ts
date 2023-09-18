import { Controller, Post, Query, Res } from '@nestjs/common';
import { AuthService } from './auth.service';
import {
  ApiBadRequestResponse,
  ApiCreatedResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { responseTemplate } from '@/utils';
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
    description: 'Authorization Code가 주어지지 않았거나 올바르지 않습니다.',
  })
  @ApiOperation({
    summary: 'Github OAuth를 이용한 로그인(회원가입)을 수행합니다.',
  })
  @ApiQuery({
    name: 'code',
    required: true,
    description: 'Github OAuth의 Authorization Code',
  })
  @Post('login')
  async login(@Query('code') code: string, @Res() res: Response) {
    /**
     * 1. 인증 코드로부터 사용자 정보를 얻어온다.
     */
    const accessToken = await this.authService.getGithubAccessToken(code);

    const { snsId, name } =
      await this.authService.getGithubUserInfo(accessToken);

    /**
     * 2. 사용자 정보를 이용해 회원가입을 진행한다.
     */
    await this.authService.registerUser(snsId, name);

    const jwtToken = this.authService.createJwtToken(snsId, name);

    /**
     * 3. 사용자 정보를 이용하여 JWT 토큰을 발급해 쿠키에 저장한다.
     */
    res.cookie('accessToken', jwtToken, {
      maxAge: TWO_MONTH_MILLISECOND,
      httpOnly: true,
    });

    return res.send(responseTemplate('정상적으로 로그인 되었습니다.', {}));
  }
}
