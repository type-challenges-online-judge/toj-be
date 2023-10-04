import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiOkResponse } from '@nestjs/swagger';

export const ApiUsersSolvedProblems = () => {
  return applyDecorators(
    ApiOperation({
      summary: '사용자가 풀이한 문제들의 정보를 조회합니다.',
    }),
    ApiOkResponse({
      description: '사용자가 풀이한 문제들을 성공적으로 조회하였습니다.',
      content: {
        'application/json': {
          examples: {
            'minify=false': {
              value: {
                message: '성공적으로 풀이한 문제 리스트를 조회했습니다.',
                data: [
                  {
                    id: 1234,
                    title: 'HelloWorld',
                    level: 'warm',
                    number: 13,
                    oldestSolvedDate: '2023-10-04T09:55:34.677Z',
                  },
                ],
              },
            },
            'minify=true': {
              value: {
                message: '성공적으로 풀이한 문제 리스트를 조회했습니다.',
                data: [
                  {
                    id: 1234,
                  },
                ],
              },
            },
          },
        },
      },
    }),
  );
};
