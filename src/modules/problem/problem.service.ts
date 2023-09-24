import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Problem, SubmitCode, TestCase, User } from '@/models/entity';
import { Repository } from 'typeorm';
import { judge } from '@/utils/judge';

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
    let caseNum = 0;

    const problem = await this.problemRepo.findOne({
      where: {
        id: problemId,
      },
    });

    const testCases = await this.testCaseRepo
      .createQueryBuilder('test_case')
      .select()
      .where(`test_case.problemId = ${problemId}`)
      .getMany();

    /**
     * 템플릿에 적힌 타입을 사용해서 정답을 제출하지 않았을 경우 에러처리
     */
    const noDuplicateIdentifier = judge(
      submitCodeId,
      submitCode,
      caseNum,
      problem.template,
    );

    if (noDuplicateIdentifier) {
      const submitCodeHistory = await this.submitCodeRepo.findOne({
        where: {
          id: submitCodeId,
        },
      });

      submitCodeHistory.correct_score = -2;
      submitCodeHistory.valid_score = -2;

      this.submitCodeRepo.save(submitCodeHistory);

      return;
    }

    /**
     * 테스트케이스 별 채점 진행
     */
    const correctTestCases = [];
    const validTestCases = [];

    testCases.forEach((testcase) => {
      switch (testcase.type) {
        case 'correct':
          correctTestCases.push(testcase);
          break;
        case 'valid':
          validTestCases.push(testcase);
          break;
      }
    });

    const correctCount = correctTestCases.reduce((acc, cur) => {
      const { template } = cur;

      const result = judge(submitCodeId, submitCode, ++caseNum, template);

      return acc + (result ? 1 : 0);
    }, 0);

    const validCount = validTestCases.reduce((acc, cur) => {
      const { template } = cur;

      const result = judge(submitCodeId, submitCode, ++caseNum, template);

      return acc + (result ? 1 : 0);
    }, 0);

    const submitCodeHistory = await this.submitCodeRepo.findOne({
      where: {
        id: submitCodeId,
      },
    });

    submitCodeHistory.correct_score = +(
      (correctCount / correctTestCases.length) *
      100
    ).toFixed(1);
    submitCodeHistory.valid_score = +(
      (validCount / validTestCases.length) *
      100
    ).toFixed(1);

    this.submitCodeRepo.save(submitCodeHistory);
  }
}
