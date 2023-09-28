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
import { ApiTags } from '@nestjs/swagger';
import { SubmittedCode } from './dto/submittedCode.dto';
import { ProblemService } from './problem.service';
import { responseTemplate } from '@/utils';
import { AuthGuard } from '@/guards/auth.guard';
import type { Request } from 'express';
import type { JwtPayload } from 'jsonwebtoken';
import { JudgeInfo } from './dto/judgeInfo.dto';
import {
  ApiProblem,
  ApiProblemDetail,
  ApiProblemSubmit,
  ApiProblemSubmitStatus,
} from './swagger';

@ApiTags('problem')
@Controller('problem')
export class ProblemController {
  constructor(private readonly problemService: ProblemService) {}

  @ApiProblem()
  @Get()
  async problemList() {
    const problemList = await this.problemService.getProblemList();

    return responseTemplate(
      '성공적으로 문제 리스트를 조회했습니다.',
      problemList,
    );
  }

  /**
   * TODO: 추후 문제 언어를 선택할 수 있도록 쿼리 스트링을 입력받을 예정 (현재는 1. 한글, 2. 영어만 지원)
   */
  @ApiProblemDetail()
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

  @ApiProblemSubmit()
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

  @ApiProblemSubmitStatus()
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
