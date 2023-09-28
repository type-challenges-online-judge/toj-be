import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Problem, SubmitCode, TestCase, User } from '@/models/entities';
import { Repository } from 'typeorm';
import { judge } from '@/utils';
import { JudgeStatus } from './dto/judgeStatus.dto';

export const enum SCORE_STATE {
  NOT_EXIST = -5,
  ERROR = -4,
  WAITING = -3,
  PROGRESSING = -2,
  DONE = -1,
}

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

  /**
   * 제출 내역 id를 키로, 채점 현황을 값으로 저장하는 Map 객체
   *
   * TODO: 당장은 비효율적이더라도 변수에 관리하지만, 추후 redis와 같은 캐시 DB로 이주시킬 예정
   */
  correctTestCaseStatus: Map<number, JudgeStatus> = new Map();
  validTestCaseStatus: Map<number, JudgeStatus> = new Map();

  /**
   * 문제 리스트 조회 메서드
   */
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

  /**
   * 문제 상세정보 조회 메서드
   */
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

  /**
   * 제출 내역 생성 메서드
   */
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
      correct_score: SCORE_STATE.WAITING,
      valid_score: SCORE_STATE.WAITING,
      user,
      problem,
    });

    return submitCodeHistory.identifiers[0].id;
  }

  /**
   * 채점 메서드
   */
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
      submitCodeHistory.correct_score = SCORE_STATE.ERROR;
      submitCodeHistory.valid_score = SCORE_STATE.ERROR;

      this.submitCodeRepo.save(submitCodeHistory);

      this.correctTestCaseStatus.set(
        submitCodeId,
        new JudgeStatus({ state: SCORE_STATE.ERROR }),
      );

      this.validTestCaseStatus.set(
        submitCodeId,
        new JudgeStatus({ state: SCORE_STATE.ERROR }),
      );

      return;
    }

    submitCodeHistory.correct_score = SCORE_STATE.PROGRESSING;
    submitCodeHistory.valid_score = SCORE_STATE.PROGRESSING;

    this.submitCodeRepo.save(submitCodeHistory);

    this.correctTestCaseStatus.set(
      submitCodeId,
      new JudgeStatus({ state: SCORE_STATE.PROGRESSING }),
    );

    this.validTestCaseStatus.set(
      submitCodeId,
      new JudgeStatus({ state: SCORE_STATE.PROGRESSING }),
    );

    /**
     * 테스트케이스 분리
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

    /**
     * 정확성 테스트케이스 채점 진행
     */
    if (correctTestCases.length === 0) {
      submitCodeHistory.correct_score = SCORE_STATE.NOT_EXIST;

      this.submitCodeRepo.save(submitCodeHistory);

      this.correctTestCaseStatus.set(
        submitCodeId,
        new JudgeStatus({ state: SCORE_STATE.NOT_EXIST }),
      );
    } else {
      let correctCount = 0;

      for (let i = 0; i < correctTestCases.length; i++) {
        const testCase = correctTestCases[i];

        this.correctTestCaseStatus.set(
          submitCodeId,
          new JudgeStatus({
            state: SCORE_STATE.PROGRESSING,
            currentTestCase: i,
            totalTestCaseLength: correctTestCases.length,
          }),
        );

        const { template } = testCase;

        const result = await judge(
          submitCodeId,
          submitCode,
          ++caseNum,
          template,
        );

        if (result) {
          correctCount++;
        }
      }

      const correctScore = parseFloat(
        ((correctCount / correctTestCases.length) * 100).toFixed(1),
      );

      submitCodeHistory.correct_score = correctScore;

      this.submitCodeRepo.save(submitCodeHistory);

      this.correctTestCaseStatus.set(
        submitCodeId,
        new JudgeStatus({
          state: SCORE_STATE.DONE,
          score: correctScore,
        }),
      );
    }

    /**
     * 유효성 테스트케이스 채점 진행
     */
    if (validTestCases.length === 0) {
      submitCodeHistory.valid_score = SCORE_STATE.NOT_EXIST;

      this.submitCodeRepo.save(submitCodeHistory);

      this.validTestCaseStatus.set(
        submitCodeId,
        new JudgeStatus({ state: SCORE_STATE.NOT_EXIST }),
      );
    } else {
      let validCount = 0;

      for (let i = 0; i < validTestCases.length; i++) {
        const testCase = validTestCases[i];

        this.validTestCaseStatus.set(
          submitCodeId,
          new JudgeStatus({
            state: SCORE_STATE.PROGRESSING,
            currentTestCase: i,
            totalTestCaseLength: validTestCases.length,
          }),
        );

        const { template } = testCase;

        const result = await judge(
          submitCodeId,
          submitCode,
          ++caseNum,
          template,
        );

        if (result) {
          validCount++;
        }
      }

      const validScore = parseFloat(
        ((validCount / validTestCases.length) * 100).toFixed(1),
      );

      submitCodeHistory.valid_score = validScore;

      this.submitCodeRepo.save(submitCodeHistory);

      this.validTestCaseStatus.set(
        submitCodeId,
        new JudgeStatus({
          state: SCORE_STATE.DONE,
          score: validScore,
        }),
      );
    }
  }

  /**
   *
   */
  async getSubmitCodeStatus(
    submitCodeId: number,
    type: 'correct' | 'valid',
  ): Promise<JudgeStatus | undefined> {
    switch (type) {
      case 'correct':
        return this.correctTestCaseStatus.get(submitCodeId);
      case 'valid':
        return this.validTestCaseStatus.get(submitCodeId);
    }
  }
}
