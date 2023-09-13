import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiOkResponse } from '@nestjs/swagger';
import { ProblemService } from './problem.service';

@Controller('problem')
export class ProblemController {
  constructor(private readonly problemService: ProblemService) {}

  @ApiOkResponse({
    description: '문제 리스트를 정상적으로 조회했습니다.',
    schema: {
      example: {
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
  getHello() {
    return this.problemService.getProblemList();
  }
}
