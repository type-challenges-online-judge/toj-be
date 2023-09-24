import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Problem, SubmitCode, TestCase, User } from '@/models/entity';
import { Repository } from 'typeorm';

@Injectable()
export class ProblemService {
  constructor(
    @InjectRepository(Problem)
    private readonly problemRepo: Repository<Problem>,
    @InjectRepository(SubmitCode)
    private readonly submitCodeRepo: Repository<SubmitCode>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
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

  public async getProblemDetail(problemId: number): Promise<Problem | null> {
    const problem = this.problemRepo
      .createQueryBuilder('problem')
      .select()
      .where(`problem.id = ${problemId}`)
      .leftJoin('problem.testCase', 'testCase')
      .addSelect(['testCase.case', 'testCase.type'])
      .getOne();

    return problem;
  }

  public async createSubmitHistory(
    userId: number,
    problemId: number,
    submitCode: string,
  ): Promise<number> {
    const user = await this.userRepo.findOne({ where: { snsId: userId } });

    const problem = await this.problemRepo.findOne({
      where: { id: problemId },
    });

    if (!user || !problem) {
      throw new BadRequestException(
        '사용자 아이디가 잘못되었거나 없는 문제에 대한 제출입니다.',
      );
    }

    const submitCodeHistory = await this.submitCodeRepo.insert({
      code: submitCode,
      correct_score: -1,
      valid_score: -1,
      user,
      problem,
    });

    return submitCodeHistory.identifiers[0].id;
  }

  public async startJudge(
    userId: number,
    problemId: number,
    submitCodeId: number,
    submitCode: string,
  ): Promise<void> {
    setTimeout(() => {
      console.log(userId, problemId, submitCodeId, submitCode);
    }, 5000);
  }
}
