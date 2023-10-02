import { SCORE_STATE } from '@/constants';

export type JudgeStatus = {
  state: SCORE_STATE;
  score?: number;
  currentTestCase?: number;
  totalTestCaseLength?: number;
};

export type JudgeItem = {
  submitCodeId: number;
  problem: Problem;
  testCases: TestCase[];
};
