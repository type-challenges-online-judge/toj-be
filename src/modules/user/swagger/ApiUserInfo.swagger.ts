import { applyDecorators } from '@nestjs/common';
import {
  ApiOperation,
  ApiOkResponse,
  ApiUnauthorizedResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';

export const ApiUserInfo = () => {
  return applyDecorators(
    ApiOperation({
      summary: '현재 로그인 된 사용자의 정보를 제공하는 API입니다.',
    }),
    ApiOkResponse({
      description: '로그인 된 사용자의 정보를 성공적으로 조회했습니다.',
      schema: {
        example: {
          message: '성공적으로 사용자 정보를 조회했습니다.',
          data: {
            snsId: 1234567890,
            name: '{user name}',
            profileUrl: '{user github profile url}',
          },
        },
      },
    }),
    ApiUnauthorizedResponse({
      description: '로그인이 되어있지 않은 상태입니다.',
    }),
    ApiBearerAuth(),
  );
};
