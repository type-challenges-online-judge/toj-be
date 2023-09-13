import { AppDataSource } from '@/models/data-source';
import { Octokit } from 'octokit';
import { configService } from '@/config/config.service';
import { Problem, TestCase } from '@/models/entity';

const typeChallengeRepositoryOctokitInfo = {
  owner: 'type-challenges',
  repo: 'type-challenges',
  path: '',
  headers: {
    'X-GitHub-Api-Version': '2022-11-28',
  },
};

const octokit = new Octokit({
  auth: configService.GITHUB_PERSONAL_TOKEN,
});

/**
 * 당장은 중복된 이름의 문제가 있을 경우 새롭게 문제를 추가하지 않도록 구현.
 * TODO: 추후 중복된 이름의 문제에 대해서는 변경된 데이터를 갱신하는 식으로 구현 할 예정.
 */
AppDataSource.initialize()
  .then(async () => {
    console.log('연결 성공');

    /**
     * type-challenges 레포지토리의 questions 폴더 안의, 문제 폴더들의 경로를 가져온다.
     *
     * https://github.com/type-challenges/type-challenges/tree/main/questions
     */
    const { data: data } = await octokit.rest.repos.getContent({
      ...typeChallengeRepositoryOctokitInfo,
      path: 'questions',
    });

    if (!(data instanceof Array)) {
      return;
    }

    const questionDirectories = data
      .filter((v) => v.type === 'dir')
      .map((v) => ({ path: v.path, name: v.name }));

    /**
     * 문제 폴더 내 파일들을 가져온다.
     */
    Promise.all(
      questionDirectories.map(async (directory) => {
        try {
          await AppDataSource.transaction(
            async (transactionalEntityManager) => {
              const [number, level, ...title] = directory.name.split('-');

              const { data: data } = await octokit.rest.repos.getContent({
                ...typeChallengeRepositoryOctokitInfo,
                path: directory.path,
              });

              if (!(data instanceof Array)) {
                return;
              }

              const problem = new Problem();

              problem.title = title.join(' ');
              problem.number = parseInt(number);
              problem.level = level;

              const files = data.filter(({ type }) => type === 'file');

              // 테스트 케이스 제작
              const testcases = [];

              const [testCaseFile] = files.filter(
                ({ name }) => name === 'test-cases.ts',
              );

              if (testCaseFile) {
                const { data: data } = await octokit.rest.repos.getContent({
                  ...typeChallengeRepositoryOctokitInfo,
                  path: testCaseFile.path,
                });

                // @ts-ignore
                const template = atob(data.content);

                // 정확성 테스트케이스 제작
                const correctRegExp =
                  /Expect\s*<\s*(Equal|Alike)\s*<(.|\n)*?(>\s*){2,},{0,1}/g;

                const correctTestTemplate = template.replaceAll(
                  '// @ts-expect-error',
                  '',
                );

                const correctTestCases = template.match(correctRegExp);

                if (correctTestCases instanceof Array) {
                  for (let i = 0; i < correctTestCases.length; i++) {
                    const testcase = new TestCase();

                    testcase.case = correctTestCases[i];
                    testcase.type = 'correct';

                    let dupTemplate = correctTestTemplate;

                    for (let j = 0; j < correctTestCases.length; j++) {
                      if (i === j) {
                        continue;
                      }

                      dupTemplate = dupTemplate.replace(
                        correctTestCases[j],
                        '',
                      );
                    }

                    testcase.template = dupTemplate;

                    await transactionalEntityManager.save(testcase);

                    testcases.push(testcase);
                  }
                }

                // 유효성 테스트케이스 제작
                const validTestTemplate = template.replaceAll(
                  correctRegExp,
                  '',
                );

                const validTestCases = template.match(
                  /\/\/ @ts-expect-error\n.*?\n/g,
                );

                if (validTestCases instanceof Array) {
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

                      dupTemplate = dupTemplate.replace(
                        validTestCases[j],
                        willRemovedString,
                      );
                    }

                    testcase.template = dupTemplate;

                    await transactionalEntityManager.save(testcase);

                    testcases.push(testcase);
                  }
                }
              }

              const readmeFiles = files
                .filter(({ name }) => /readme(\.ko){0,1}\.md/gi.test(name))
                .sort((a, b) => (a.name.length > b.name.length ? -1 : 1));

              if (readmeFiles.length > 0) {
                const { data: data } = await octokit.rest.repos.getContent({
                  ...typeChallengeRepositoryOctokitInfo,
                  path: readmeFiles[0].path,
                });

                // @ts-ignore
                problem.description = atob(data.content);
                problem.language = 'ko';
              }

              const [template] = files.filter(
                ({ name }) => name === 'template.ts',
              );

              if (template) {
                const { data: data } = await octokit.rest.repos.getContent({
                  ...typeChallengeRepositoryOctokitInfo,
                  path: template.path,
                });

                // @ts-ignore
                problem.template = atob(data.content);
              }

              problem.testCase = testcases;

              await transactionalEntityManager.save(problem);
            },
          );

          return true;
        } catch (e) {
          return false;
        }
      }),
    ).then((res) => {
      console.log(
        `${res.reduce((a, c) => a + (c ? 1 : 0), 0)}/${
          questionDirectories.length
        } 성공`,
      );
    });
  })
  .catch((err) => {
    console.log('연결 실패', err);
  });
