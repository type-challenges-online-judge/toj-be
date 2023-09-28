import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { TEST_CASE_TYPE } from '../problem.service';

export class JudgeInfo {
  @ApiProperty({
    required: true,
    example: TEST_CASE_TYPE.CORRECT,
  })
  @IsString()
  type: TEST_CASE_TYPE;
}
