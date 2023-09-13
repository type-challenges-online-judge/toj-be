import { TestCase } from '@/models/entity';
import type { EntityManager } from 'typeorm';

export const createCorrectTestCases = async (
  template: string,
  transactionalEntityManager: EntityManager,
): Promise<TestCase[]> => {
  const ret: TestCase[] = [];

  const correctRegExp =
    /Expect\s*<\s*(Equal|Alike)\s*<(.|\n)*?(>\s*){2,},{0,1}/g;

  const correctTestTemplate = template.replaceAll('// @ts-expect-error', '');

  const correctTestCases = template.match(correctRegExp);

  if (!correctTestCases) {
    return ret;
  }

  for (let i = 0; i < correctTestCases.length; i++) {
    const testcase = new TestCase();

    testcase.case = correctTestCases[i];
    testcase.type = 'correct';

    let dupTemplate = correctTestTemplate;

    for (let j = 0; j < correctTestCases.length; j++) {
      if (i === j) {
        continue;
      }

      dupTemplate = dupTemplate.replace(correctTestCases[j], '');
    }

    testcase.template = dupTemplate;

    await transactionalEntityManager.save(testcase);

    ret.push(testcase);
  }

  return ret;
};

export const createValidTestCases = async (
  template: string,
  transactionalEntityManager: EntityManager,
): Promise<TestCase[]> => {
  const ret: TestCase[] = [];

  const correctRegExp =
    /Expect\s*<\s*(Equal|Alike)\s*<(.|\n)*?(>\s*){2,},{0,1}/g;

  const validTestTemplate = template.replaceAll(correctRegExp, '');

  const validTestCases = template.match(/\/\/ @ts-expect-error\n.*?\n/g);

  if (!validTestCases) {
    return ret;
  }

  for (let i = 0; i < validTestCases.length; i++) {
    const testcase = new TestCase();

    testcase.case = validTestCases[i];
    testcase.type = 'valid';

    let dupTemplate = validTestTemplate;

    for (let j = 0; j < validTestCases.length; j++) {
      if (i === j) {
        continue;
      }

      const willRemovedString = validTestCases[j].replace(
        '// @ts-expect-error\n',
        '',
      );

      dupTemplate = dupTemplate.replace(validTestCases[j], willRemovedString);
    }

    testcase.template = dupTemplate;

    await transactionalEntityManager.save(testcase);

    ret.push(testcase);
  }

  return ret;
};
