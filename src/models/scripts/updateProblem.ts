import { AppDataSource } from '@/models/data-source';
import { Problem } from '@/models/entity';
import { createCorrectTestCases, createValidTestCases } from './utils';
import {
  getRepoContent,
  getProblemReadmeFile,
  getProblemTemplate,
} from './apis';

/**
 * 당장은 중복된 이름의 문제가 있을 경우 새롭게 문제를 추가하지 않도록 구현.
 * TODO: 추후 중복된 이름의 문제에 대해서는 변경된 데이터를 갱신하는 식으로 구현 할 예정.
 */
const updateTableData = async () => {
  /**
   * type-challenges 레포지토리의 questions 폴더 안의, 문제 폴더들의 경로를 가져와 가공한다.
   * https://github.com/type-challenges/type-challenges/tree/main/questions
   */
  const questionsDirectory = await getRepoContent('questions');

  if (!(questionsDirectory instanceof Array)) {
    throw new Error('폴더가 아닌 파일 데이터를 응답받았습니다.');
  }

  /**
   * questions 폴더 안의, 문제 파일들(README.md, test-cases.ts, template.ts)을 읽어와 가공한 후
   * 데이터베이스에 저장하는 작업을 비동기로 수행한다.
   */
  const problemDirectories = questionsDirectory.filter(
    ({ type }) => type === 'dir',
  );

  const result = await Promise.all(
    problemDirectories.map(async (problemDirectory) => {
      try {
        await AppDataSource.transaction(async (transactionalEntityManager) => {
          const files = await getRepoContent(problemDirectory.path);

          const [number, level, ...title] = problemDirectory.name.split('-');
          const { description, language } = await getProblemReadmeFile(files);

          const problem = new Problem();

          problem.title = title.join(' ');
          problem.number = parseInt(number);
          problem.level = level;
          problem.description = description;
          problem.language = language;
          problem.template = await getProblemTemplate(files);
          problem.testCase = [
            ...(await createCorrectTestCases(
              files,
              transactionalEntityManager,
            )),
            ...(await createValidTestCases(files, transactionalEntityManager)),
          ];

          await transactionalEntityManager.save(problem);
        });

        return true;
      } catch (e) {
        return false;
      }
    }),
  );

  console.log(
    `${result.reduce((a, c) => a + (c ? 1 : 0), 0)}/${
      problemDirectories.length
    } 성공`,
  );
};

// 진입점 (entry point)
(async () => {
  try {
    await AppDataSource.initialize();

    updateTableData();
  } catch (err) {
    console.error(err);
  }
})();
