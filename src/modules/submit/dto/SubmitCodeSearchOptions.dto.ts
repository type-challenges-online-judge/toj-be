import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsNumber, IsEnum } from 'class-validator';
import { SubmitCodeResult } from '../constants';

export class SubmitCodeSearchOptions {
  @ApiProperty({
    required: false,
    description: '특정 문제의 제출 내역을 보고 싶을 때 사용합니다.',
  })
  @IsOptional()
  @IsNumber()
  problemId: number | undefined;

  @ApiProperty({
    required: false,
    description: '특정 사용자의 제출 내역을 보고 싶을 때 사용합니다.',
  })
  @IsOptional()
  @IsNumber()
  snsId: number | undefined;

  @ApiProperty({
    required: false,
    description:
      '`right`, `wrong`, `correct`, `valid` 4가지 결과보기 옵션을 제공합니다. (전달하지 않을 경우 전체보기)',
  })
  @IsOptional()
  @IsEnum(SubmitCodeResult)
  resultType: SubmitCodeResult;
}
