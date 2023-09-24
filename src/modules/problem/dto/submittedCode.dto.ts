import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SubmittedCode {
  @ApiProperty({
    name: 'code',
    description: '정답으로 제출할 코드',
    required: true,
  })
  @IsString()
  code: string;
}
