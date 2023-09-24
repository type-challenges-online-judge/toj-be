import * as fs from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

export const judge = (
  submitId: number,
  submitCode: string,
  testCaseId: number,
  testCaseTemplate: string,
): boolean => {
  const path = join(__dirname, `${submitId}-${testCaseId}.submit.ts`);
  const data = `${submitCode}\n${testCaseTemplate}`;

  fs.writeFileSync(path, data, {
    encoding: 'utf-8',
  });

  const projectRootPath = join(__dirname, '..', '..');
  const tsNodeRelativePath = join('.', 'node_modules', '.bin', 'ts-node');

  const result = spawnSync(`${tsNodeRelativePath} ${path}`, {
    cwd: projectRootPath,
    shell: true,
  });

  return result.stderr.byteLength === 0;
};
