import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsBoolean, IsOptional } from 'class-validator';

export class SolvedProblemSearchOptions {
  @ApiProperty({
    name: 'snsId',
    description: '풀이한 문제 목록을 조회 할 사용자 `sns id`',
    required: true,
  })
  @IsNumber()
  snsId: number;

  @ApiProperty({
    name: 'minify',
    description:
      '문제에 대한 정보 없이, 문제의 id만 가져오고 싶을 경우 `true` 전달. (default: `false`)',
    required: false,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  minify: boolean;
}
