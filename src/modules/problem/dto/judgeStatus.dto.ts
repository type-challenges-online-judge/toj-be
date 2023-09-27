import { ApiProperty } from '@nestjs/swagger';
import { SCORE_STATE } from '../problem.service';

export class JudgeStatus {
  @ApiProperty({
    required: true,
  })
  state: SCORE_STATE;

  @ApiProperty({
    required: false,
  })
  score?: number;

  @ApiProperty({
    required: false,
  })
  currentTestCase?: number;

  @ApiProperty({
    required: false,
  })
  totalTestCaseLength?: number;

  constructor({
    state,
    score,
    currentTestCase,
    totalTestCaseLength,
  }: {
    state: SCORE_STATE;
    score?: number;
    currentTestCase?: number;
    totalTestCaseLength?: number;
  }) {
    this.state = state;
    this.score = score;
    this.currentTestCase = currentTestCase;
    this.totalTestCaseLength = totalTestCaseLength;
  }
}
