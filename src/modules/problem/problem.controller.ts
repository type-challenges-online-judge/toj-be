import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
  InternalServerErrorException,
  Query,
} from '@nestjs/common';
import {
  ApiOperation,
  ApiOkResponse,
  ApiParam,
  ApiBadRequestResponse,
  ApiTags,
  ApiBody,
  ApiUnauthorizedResponse,
  ApiBearerAuth,
  ApiCreatedResponse,
} from '@nestjs/swagger';
import { SubmittedCode } from './dto/submittedCode.dto';
import { ProblemService } from './problem.service';
import { responseTemplate } from '@/utils';
import { AuthGuard } from '@/guards/auth.guard';
import type { Request } from 'express';
import type { JwtPayload } from 'jsonwebtoken';
import { JudgeInfo } from './dto/judgeInfo.dto';

@ApiTags('problem')
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

  /**
   * 문제 정답 제출 API
   */
  @ApiBody({
    type: SubmittedCode,
  })
  @ApiParam({
    name: 'id',
    required: true,
    description: '문제의 고유 id',
  })
  @ApiUnauthorizedResponse({
    description: '로그인 되어있지 않습니다.',
  })
  @ApiOperation({
    summary: '문제에 대한 사용자의 정답을 제출받아 채점을 진행합니다.',
  })
  @ApiCreatedResponse({
    description: '정답 제출이 완료되어 채점이 시작되었습니다.',
    schema: {
      example: {
        message: '정답 제출이 완료되어 채점이 시작되었습니다.',
        data: {
          submitCodeId: 1234,
        },
      },
    },
  })
  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  @Post('submit/:id')
  async submitCode(
    @Req() req: Request,
    @Param('id') problemId: number,
    @Body() data: SubmittedCode,
  ) {
    const { code } = data;

    /**
     * Guard를 통과하였을 경우 req.user 가 존재하여야 하지만 그렇지 않을 경우의 예외처리
     */
    const decodedUserToken = req['user'] as JwtPayload | undefined;

    if (!decodedUserToken) {
      throw new InternalServerErrorException('서버 오류.');
    }

    const { snsId } = decodedUserToken;

    /**
     * 제출 내역 생성
     */
    const submitCodeId = await this.problemService.createSubmitHistory(
      snsId,
      problemId,
      code,
    );

    /**
     * 비동기로 채점 시작
     */
    try {
      this.problemService.startJudge(snsId, problemId, submitCodeId, code);
    } catch (e) {
      console.log(e);
    }

    return responseTemplate('정답 제출이 완료되어 채점이 시작되었습니다.', {
      submitCodeId,
    });
  }

  /**
   * 제출 답안의 채점 현황 조회 API
   */
  @ApiBadRequestResponse({
    description:
      '`correct`, `valid`가 아닌 다른 다른 타입을 요청하였거나, 해당 제출 코드에 대한 채점 내역이 없습니다.',
  })
  @ApiOkResponse({
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
  })
  @ApiOperation({
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
  })
  @Get('submit/status')
  async getSubmitCodeStatus(@Query() query: JudgeInfo) {
    const { submitCodeId, type } = query;

    const judgeStatus = await this.problemService.getSubmitCodeStatus(
      submitCodeId,
      type,
    );

    if (!judgeStatus) {
      throw new BadRequestException(
        '`correct`, `valid`가 아닌 다른 다른 타입을 요청하였거나, 해당 제출 코드에 대한 채점 내역이 없습니다.',
      );
    }

    return responseTemplate('', { judgeStatus });
  }
}
