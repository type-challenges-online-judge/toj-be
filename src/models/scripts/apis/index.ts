import { Octokit } from 'octokit';
import { configService } from '@/config/config.service';
import type { GetResponseDataTypeFromEndpointMethod } from '@octokit/types';

const octokit = new Octokit({
  auth: configService.GITHUB_PERSONAL_TOKEN,
});

export type RepositoryContentResponseDataType =
  GetResponseDataTypeFromEndpointMethod<typeof octokit.rest.repos.getContent>;

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

  const file = await getRepoContent(readmeFile.path);

  // @ts-ignore
  ret.description = atob(file.content);
  // @ts-ignore
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

  const file = await getRepoContent(templateFile.path);

  // @ts-ignore
  ret = atob(file.content);

  return ret;
};
