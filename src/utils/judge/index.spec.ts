import { v4 as uuidv4 } from 'uuid';
import { judge, createRecordJudgeStatusFn, createKeyOfJudgeStatus } from '.';
import { JudgeStatus } from '@/types/judge';
import { SubmitCode } from '@/modules/submit/entities';
import { Repository } from 'typeorm';
import { SCORE_STATE, TEST_CASE_TYPE } from '@/constants';

describe('judge util test', () => {
  const testCaseTemplate = `
    import type { Equal, Expect } from '@type-challenges/utils'

    type cases = [
      Expect<Equal<First<[3, 2, 1]>, 3>>,
      Expect<Equal<First<[() => 123, { a: string }]>, () => 123>>,
      Expect<Equal<First<[]>, never>>,
      Expect<Equal<First<[undefined]>, undefined>>,
    ]
    
    type errors = [
      // @ts-expect-error
      First<'notArray'>,
      // @ts-expect-error
      First<{ 0: 'arrayLike' }>,
    ]
  `;

  it('모든 케이스를 통과하는 제출 코드일 경우', async () => {
    const submitId = uuidv4();
    const testCaseId = uuidv4();

    const submitCode = `
      type First<T extends any[]> = T extends (infer R)[]
        ? R extends unknown
          ? T[0]
          : never
        : never
    `;

    const result = await judge(
      submitId,
      submitCode,
      testCaseId,
      testCaseTemplate,
    );

    expect(result).toEqual(true);
  });

  it('입력 케이스에서 실패하는 제출 코드일 경우', async () => {
    const submitId = uuidv4();
    const testCaseId = uuidv4();

    const submitCode = `
      type First<T> = T extends (infer R)[]
        ? R extends unknown
          ? T[0]
          : never
        : never
    `;

    const result = await judge(
      submitId,
      submitCode,
      testCaseId,
      testCaseTemplate,
    );

    expect(result).toEqual(false);
  });

  it('출력 케이스에서 실패하는 제출 코드일 경우', async () => {
    const submitId = uuidv4();
    const testCaseId = uuidv4();

    const submitCode = `
      type First<T> = any
    `;

    const result = await judge(
      submitId,
      submitCode,
      testCaseId,
      testCaseTemplate,
    );

    expect(result).toEqual(false);
  });

  describe('채점 현황이 올바르게 수정, 기록되는지 확인', () => {
    const testCaseStatus: Map<string, JudgeStatus> = new Map();

    const mockSubmitCodeId = -1;
    const mockSubmitCodeObj = {} as SubmitCode;
    const mockSubmitCodeRepo = {
      save: () => {},
    } as unknown as Repository<SubmitCode>;

    const recordJudgeStatus = createRecordJudgeStatusFn(
      mockSubmitCodeId,
      mockSubmitCodeObj,
      mockSubmitCodeRepo,
      testCaseStatus,
    );

    it('[Error] 에러 상태 기록', () => {
      recordJudgeStatus({ state: SCORE_STATE.ERROR });

      expect(mockSubmitCodeObj.correct_score).toEqual(SCORE_STATE.ERROR);
      expect(mockSubmitCodeObj.valid_score).toEqual(SCORE_STATE.ERROR);

      expect(
        testCaseStatus.get(
          createKeyOfJudgeStatus(mockSubmitCodeId, TEST_CASE_TYPE.CORRECT),
        ).state,
      ).toEqual(SCORE_STATE.ERROR);

      expect(
        testCaseStatus.get(
          createKeyOfJudgeStatus(mockSubmitCodeId, TEST_CASE_TYPE.VALID),
        ).state,
      ).toEqual(SCORE_STATE.ERROR);
    });

    it('[Progressing] 진행 중 상태 기록', () => {
      recordJudgeStatus({ state: SCORE_STATE.PROGRESSING });

      expect(mockSubmitCodeObj.correct_score).toEqual(SCORE_STATE.PROGRESSING);
      expect(mockSubmitCodeObj.valid_score).toEqual(SCORE_STATE.PROGRESSING);

      expect(
        testCaseStatus.get(
          createKeyOfJudgeStatus(mockSubmitCodeId, TEST_CASE_TYPE.CORRECT),
        ).state,
      ).toEqual(SCORE_STATE.PROGRESSING);

      expect(
        testCaseStatus.get(
          createKeyOfJudgeStatus(mockSubmitCodeId, TEST_CASE_TYPE.VALID),
        ).state,
      ).toEqual(SCORE_STATE.PROGRESSING);
    });

    it('[Not Exist] 테스트케이스가 존재하지 않음을 기록테스트케이스가 존재하지 않음(not exist)을 기록', () => {
      recordJudgeStatus({
        state: SCORE_STATE.NOT_EXIST,
        type: TEST_CASE_TYPE.VALID,
      });

      expect(mockSubmitCodeObj.valid_score).toEqual(SCORE_STATE.NOT_EXIST);

      expect(
        testCaseStatus.get(
          createKeyOfJudgeStatus(mockSubmitCodeId, TEST_CASE_TYPE.VALID),
        ).state,
      ).toEqual(SCORE_STATE.NOT_EXIST);
    });

    it('[Complete] 테스트 케이스 일부 채점 완료 상태 기록', () => {
      const currentTestCase = 1;
      const totalTestCaseLength = 4;

      recordJudgeStatus({
        state: SCORE_STATE.COMPLETE,
        type: TEST_CASE_TYPE.CORRECT,
        currentTestCase,
        totalTestCaseLength,
      });

      expect(mockSubmitCodeObj.correct_score).not.toEqual(SCORE_STATE.COMPLETE);

      expect(
        testCaseStatus.get(
          createKeyOfJudgeStatus(mockSubmitCodeId, TEST_CASE_TYPE.CORRECT),
        ).currentTestCase,
      ).toEqual(currentTestCase);

      expect(
        testCaseStatus.get(
          createKeyOfJudgeStatus(mockSubmitCodeId, TEST_CASE_TYPE.CORRECT),
        ).totalTestCaseLength,
      ).toEqual(totalTestCaseLength);
    });

    it('[Done] 특정 유형의 테스트케이스 채점이 종료됨을 기록', () => {
      const finalScore = 66.6;

      recordJudgeStatus({
        state: SCORE_STATE.DONE,
        type: TEST_CASE_TYPE.CORRECT,
        score: finalScore,
      });

      expect(mockSubmitCodeObj.correct_score).toEqual(finalScore);

      expect(
        testCaseStatus.get(
          createKeyOfJudgeStatus(mockSubmitCodeId, TEST_CASE_TYPE.CORRECT),
        ).state,
      ).toEqual(SCORE_STATE.DONE);

      expect(
        testCaseStatus.get(
          createKeyOfJudgeStatus(mockSubmitCodeId, TEST_CASE_TYPE.CORRECT),
        ).score,
      ).toEqual(finalScore);
    });
  });
});
