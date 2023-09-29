import { applyDecorators } from '@nestjs/common';
import {
  ApiOkResponse,
  ApiOperation,
  ApiBadRequestResponse,
  ApiParam,
} from '@nestjs/swagger';

export const ApiProblemDetail = () => {
  return applyDecorators(
    ApiOkResponse({
      description: 'id에 해당하는 문제의 상세정보를 정상적으로 조회했습니다.',
      schema: {
        example: {
          message: '성공적으로 문제의 상세정보를 조회했습니다.',
          data: {
            createdAt: '2023-09-13T14:12:57.265Z',
            updatedAt: '2023-09-13T14:12:57.265Z',
            id: 210,
            title: 'simple vue',
            number: 6,
            description: '문제 README.md 파일',
            language: 'en',
            level: 'hard',
            template: 'declare function SimpleVue(options: any): any\n',
            testCase: [
              {
                case: 'Expect<Equal<typeof fullname, string>>',
                type: 'correct',
              },
              {
                case: '// @ts-expect-error\n    this.firstname\n',
                type: 'valid',
              },
              {
                case: '// @ts-expect-error\n    this.getRandom()\n',
                type: 'valid',
              },
              {
                case: '// @ts-expect-error\n    this.data()\n',
                type: 'valid',
              },
            ],
          },
        },
      },
    }),
    ApiBadRequestResponse({
      description: 'id의 형태가 올바르지 않거나, 존재하지 않습니다.',
    }),
    ApiParam({
      name: 'id',
      required: true,
      description: '문제의 고유 id',
    }),
    ApiOperation({
      summary: '해당하는 문제 번호의 상세정보를 반환합니다.',
    }),
  );
};
