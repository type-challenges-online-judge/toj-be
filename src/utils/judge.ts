import * as fs from 'node:fs';
import { join } from 'node:path';
import { spawn } from 'node:child_process';

const createJudgingFile = (path: string, data: string): Promise<void> => {
  return new Promise<void>((resolve) => {
    fs.writeFile(path, data, { encoding: 'utf-8' }, () => {
      resolve();
    });
  });
};

const judgeFile = (cmd: string): Promise<boolean> => {
  const projectRootPath = join(__dirname, '..', '..');

  return new Promise<boolean>((resolve) => {
    const process = spawn(cmd, {
      cwd: projectRootPath,
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

export const judge = async (
  submitId: number,
  submitCode: string,
  testCaseId: number,
  testCaseTemplate: string,
): Promise<boolean> => {
  const path = join(__dirname, `${submitId}-${testCaseId}.submit.ts`);
  const data = `${submitCode}\n${testCaseTemplate}`;

  await createJudgingFile(path, data);

  const tsNodeRelativePath = join('.', 'node_modules', '.bin', 'ts-node');
  const cmd = `${tsNodeRelativePath} ${path}`;

  const result = await judgeFile(cmd);

  return result;
};
