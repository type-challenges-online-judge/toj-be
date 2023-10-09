import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { TEST_CASE_TYPE } from '@/constants';

export class JudgeInfo {
  @ApiProperty({
    required: true,
    description: '`correct`, `valid` 중 하나',
  })
  @IsString()
  type: TEST_CASE_TYPE;
}
