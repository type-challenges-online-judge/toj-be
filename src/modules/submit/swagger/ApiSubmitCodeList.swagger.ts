import { applyDecorators } from '@nestjs/common';
import {
  ApiOkResponse,
  ApiOperation,
  ApiBadRequestResponse,
} from '@nestjs/swagger';

export const ApiSubmitCodeList = () => {
  return applyDecorators(
    ApiOperation({
      summary: '조건과 일치하는 제출 목록의 리스트를 반환합니다.',
    }),
    ApiOkResponse({
      description: '성공적으로 제출 리스트를 조회했습니다.',
      schema: {
        example: {
          message: '성공적으로 제출 리스트를 조회했습니다.',
          data: [
            {
              createdAt: '2023-09-29T01:31:36.779Z',
              updatedAt: '2023-09-29T01:31:46.976Z',
              id: 83,
              code: 'type MyPick<T, K extends keyof T> = {[key in K]: T[key]}',
              isHidden: false,
              correct_score: 100,
              valid_score: 100,
            },
            {
              createdAt: '2023-09-29T01:32:05.227Z',
              updatedAt: '2023-09-29T01:32:14.689Z',
              id: 84,
              code: 'type MyPick<T, K extends keyof T> = any',
              isHidden: false,
              correct_score: 0,
              valid_score: 100,
            },
          ],
        },
      },
    }),
    ApiBadRequestResponse({
      description:
        '쿼리 스트링의 필수 속성을 입력하지 않았거나, 올바른 타입의 값을 전달하지 않았습니다.',
    }),
  );
};
