import { applyDecorators } from '@nestjs/common';
import { ApiOkResponse, ApiOperation } from '@nestjs/swagger';

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
  );
};
