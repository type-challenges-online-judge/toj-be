import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { FindOptionsWhere } from 'typeorm';
import { SubmitCodePaging, SubmitCodeSearchOptions } from './dto';
import { SubmitCode } from '@/modules/submit/entities';
import { Problem } from '@/modules/problem/entities';
import { User } from '@/modules/user/entities';
import { TestCase } from '@/modules/problem/entities';
import { SCORE_STATE } from '@/constants';
import {
  createKeyOfJudgeStatus,
  createRecordJudgeStatusFn,
  judge,
} from '@/utils';
import { JudgeStatus } from '@/types/judge';
import { TEST_CASE_TYPE } from '@/constants';

@Injectable()
export class SubmitService {
  /**
   * [Map 객체]
   * key: `${제출 코드 id}|${타입}`
   * value: 채점 현황 객체 (JudgeStatus)
   *
   * TODO: 당장은 비효율적이더라도 변수에 관리하지만, 추후 redis와 같은 캐시 DB로 이주시킬 예정
   */
  private testCaseStatus: Map<string, JudgeStatus> = new Map();

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

    const length = await this.repo.count({
      where,
    });

    return length;
  }

  public async createSubmitCode(
    problem: Problem,
    user: User,
    code: string,
  ): Promise<number> {
    const submitCode = await this.repo.insert({
      code,
      correct_score: SCORE_STATE.WAITING,
      valid_score: SCORE_STATE.WAITING,
      user,
      problem,
    });

    return submitCode.identifiers[0].id;
  }

  public async startJudge(
    submitCodeId: number,
    problem: Problem,
    testCases: TestCase[],
  ) {
    let testCaseNumber = 0;

    const submitCode = await this.repo.findOne({
      where: {
        id: submitCodeId,
      },
    });

    const recordJudgeStatus = createRecordJudgeStatusFn(
      submitCodeId,
      submitCode,
      this.repo,
      this.testCaseStatus,
    );

    /**
     * 템플릿에 적힌 타입을 사용해서 정답을 제출하지 않았을 경우 에러처리
     */
    const noDuplicateIdentifier = await judge(
      submitCodeId,
      submitCode.code,
      testCaseNumber,
      problem.template,
    );

    if (noDuplicateIdentifier) {
      recordJudgeStatus({ state: SCORE_STATE.ERROR });
      return;
    }

    recordJudgeStatus({ state: SCORE_STATE.PROGRESSING });

    /**
     * 테스트케이스 분리
     */
    const correctTestCases = [];
    const validTestCases = [];

    testCases.forEach((testCase) => {
      const { type } = testCase;

      switch (type) {
        case TEST_CASE_TYPE.CORRECT:
          correctTestCases.push(testCase);
          break;
        case TEST_CASE_TYPE.VALID:
          validTestCases.push(testCase);
          break;
      }
    });

    /**
     * 정확성 테스트케이스 채점 진행
     */
    if (correctTestCases.length === 0) {
      recordJudgeStatus({
        state: SCORE_STATE.NOT_EXIST,
        type: TEST_CASE_TYPE.CORRECT,
      });
    } else {
      let correctCount = 0;

      for (let i = 0; i < correctTestCases.length; i++) {
        const testCase = correctTestCases[i];

        recordJudgeStatus({
          state: SCORE_STATE.COMPLETE,
          type: TEST_CASE_TYPE.CORRECT,
          currentTestCase: i + 1,
          totalTestCaseLength: correctTestCases.length,
        });

        const { template } = testCase;

        const result = await judge(
          submitCodeId,
          submitCode.code,
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

      recordJudgeStatus({
        state: SCORE_STATE.DONE,
        type: TEST_CASE_TYPE.CORRECT,
        score: correctScore,
      });
    }

    /**
     * 유효성 테스트케이스 채점 진행
     */
    if (validTestCases.length === 0) {
      recordJudgeStatus({
        state: SCORE_STATE.NOT_EXIST,
        type: TEST_CASE_TYPE.VALID,
      });
    } else {
      let validCount = 0;

      for (let i = 0; i < validTestCases.length; i++) {
        const testCase = validTestCases[i];

        recordJudgeStatus({
          state: SCORE_STATE.COMPLETE,
          type: TEST_CASE_TYPE.VALID,
          currentTestCase: i + 1,
          totalTestCaseLength: validTestCases.length,
        });

        const { template } = testCase;

        const result = await judge(
          submitCodeId,
          submitCode.code,
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

      recordJudgeStatus({
        state: SCORE_STATE.DONE,
        type: TEST_CASE_TYPE.VALID,
        score: validScore,
      });
    }
  }

  async getSubmitCodeStatus(
    submitCodeId: number,
    type: TEST_CASE_TYPE,
  ): Promise<JudgeStatus | undefined> {
    return this.testCaseStatus.get(createKeyOfJudgeStatus(submitCodeId, type));
  }
}
