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

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * 로그인 API
   */
  @ApiCreatedResponse({
    description:
      '로그인(회원가입)이 성공적으로 수행되었을 경우 `accessToken`을 반환합니다.',
    schema: {
      example: {
        message: '로그인 인증을 위한 Access Token이 성공적으로 발급되었습니다.',
        data: {
          accessToken: '{access token}',
        },
      },
    },
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
   * 로그아웃 API
   *
   * 로그인 인증을 위한 accessToken을 쿠키에 저장하여 관리하던 방식에서, Authorization 헤더에 저장하도록 변경되면서 해당 API를 사용하지 않도록 처리함.
   */
  @ApiOkResponse({
    description: '성공적으로 로그아웃 되었습니다.',
  })
  @ApiUnauthorizedResponse({
    description: '로그인 되어있지 않습니다.',
  })
  @ApiOperation({
    summary: '로그인 인증에 사용되는 accessToken 쿠키를 삭제합니다.',
    deprecated: true,
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
