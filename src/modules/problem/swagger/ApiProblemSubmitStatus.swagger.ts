import { applyDecorators } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiOkResponse,
  ApiOperation,
} from '@nestjs/swagger';

export const ApiProblemSubmitStatus = () => {
  return applyDecorators(
    ApiBadRequestResponse({
      description:
        '`correct`, `valid`가 아닌 다른 다른 타입을 요청하였거나, 해당 제출 코드에 대한 채점 내역이 없습니다.',
    }),
    ApiOkResponse({
      description: '제출 코드의 채점 현황을 성공적으로 조회했습니다.',
      schema: {
        example: {
          message: '제출 코드의 채점 현황을 성공적으로 조회했습니다.',
          data: {
            JudgeStatus: {
              state: -2,
              score: 0,
              currentTestCase: 1,
              totalTestCaseLength: 4,
            },
          },
        },
      },
    }),
    ApiOperation({
      summary: '제출 코드의 채점 현황을 조회합니다.',
      description: [
        '|`state` 값|의미|',
        '|-|-|',
        '|-5|테스트케이스가 존재하지 않음|',
        '|-4|오류 발생 (채점에 사용 될 타입이 존재하지 않음)|',
        '|-3|채점을 기다리는 중|',
        '|-2|채점 진행 중 (`currentTestCase` / `totalTestCaseLength` 값이 제공됨)|',
        '|-1|채점 완료 (최종 점수 값`score`이 제공됨)|',
      ].join('\n'),
    }),
  );
};
