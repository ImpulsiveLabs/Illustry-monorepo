#!/usr/bin/env node
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const root = process.cwd();

const packageMap = {
  'types': {
    githubName: '@impulsivelabs/illustry-types',
    originalName: '@illustry/types',
  },
  'packages/core': {
    githubName: '@impulsivelabs/illustry-core',
    originalName: '@illustry/core',
  },
  'packages/cli': {
    githubName: '@impulsivelabs/illustry-cli',
    originalName: '@illustry/cli',
  },
};

function readJson(file) {
  return JSON.parse(readFileSync(path.join(root, file), 'utf8'));
}

function writeJson(file, value) {
  writeFileSync(path.join(root, file), `${JSON.stringify(value, null, 2)}\n`);
}

function dependencyAlias(githubName, version) {
  return `npm:${githubName}@${version}`;
}

const packageJsonByDir = new Map();

for (const packageDir of Object.keys(packageMap)) {
  packageJsonByDir.set(packageDir, readJson(path.join(packageDir, 'package.json')));
}

const versions = Object.fromEntries(
  [...packageJsonByDir.entries()].map(([packageDir, packageJson]) => [packageDir, packageJson.version]),
);

for (const [packageDir, packageJson] of packageJsonByDir.entries()) {
  const mapping = packageMap[packageDir];
  packageJson.name = mapping.githubName;
  packageJson.repository = {
    type: 'git',
    url: 'git+https://github.com/ImpulsiveLabs/Illustry-monorepo.git',
  };

  if (packageDir === 'packages/core') {
    packageJson.dependencies['@illustry/types'] = dependencyAlias(packageMap.types.githubName, versions.types);
  }

  if (packageDir === 'packages/cli') {
    packageJson.dependencies['@illustry/core'] = dependencyAlias(
      packageMap['packages/core'].githubName,
      versions['packages/core'],
    );
  }

  writeJson(path.join(packageDir, 'package.json'), packageJson);
  process.stdout.write(`Prepared ${mapping.githubName}@${packageJson.version} for GitHub Packages.\n`);
}
