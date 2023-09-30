import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ApiSubmitCodeList, ApiSubmitCodeListSize } from './swagger';
import { SubmitService } from './submit.service';
import { SubmitCodePaging, SubmitCodeSearchOptions } from './dto';
import { responseTemplate } from '@/utils';

@ApiTags('submit')
@Controller('submit')
export class SubmitController {
  constructor(private readonly submitService: SubmitService) {}

  @ApiSubmitCodeList()
  @Get()
  async getSubmitCodeList(@Query() query: SubmitCodePaging) {
    const submitList = await this.submitService.getSubmitCodeList(query);

    return responseTemplate(
      '성공적으로 제출 리스트를 조회했습니다.',
      submitList,
    );
  }

  @ApiSubmitCodeListSize()
  @Get('size')
  async getSubmitCodeListLength(@Query() query: SubmitCodeSearchOptions) {
    const submitListSize =
      await this.submitService.getSubmitCodeListSize(query);

    return responseTemplate(
      '성공적으로 제출 리스트의 개수를 조회했습니다.',
      submitListSize,
    );
  }
}
