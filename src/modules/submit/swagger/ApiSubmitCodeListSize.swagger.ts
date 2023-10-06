import { applyDecorators } from '@nestjs/common';
import {
  ApiOkResponse,
  ApiOperation,
  ApiBadRequestResponse,
} from '@nestjs/swagger';

export const ApiSubmitCodeListSize = () => {
  return applyDecorators(
    ApiOperation({
      summary: '조건과 일치하는 제출 목록의 리스트의 개수를 반환합니다.',
    }),
    ApiOkResponse({
      description: '성공적으로 제출 리스트의 개수를 조회했습니다.',
      schema: {
        example: {
          message: '성공적으로 제출 리스트의 개수를 조회했습니다.',
          data: 2,
        },
      },
    }),
    ApiBadRequestResponse({
      description:
        '쿼리 스트링의 필수 속성을 입력하지 않았거나, 올바른 타입의 값을 전달하지 않았습니다.',
    }),
  );
};
