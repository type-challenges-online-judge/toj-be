import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Problem } from '@/models/entity';
import { Repository } from 'typeorm';

@Injectable()
export class ProblemService {
  constructor(
    @InjectRepository(Problem) private readonly repo: Repository<Problem>,
  ) {}

  public async getProblemList() {
    return await this.repo.find({
      select: {
        id: true,
        title: true,
        number: true,
        level: true,
      },
    });
  }
}
