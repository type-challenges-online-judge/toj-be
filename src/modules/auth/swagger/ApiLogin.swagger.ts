import { applyDecorators } from '@nestjs/common';
import {
  ApiCreatedResponse,
  ApiBadRequestResponse,
  ApiOperation,
  ApiQuery,
} from '@nestjs/swagger';
import { configService } from '@/config/config.service';

export const ApiLogin = () => {
  return applyDecorators(
    ApiCreatedResponse({
      description:
        '로그인(회원가입)이 성공적으로 수행되었을 경우 `accessToken`을 반환합니다.',
      schema: {
        example: {
          message:
            '로그인 인증을 위한 Access Token이 성공적으로 발급되었습니다.',
          data: {
            accessToken: '{access token}',
          },
        },
      },
    }),
    ApiBadRequestResponse({
      description:
        '이미 로그인 된 상태이거나, Authorization Code가 올바르지 않습니다.',
    }),
    ApiOperation({
      summary: 'Github OAuth를 이용한 로그인(회원가입)을 수행합니다.',
      description: `Github OAuth 🔗 : [[이동]](https://github.com/login/oauth/authorize?client_id=${configService.GITHUB_OAUTH_CLIENT_ID})`,
    }),
    ApiQuery({
      name: 'code',
      required: true,
      description: 'Github OAuth의 Authorization Code',
    }),
  );
};
