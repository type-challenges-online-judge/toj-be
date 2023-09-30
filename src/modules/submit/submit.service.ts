import { SubmitCode } from '@/models/entities';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SubmitCodePaging, SubmitCodeSearchOptions } from './dto';
import type { FindOptionsWhere } from 'typeorm';

@Injectable()
export class SubmitService {
  constructor(
    @InjectRepository(SubmitCode) private readonly repo: Repository<SubmitCode>,
  ) {}

  async getSubmitCodeList(options: SubmitCodePaging) {
    const { problemId, snsId, pageNum, countPerPage } = options;

    const where: FindOptionsWhere<SubmitCode> = {};

    if (problemId) {
      where.problem = {
        id: problemId,
      };
    }

    if (snsId) {
      where.user = {
        snsId,
      };
    }

    const submitCodeList = await this.repo.find({
      where,
      skip: countPerPage * (pageNum - 1),
      take: countPerPage,
    });

    return submitCodeList;
  }

  async getSubmitCodeListSize(options: SubmitCodeSearchOptions) {
    const { problemId, snsId } = options;

    const where: FindOptionsWhere<SubmitCode> = {};

    if (problemId) {
      where.problem = {
        id: problemId,
      };
    }

    if (snsId) {
      where.user = {
        snsId,
      };
    }

    const length = await this.repo.findAndCount({
      where,
    });

    return length;
  }
}
