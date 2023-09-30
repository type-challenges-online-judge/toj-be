import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ApiSubmitCodeList, ApiSubmitCodeListSize } from './swagger';
import { SubmitService } from './submit.service';
import { AuthGuard } from '@/guards';
import { SubmitCodePaging, SubmitCodeSearchOptions } from './dto';

@ApiTags('submit')
@Controller('submit')
export class SubmitController {
  constructor(private readonly submitService: SubmitService) {}

  @ApiSubmitCodeList()
  @UseGuards(AuthGuard)
  @Get()
  async getSubmitCodeList(@Query() query: SubmitCodePaging) {
    return await this.submitService.getSubmitCodeList(query);
  }

  @ApiSubmitCodeListSize()
  @UseGuards(AuthGuard)
  @Get('size')
  async getSubmitCodeListLength(@Query() query: SubmitCodeSearchOptions) {
    return await this.submitService.getSubmitCodeListSize(query);
  }
}
