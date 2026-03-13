import fs from 'node:fs/promises';
import process from 'node:process';
import load from '@commitlint/load';
import lint from '@commitlint/lint';

const commitMessagePath = process.argv[2];

if (!commitMessagePath) {
  console.error('Missing commit message file path.');
  process.exit(1);
}

const rawMessage = await fs.readFile(commitMessagePath, 'utf8');
const message = rawMessage.trim();

const loadedConfig = await load({}, { cwd: process.cwd() });
const result = await lint(message, loadedConfig.rules ?? {}, {
  defaultIgnores: loadedConfig.defaultIgnores,
  ignores: loadedConfig.ignores,
  parserPreset: loadedConfig.parserPreset,
  helpUrl: loadedConfig.helpUrl
});

if (result.valid) {
  process.exit(0);
}

for (const error of result.errors) {
  console.error(`commitlint error: ${error.message}`);
}
for (const warning of result.warnings) {
  console.warn(`commitlint warning: ${warning.message}`);
}

process.exit(1);
