import { BadRequestException, Controller, Get, Param } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ProblemService } from './problem.service';
import { responseTemplate } from '@/utils';
import { ApiProblem, ApiProblemDetail } from './swagger';

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
}
