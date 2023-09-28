import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class JudgeInfo {
  @ApiProperty({
    required: true,
    example: 'correct',
  })
  @IsString()
  type: 'correct' | 'valid';
}
