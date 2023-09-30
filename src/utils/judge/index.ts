import * as fs from 'node:fs';
import { join } from 'node:path';
import { spawn } from 'node:child_process';
import { ROOT_PATH, TEST_CASE_TYPE, SCORE_STATE } from '@/constants';
import { SubmitCode } from '@/modules/submit/entities';
import { Repository } from 'typeorm';
import { JudgeStatus } from '@/types/judge';

const createJudgingFile = (path: string, data: string): Promise<void> => {
  return new Promise<void>((resolve) => {
    fs.writeFile(path, data, { encoding: 'utf-8' }, () => {
      resolve();
    });
  });
};

const judgeFile = (cmd: string): Promise<boolean> => {
  return new Promise<boolean>((resolve) => {
    const process = spawn(cmd, {
      cwd: ROOT_PATH,
      shell: true,
    });

    process.stderr.on('data', () => {
      resolve(false);
    });

    process.on('close', () => {
      resolve(true);
    });
  });
};

export const createKeyOfJudgeStatus = (
  submitCodeId: number,
  type: TEST_CASE_TYPE,
): string => `${submitCodeId}|${type}`;

export const judge = async (
  submitId: number,
  submitCode: string,
  testCaseId: number,
  testCaseTemplate: string,
): Promise<boolean> => {
  const path = join(__dirname, `${submitId}-${testCaseId}.submit.ts`);
  const data = `${submitCode}\n${testCaseTemplate}`;

  await createJudgingFile(path, data);

  const tsNodeRelativePath = join(ROOT_PATH, 'node_modules', '.bin', 'ts-node');
  const cmd = `${tsNodeRelativePath} ${path}`;

  const result = await judgeFile(cmd);

  return result;
};

export const createRecordJudgeStatusFn =
  (
    submitCodeId: number,
    submitCode: SubmitCode,
    submitCodeRepo: Repository<SubmitCode>,
    testCaseStatus: Map<string, JudgeStatus>,
  ) =>
  ({
    state,
    type,
    currentTestCase,
    totalTestCaseLength,
    score,
  }: {
    type?: TEST_CASE_TYPE;
  } & JudgeStatus) => {
    /**
     * db에 반영
     */
    let newState = state;

    if (state === SCORE_STATE.DONE && score >= 0) {
      newState = score;
    }

    if (state !== SCORE_STATE.COMPLETE) {
      switch (type) {
        case TEST_CASE_TYPE.CORRECT:
          submitCode.correct_score = newState;
          break;

        case TEST_CASE_TYPE.VALID:
          submitCode.valid_score = newState;
          break;

        default:
          submitCode.correct_score = submitCode.valid_score = newState;
          break;
      }
    }

    submitCodeRepo.save(submitCode);

    /**
     * testCase 캐시에 상태 저장
     */
    switch (state) {
      case SCORE_STATE.ERROR:
      case SCORE_STATE.PROGRESSING:
        testCaseStatus.set(
          createKeyOfJudgeStatus(submitCodeId, TEST_CASE_TYPE.CORRECT),
          { state },
        );

        testCaseStatus.set(
          createKeyOfJudgeStatus(submitCodeId, TEST_CASE_TYPE.VALID),
          { state },
        );

        break;

      case SCORE_STATE.COMPLETE:
        testCaseStatus.set(createKeyOfJudgeStatus(submitCodeId, type), {
          state,
          currentTestCase,
          totalTestCaseLength,
        });

        break;

      case SCORE_STATE.NOT_EXIST:
        testCaseStatus.set(createKeyOfJudgeStatus(submitCodeId, type), {
          state,
        });

        break;

      case SCORE_STATE.DONE:
        testCaseStatus.set(createKeyOfJudgeStatus(submitCodeId, type), {
          state,
          score,
        });

        break;
    }
  };
