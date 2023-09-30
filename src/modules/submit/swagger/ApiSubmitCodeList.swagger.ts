import { applyDecorators } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

export const ApiSubmitCodeList = () => {
  return applyDecorators(
    ApiOperation({
      summary: '조건과 일치하는 제출 목록의 리스트를 반환합니다.',
    }),
    ApiOkResponse({}),
    ApiBearerAuth(),
  );
};
