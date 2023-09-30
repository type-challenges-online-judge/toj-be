import { SubmitCodeSearchOptions } from './SubmitCodeSearchOptions.dto';
import { ApiProperty } from '@nestjs/swagger';
import { IsNumber } from 'class-validator';

export class SubmitCodePaging extends SubmitCodeSearchOptions {
  @ApiProperty({
    required: true,
    description:
      '확인하려는 페이지의 번호(1 ~ ⌈조건에 맞는 게시글 수 /  `pagePerCount`⌉)입니다.',
  })
  @IsNumber()
  pageNum: number;

  @ApiProperty({
    required: true,
    description: '페이지당 확인 할 게시글 수 입니다.',
  })
  @IsNumber()
  countPerPage: number;
}
