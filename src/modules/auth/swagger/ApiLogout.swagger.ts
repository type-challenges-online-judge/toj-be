import { applyDecorators } from '@nestjs/common';
import {
  ApiOkResponse,
  ApiUnauthorizedResponse,
  ApiOperation,
} from '@nestjs/swagger';

export const ApiLogout = () => {
  return applyDecorators(
    ApiOkResponse({
      description: '성공적으로 로그아웃 되었습니다.',
    }),
    ApiUnauthorizedResponse({
      description: '로그인 되어있지 않습니다.',
    }),
    ApiOperation({
      summary: '로그인 인증에 사용되는 accessToken 쿠키를 삭제합니다.',
      deprecated: true,
    }),
  );
};
