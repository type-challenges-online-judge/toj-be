import { applyDecorators } from '@nestjs/common';
import { SubmitCodeData } from '../dto';
import {
  ApiBody,
  ApiParam,
  ApiUnauthorizedResponse,
  ApiOperation,
  ApiCreatedResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';

export const ApiSubmitCode = () => {
  return applyDecorators(
    ApiBody({
      type: SubmitCodeData,
    }),
    ApiParam({
      name: 'id',
      required: true,
      description: '문제의 고유 id',
    }),
    ApiUnauthorizedResponse({
      description: '로그인 되어있지 않습니다.',
    }),
    ApiOperation({
      summary: '문제에 대한 사용자의 정답을 제출받아 채점을 진행합니다.',
    }),
    ApiCreatedResponse({
      description: '정답 제출이 완료되어 채점이 시작되었습니다.',
      schema: {
        example: {
          message: '정답 제출이 완료되어 채점이 시작되었습니다.',
          data: {
            submitCodeId: 1234,
          },
        },
      },
    }),
    ApiBearerAuth(),
  );
};
