import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Problem } from '@/modules/problem/entities';
import { TestCase } from '@/modules/problem/entities';

@Injectable()
export class ProblemService {
  constructor(
    @InjectRepository(Problem)
    private readonly problemRepo: Repository<Problem>,
    @InjectRepository(TestCase)
    private readonly testCaseRepo: Repository<TestCase>,
  ) {}

  public async getProblemList(): Promise<Problem[]> {
    const problems = await this.problemRepo.find({
      select: {
        id: true,
        title: true,
        number: true,
        level: true,
      },
    });

    return problems;
  }

  public async getProblem(problemId: number): Promise<Problem | null> {
    const problem = await this.problemRepo.findOne({
      where: { id: problemId },
    });

    return problem;
  }

  public async getTestCases(problemId: number): Promise<TestCase[]> {
    const testCases = await this.testCaseRepo.find({
      where: { problem: { id: problemId } },
    });

    return testCases;
  }

  public async getProblemDetail(problemId: number): Promise<Problem | null> {
    const problem = await this.problemRepo
      .createQueryBuilder('problem')
      .select()
      .where(`problem.id = ${problemId}`)
      .leftJoin('problem.testCase', 'testCase')
      .addSelect(['testCase.case', 'testCase.type'])
      .getOne();

    return problem;
  }
}
