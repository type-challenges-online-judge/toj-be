import { IsNumber, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class JudgeInfo {
  @ApiProperty({
    required: true,
    example: 1234,
  })
  @IsNumber()
  submitCodeId: number;

  @ApiProperty({
    required: true,
    example: 'correct',
  })
  @IsString()
  type: 'correct' | 'valid';
}
