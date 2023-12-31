import { Octokit } from 'octokit';
import { configService } from '@/config';
import { decodeBase64UTF8 } from '@/utils';
import type { GetResponseDataTypeFromEndpointMethod } from '@octokit/types';

const octokit = new Octokit({
  auth: configService.GITHUB_PERSONAL_TOKEN,
});

type RepositoryContentResponseDataType = GetResponseDataTypeFromEndpointMethod<
  typeof octokit.rest.repos.getContent
>;

export const getRepoContent = async (
  path: string,
): Promise<RepositoryContentResponseDataType> => {
  const { data: data } = await octokit.rest.repos.getContent({
    owner: 'type-challenges',
    repo: 'type-challenges',
    headers: {
      'X-GitHub-Api-Version': '2022-11-28',
    },
    path,
  });

  return data;
};

export const getProblemReadmeFile = async (
  files: RepositoryContentResponseDataType,
): Promise<{ description: string; language: string }> => {
  const ret = {
    description: '',
    language: '',
  };

  if (!(files instanceof Array)) {
    return ret;
  }

  const readmeFile = files
    .filter(({ name }) => /readme(\.ko){0,1}\.md/gi.test(name))
    .sort((a, b) => (a.name.length > b.name.length ? -1 : 1))[0];

  if (!readmeFile) {
    return ret;
  }

  /**
   * octokit의 타입 추론에 문제가 있어 임시로 any 타입을 할당하여 사용함.
   */
  const file = (await getRepoContent(readmeFile.path)) as any;

  ret.description = decodeBase64UTF8(file.content);

  ret.language = /readme.ko.md/gi.test(file.name) ? 'ko' : 'en';

  return ret;
};

export const getProblemTemplate = async (
  files: RepositoryContentResponseDataType,
): Promise<string> => {
  let ret = '';

  if (!(files instanceof Array)) {
    return ret;
  }

  const templateFile = files.filter(({ name }) => name === 'template.ts')[0];

  if (!templateFile) {
    return ret;
  }

  /**
   * octokit의 타입 추론에 문제가 있어 임시로 any 타입을 할당하여 사용함.
   */
  const file = (await getRepoContent(templateFile.path)) as any;

  ret = decodeBase64UTF8(file.content);

  return ret;
};

export const getProblemTestCases = async (
  files: RepositoryContentResponseDataType,
): Promise<string> => {
  let ret = '';

  if (!(files instanceof Array)) {
    return ret;
  }

  const testCaseFile = files.filter(({ name }) => name === 'test-cases.ts')[0];

  if (!testCaseFile) {
    return ret;
  }

  /**
   * octokit의 타입 추론에 문제가 있어 임시로 any 타입을 할당하여 사용함.
   */
  const file = (await getRepoContent(testCaseFile.path)) as any;

  ret = decodeBase64UTF8(file.content);

  return ret;
};
