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

export const enum TEST_CASE_TYPE {
  CORRECT = 'CORRECT',
  VALID = 'VALID',
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
   * [Map 객체]
   * key: `${제출 코드 id}|${타입}`
   * value: 채점 현황 객체 (JudgeStatus)
   *
   * TODO: 당장은 비효율적이더라도 변수에 관리하지만, 추후 redis와 같은 캐시 DB로 이주시킬 예정
   */
  testCaseStatus: Map<string, JudgeStatus> = new Map();

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

  private createJudgeStatusKey(
    submitCodeId: number,
    type: TEST_CASE_TYPE,
  ): string {
    return `${submitCodeId}|${type}`;
  }

  private recordJudgeStatus(submitCodeId: number, submitCode: SubmitCode) {
    return (
      state: SCORE_STATE,
      options: {
        type?: TEST_CASE_TYPE;
        currentTestCase?: number;
        totalTestCaseLength?: number;
        score?: number;
      } = {},
    ) => {
      switch (state) {
        case SCORE_STATE.PROGRESSING:
        case SCORE_STATE.ERROR:
          submitCode.correct_score = submitCode.valid_score = state;

          this.submitCodeRepo.save(submitCode);

          this.testCaseStatus.set(
            this.createJudgeStatusKey(submitCodeId, TEST_CASE_TYPE.CORRECT),
            new JudgeStatus({ state }),
          );
          this.testCaseStatus.set(
            this.createJudgeStatusKey(submitCodeId, TEST_CASE_TYPE.VALID),
            new JudgeStatus({ state }),
          );

          break;

        case SCORE_STATE.NOT_EXIST:
          if (options.type === TEST_CASE_TYPE.CORRECT) {
            submitCode.correct_score = state;
          } else if (options.type === TEST_CASE_TYPE.VALID) {
            submitCode.valid_score = state;
          }

          this.submitCodeRepo.save(submitCode);

          this.testCaseStatus.set(
            this.createJudgeStatusKey(submitCodeId, options.type),
            new JudgeStatus({ state }),
          );

          break;

        case SCORE_STATE.DONE:
          if (options.type === TEST_CASE_TYPE.CORRECT) {
            submitCode.correct_score = options.score;
          } else if (options.type === TEST_CASE_TYPE.VALID) {
            submitCode.valid_score = options.score;
          }

          this.submitCodeRepo.save(submitCode);

          this.testCaseStatus.set(
            this.createJudgeStatusKey(submitCodeId, options.type),
            new JudgeStatus({ state, score: options.score }),
          );

          break;
      }
    };
  }

  /**
   * 채점 메서드
   */
  public async startJudge(
    problemId: number,
    submitCodeId: number,
    submitCodeContent: string,
  ): Promise<void> {
    let testCaseNumber = 0;

    const problem = await this.problemRepo.findOne({
      where: {
        id: problemId,
      },
    });

    const submitCode = await this.submitCodeRepo.findOne({
      where: {
        id: submitCodeId,
      },
    });

    const testCases = await this.testCaseRepo
      .createQueryBuilder('test_case')
      .select()
      .where(`test_case.problemId = ${problemId}`)
      .getMany();

    const recordJudgeStatus = this.recordJudgeStatus(submitCodeId, submitCode);

    /**
     * 템플릿에 적힌 타입을 사용해서 정답을 제출하지 않았을 경우 에러처리
     */
    const noDuplicateIdentifier = await judge(
      submitCodeId,
      submitCodeContent,
      testCaseNumber,
      problem.template,
    );

    if (noDuplicateIdentifier) {
      recordJudgeStatus(SCORE_STATE.ERROR);
      return;
    }

    recordJudgeStatus(SCORE_STATE.PROGRESSING);

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
      recordJudgeStatus(SCORE_STATE.NOT_EXIST, {
        type: TEST_CASE_TYPE.CORRECT,
      });
    } else {
      let correctCount = 0;

      for (let i = 0; i < correctTestCases.length; i++) {
        const testCase = correctTestCases[i];

        recordJudgeStatus(SCORE_STATE.PROGRESSING, {
          type: TEST_CASE_TYPE.CORRECT,
          currentTestCase: i + 1,
          totalTestCaseLength: correctTestCases.length,
        });

        const { template } = testCase;

        const result = await judge(
          submitCodeId,
          submitCodeContent,
          ++testCaseNumber,
          template,
        );

        if (result) {
          correctCount++;
        }
      }

      const correctScore = parseFloat(
        ((correctCount / correctTestCases.length) * 100).toFixed(1),
      );

      recordJudgeStatus(SCORE_STATE.DONE, {
        type: TEST_CASE_TYPE.CORRECT,
        score: correctScore,
      });
    }

    /**
     * 유효성 테스트케이스 채점 진행
     */
    if (validTestCases.length === 0) {
      recordJudgeStatus(SCORE_STATE.NOT_EXIST, {
        type: TEST_CASE_TYPE.VALID,
      });
    } else {
      let validCount = 0;

      for (let i = 0; i < validTestCases.length; i++) {
        const testCase = validTestCases[i];

        recordJudgeStatus(SCORE_STATE.PROGRESSING, {
          type: TEST_CASE_TYPE.VALID,
          currentTestCase: i + 1,
          totalTestCaseLength: validTestCases.length,
        });

        const { template } = testCase;

        const result = await judge(
          submitCodeId,
          submitCodeContent,
          ++testCaseNumber,
          template,
        );

        if (result) {
          validCount++;
        }
      }

      const validScore = parseFloat(
        ((validCount / validTestCases.length) * 100).toFixed(1),
      );

      recordJudgeStatus(SCORE_STATE.DONE, {
        type: TEST_CASE_TYPE.VALID,
        score: validScore,
      });
    }
  }

  /**
   * 현재 채점중인 코드의 상태 조회 메서드
   */
  async getSubmitCodeStatus(
    submitCodeId: number,
    type: TEST_CASE_TYPE,
  ): Promise<JudgeStatus | undefined> {
    return this.testCaseStatus.get(
      this.createJudgeStatusKey(submitCodeId, type),
    );
  }
}
