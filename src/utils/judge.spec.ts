import { v4 as uuidv4 } from 'uuid';
import { judge } from './judge';

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
});
