import { applyDecorators } from '@nestjs/common';
import { ApiOkResponse, ApiOperation } from '@nestjs/swagger';

export const ApiProblem = () => {
  return applyDecorators(
    ApiOkResponse({
      description: '문제 리스트가 정상적으로 조회되었을 경우.',
      schema: {
        example: {
          message: '성공적으로 문제의 상세정보를 조회했습니다.',
          data: [
            { id: 207, title: 'tuple to union', number: 10, level: 'medium' },
            { id: 208, title: 'readonly', number: 7, level: 'easy' },
            { id: 209, title: 'deep readonly', number: 9, level: 'medium' },
            { id: 210, title: 'simple vue', number: 6, level: 'hard' },
          ],
        },
      },
    }),
    ApiOperation({
      summary: '존재하는 타입스크립트 챌린지 문제 리스트를 모두 반환합니다.',
    }),
  );
};
