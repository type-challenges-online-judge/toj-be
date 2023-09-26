import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Problem, SubmitCode, TestCase, User } from '@/models/entity';
import { Repository } from 'typeorm';
import { judge } from '@/utils/judge';

const CODE = {
  ERROR: -3,
  WAIT: -2,
  DOING: -1,
};

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
      correct_score: CODE.WAIT,
      valid_score: CODE.WAIT,
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

    const submitCodeHistory = await this.submitCodeRepo.findOne({
      where: {
        id: submitCodeId,
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

    const noDuplicateIdentifier = await judge(
      submitCodeId,
      submitCode,
      caseNum,
      problem.template,
    );

    if (noDuplicateIdentifier) {
      submitCodeHistory.correct_score = CODE.ERROR;
      submitCodeHistory.valid_score = CODE.ERROR;

      this.submitCodeRepo.save(submitCodeHistory);

      return;
    } else {
      submitCodeHistory.correct_score = CODE.DOING;
      submitCodeHistory.valid_score = CODE.DOING;

      this.submitCodeRepo.save(submitCodeHistory);
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

    const correctCount = correctTestCases.reduce(async (acc, cur, i) => {
      const { template } = cur;

      const result = await judge(submitCodeId, submitCode, ++caseNum, template);

      return acc + (result ? 1 : 0);
    }, 0);

    const validCount = validTestCases.reduce(async (acc, cur, i) => {
      const { template } = cur;

      const result = await judge(submitCodeId, submitCode, ++caseNum, template);

      return acc + (result ? 1 : 0);
    }, 0);

    /**
     * TODO: 테스트케이스가 없는 경우 처리
     */
    const correctScore = parseFloat(
      ((correctCount / correctTestCases.length) * 100).toFixed(1),
    );

    const validScore = parseFloat(
      ((validCount / validTestCases.length) * 100).toFixed(1),
    );

    submitCodeHistory.correct_score = correctScore;
    submitCodeHistory.valid_score = validScore;

    this.submitCodeRepo.save(submitCodeHistory);
  }
}
