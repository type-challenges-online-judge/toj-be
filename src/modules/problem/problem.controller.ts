import { BadRequestException, Controller, Get, Param } from '@nestjs/common';
import {
  ApiOperation,
  ApiOkResponse,
  ApiParam,
  ApiBadRequestResponse,
} from '@nestjs/swagger';
import { ProblemService } from './problem.service';
import { responseTemplate } from '@/utils';

@Controller('problem')
export class ProblemController {
  constructor(private readonly problemService: ProblemService) {}

  /**
   * 문제 리스트 조회 API
   */
  @ApiOkResponse({
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
  })
  @ApiOperation({
    summary: '존재하는 타입스크립트 챌린지 문제 리스트를 모두 반환합니다.',
  })
  @Get()
  async problemList() {
    const problemList = await this.problemService.getProblemList();

    return responseTemplate(
      '성공적으로 문제 리스트를 조회했습니다.',
      problemList,
    );
  }

  /**
   * 문제 상세정보 조회 API
   *
   * TODO: 추후 문제 언어를 선택할 수 있도록 쿼리 스트링을 입력받을 예정 (현재는 1. 한글, 2. 영어만 지원)
   */
  @ApiOkResponse({
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
  })
  @ApiBadRequestResponse({
    description: 'id의 형태가 올바르지 않거나, 존재하지 않습니다.',
  })
  @ApiParam({
    name: 'id',
    required: true,
    description: '문제의 고유 id',
  })
  @ApiOperation({
    summary: '해당하는 문제 번호의 상세정보를 반환합니다.',
  })
  @Get('detail/:id')
  async problemDetail(@Param('id') problemId: string) {
    if (isNaN(parseInt(problemId))) {
      throw new BadRequestException('문제 번호 형식이 잘못되었습니다.');
    }

    const problemDetail = await this.problemService.getProblemDetail(
      parseInt(problemId),
    );

    if (!problemDetail) {
      throw new BadRequestException('존재하지 않는 문제 번호입니다.');
    }

    return responseTemplate(
      '성공적으로 문제의 상세정보를 조회했습니다.',
      problemDetail,
    );
  }
}
