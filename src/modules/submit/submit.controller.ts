import {
  Controller,
  Get,
  Query,
  Inject,
  Post,
  Req,
  Param,
  Body,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import {
  ApiSubmitCode,
  ApiSubmitCodeList,
  ApiSubmitCodeListSize,
  ApiSubmitCodeStatus,
} from './swagger';
import {
  JudgeInfo,
  SubmitCodeData,
  SubmitCodePaging,
  SubmitCodeSearchOptions,
} from './dto';
import { responseTemplate } from '@/utils';
import { SubmitService } from './submit.service';
import { ProblemService } from '@/modules/problem/problem.service';
import { UserService } from '@/modules/user/user.service';
import type { Request } from 'express';
import { AuthGuard } from '@/guards';

@ApiTags('submit')
@Controller('submit')
export class SubmitController {
  constructor(
    @Inject(SubmitService) private readonly submitService: SubmitService,
    @Inject(ProblemService) private readonly problemService: ProblemService,
    @Inject(UserService) private readonly userService: UserService,
  ) {}

  @ApiSubmitCodeList()
  @Get()
  async getSubmitCodeList(@Query() query: SubmitCodePaging) {
    const submitList = await this.submitService.getSubmitCodeList(query);

    return responseTemplate(
      '성공적으로 제출 리스트를 조회했습니다.',
      submitList,
    );
  }

  @ApiSubmitCodeListSize()
  @Get('size')
  async getSubmitCodeListLength(@Query() query: SubmitCodeSearchOptions) {
    const submitListSize =
      await this.submitService.getSubmitCodeListSize(query);

    return responseTemplate(
      '성공적으로 제출 리스트의 개수를 조회했습니다.',
      submitListSize,
    );
  }

  @ApiSubmitCode()
  @UseGuards(AuthGuard)
  @Post(':id')
  async createSubmitCode(
    @Req() req: Request,
    @Param('id') problemId: number,
    @Body() data: SubmitCodeData,
  ) {
    const { code } = data;
    const { snsId } = req['user'];

    const user = await this.userService.getUser(snsId);
    const problem = await this.problemService.getProblem(problemId);

    /**
     * 제출 내역 생성
     */
    const submitCodeId = await this.submitService.createSubmitCode(
      problem,
      user,
      code,
    );

    /**
     * 비동기로 채점 시작
     */
    const testCases = await this.problemService.getTestCases(problemId);

    this.submitService.enqueueJudgeItem({ submitCodeId, problem, testCases });

    return responseTemplate('정답 제출이 완료되어 채점이 시작되었습니다.', {
      submitCodeId,
    });
  }

  @ApiSubmitCodeStatus()
  @Get('status/:id')
  async getSubmitCodeStatus(
    @Query() query: JudgeInfo,
    @Param('id') submitCodeId: number,
  ) {
    const { type } = query;

    const judgeStatus = await this.submitService.getSubmitCodeStatus(
      submitCodeId,
      type,
    );

    if (!judgeStatus) {
      throw new BadRequestException(
        '`correct`, `valid`가 아닌 다른 다른 타입을 요청하였거나, 해당 제출 코드에 대한 채점 내역이 없습니다.',
      );
    }

    return responseTemplate(
      '해당 채점 내역에 대한 상태를 성공적으로 조회했습니다.',
      { judgeStatus },
    );
  }
}
