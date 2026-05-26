import { promises as fs } from 'fs';
import os from 'os';
import path from 'path';
import { runCli } from '../src';

const makeTempDir = () => fs.mkdtemp(path.join(os.tmpdir(), 'illustry-cli-'));

describe('@illustry/cli', () => {
  let tempDir: string;
  const output: string[] = [];

  beforeEach(async () => {
    tempDir = await makeTempDir();
    output.length = 0;
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  it('imports, lists, and exports locally without server access', async () => {
    const source = path.join(tempDir, 'data.csv');
    const exportsDir = path.join(tempDir, 'exports');
    await fs.writeFile(source, 'label,value\nA,5\nB,8\n', 'utf8');

    await runCli([
      'import',
      'visualization',
      '--workspace',
      tempDir,
      '--file',
      source,
      '--name',
      'CLI Chart',
      '--json'
    ], { stdout: (message) => output.push(message) });

    const list = await runCli(['list', '--workspace', tempDir, '--json'], {
      stdout: (message) => output.push(message)
    });
    expect(JSON.stringify(list)).toContain('CLI Chart');

    const exported = await runCli([
      'export',
      '--workspace',
      tempDir,
      '--asset',
      'CLI Chart',
      '--format',
      'json',
      '--out',
      exportsDir,
      '--json'
    ], { stdout: (message) => output.push(message) });
    expect(JSON.stringify(exported)).toContain('CLI-Chart.json');
    await expect(fs.access(path.join(exportsDir, 'CLI-Chart.json'))).resolves.toBeUndefined();
  });
});
