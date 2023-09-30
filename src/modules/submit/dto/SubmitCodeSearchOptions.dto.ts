import { ApiProperty } from '@nestjs/swagger';
import { IsNumber } from 'class-validator';

export class SubmitCodeSearchOptions {
  @ApiProperty({
    required: false,
    description: '특정 문제의 제출 내역을 보고 싶을 때 사용합니다.',
  })
  @IsNumber()
  problemId: number;

  @ApiProperty({
    required: false,
    description: '특정 사용자의 제출 내역을 보고 싶을 때 사용합니다.',
  })
  @IsNumber()
  snsId: number;
}
