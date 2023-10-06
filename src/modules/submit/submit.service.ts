import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { SelectQueryBuilder, WhereExpressionBuilder } from 'typeorm';
import { SubmitCodePaging, SubmitCodeSearchOptions } from './dto';
import { SubmitCode } from '@/modules/submit/entities';
import { Problem } from '@/modules/problem/entities';
import { User } from '@/modules/user/entities';
import { SCORE_STATE } from '@/constants';
import {
  createKeyOfJudgeStatus,
  createRecordJudgeStatusFn,
  judge,
} from '@/utils';
import { JudgeStatus } from '@/types/judge';
import { TEST_CASE_TYPE } from '@/constants';
import { Interval } from '@nestjs/schedule';
import type { JudgeItem } from '@/types/judge';
import { Brackets } from 'typeorm';

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

  private judgeWaitingQueue: JudgeItem[] = [];

  private judgingCount = 0;

  private MAX_JUDGING_COUNT = 2;

  constructor(
    @InjectRepository(SubmitCode) private readonly repo: Repository<SubmitCode>,
  ) {}

  enqueueJudgeItem(data: JudgeItem) {
    this.judgeWaitingQueue.push(data);
  }

  getApplyOptionsSelectQB(
    options: SubmitCodeSearchOptions,
  ): SelectQueryBuilder<SubmitCode> {
    const { problemId, snsId, resultType } = options;

    const wheres: ApplyWhereExpressionFunction[] = [];

    switch (resultType) {
      case 'right':
        wheres.push((qb: WhereExpressionBuilder) => {
          qb.andWhere(
            new Brackets((qb) => {
              qb.orWhere(`submitCode.correct_score = 100`).orWhere(
                `submitCode.correct_score = ${SCORE_STATE.NOT_EXIST}`,
              );
            }),
          ).andWhere(
            new Brackets((qb) => {
              qb.orWhere(`submitCode.valid_score = 100`).orWhere(
                `submitCode.valid_score = ${SCORE_STATE.NOT_EXIST}`,
              );
            }),
          );
        });
        break;
      case 'wrong':
        wheres.push((qb: WhereExpressionBuilder) => {
          qb.andWhere(
            new Brackets((qb) => {
              qb.orWhere(`submitCode.correct_score = 0`).orWhere(
                `submitCode.correct_score = ${SCORE_STATE.NOT_EXIST}`,
              );
            }),
          ).andWhere(
            new Brackets((qb) => {
              qb.orWhere(`submitCode.valid_score = 0`).orWhere(
                `submitCode.valid_score = ${SCORE_STATE.NOT_EXIST}`,
              );
            }),
          );
        });
        break;
      case 'correct':
        wheres.push((qb: WhereExpressionBuilder) => {
          qb.andWhere(
            new Brackets((qb) => {
              qb.orWhere(`submitCode.correct_score = 100`);
            }),
          );
        });
        break;
      case 'valid':
        wheres.push((qb: WhereExpressionBuilder) => {
          qb.andWhere(
            new Brackets((qb) => {
              qb.orWhere(`submitCode.valid_score = 100`);
            }),
          );
        });
        break;
      default:
        break;
    }

    if (!isNaN(problemId)) {
      wheres.push((qb: WhereExpressionBuilder) => {
        qb.andWhere(`problem.id = ${problemId}`);
      });
    }

    if (!isNaN(snsId)) {
      wheres.push((qb: WhereExpressionBuilder) => {
        qb.andWhere(`user.snsId = ${snsId}`);
      });
    }

    const applyOptionsSelectQB = this.repo
      .createQueryBuilder('submitCode')
      .select()
      .where(
        new Brackets((qb) => {
          wheres.forEach((where) => {
            where(qb);
          });
        }),
      )
      .leftJoin('submitCode.problem', 'problem')
      .leftJoin('submitCode.user', 'user')
      .addSelect([
        'problem.id',
        'problem.level',
        'problem.title',
        'problem.number',
        'user.snsId',
        'user.name',
      ]);

    return applyOptionsSelectQB;
  }

  async getSubmitCodeList(options: SubmitCodePaging) {
    const { pageNum, countPerPage } = options;

    const submitCodeList = await this.getApplyOptionsSelectQB(options)
      .skip(countPerPage * (pageNum - 1))
      .take(countPerPage)
      .orderBy('submitCode.createdAt', 'DESC')
      .getMany();

    return submitCodeList;
  }

  async getSubmitCodeListSize(options: SubmitCodeSearchOptions) {
    const length = await this.getApplyOptionsSelectQB(options).getCount();

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

  @Interval('judge', 1000)
  public async startJudge() {
    if (this.judgingCount >= this.MAX_JUDGING_COUNT) {
      return;
    }

    const judgeItem = this.judgeWaitingQueue.shift();

    if (!judgeItem) {
      return;
    }

    this.judgingCount++;

    const { problem, submitCodeId, testCases } = judgeItem;

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

    this.judgingCount--;
  }

  async getSubmitCodeStatus(
    submitCodeId: number,
    type: TEST_CASE_TYPE,
  ): Promise<JudgeStatus | undefined> {
    return this.testCaseStatus.get(createKeyOfJudgeStatus(submitCodeId, type));
  }
}
