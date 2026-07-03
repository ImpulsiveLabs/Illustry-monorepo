#!/usr/bin/env node
import { execSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const root = process.cwd();

const packages = {
  types: {
    name: '@illustry/types',
    dir: 'types',
    dependents: ['core'],
  },
  core: {
    name: '@illustry/core',
    dir: 'packages/core',
    dependents: ['cli'],
  },
  cli: {
    name: '@illustry/cli',
    dir: 'packages/cli',
    dependents: [],
  },
};

const packageOrder = ['types', 'core', 'cli'];

function parseArgs(argv) {
  const args = {};
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (!arg.startsWith('--')) {
      continue;
    }
    const key = arg.slice(2);
    const next = argv[index + 1];
    if (!next || next.startsWith('--')) {
      args[key] = 'true';
      continue;
    }
    args[key] = next;
    index += 1;
  }
  return args;
}

function booleanArg(value) {
  return value === true || value === 'true' || value === '1' || value === 'yes';
}

function readJson(file) {
  return JSON.parse(readFileSync(path.join(root, file), 'utf8'));
}

function writeJson(file, value) {
  writeFileSync(path.join(root, file), `${JSON.stringify(value, null, 2)}\n`);
}

function bumpVersion(version, bump) {
  if (bump === 'none') {
    return version;
  }

  const [majorRaw, minorRaw, patchRaw] = version.split('.');
  let major = Number(majorRaw);
  let minor = Number(minorRaw);
  let patch = Number(patchRaw);

  if (![major, minor, patch].every(Number.isInteger)) {
    throw new Error(`Cannot bump non-semver version "${version}".`);
  }

  if (bump === 'major') {
    major += 1;
    minor = 0;
    patch = 0;
  } else if (bump === 'minor') {
    minor += 1;
    patch = 0;
  } else if (bump === 'patch') {
    patch += 1;
  } else {
    throw new Error(`Unsupported version bump "${bump}". Use major, minor, patch, or none.`);
  }

  return `${major}.${minor}.${patch}`;
}

function ordered(keys) {
  const set = new Set(keys);
  return packageOrder.filter((key) => set.has(key));
}

function expandDependents(keys) {
  const selected = new Set(keys);
  let changed = true;
  while (changed) {
    changed = false;
    for (const key of [...selected]) {
      for (const dependent of packages[key].dependents) {
        if (!selected.has(dependent)) {
          selected.add(dependent);
          changed = true;
        }
      }
    }
  }
  return ordered(selected);
}

function packageSet(target) {
  if (target === 'all') {
    return packageOrder;
  }
  if (!packages[target]) {
    throw new Error(`Unknown package set "${target}". Use types, core, cli, all, or auto.`);
  }
  return expandDependents([target]);
}

function changedFiles(before, after) {
  if (!before || /^0+$/.test(before)) {
    return execLines(`git diff-tree --no-commit-id --name-only -r ${after}`);
  }
  return execLines(`git diff --name-only ${before} ${after}`);
}

function execLines(command) {
  try {
    return execSync(command, { cwd: root, encoding: 'utf8' })
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean);
  } catch {
    return [];
  }
}

function detectPackages(files) {
  const selected = new Set();

  for (const file of files) {
    if (file.startsWith('types/')) {
      selected.add('types');
    } else if (file.startsWith('packages/core/')) {
      selected.add('core');
    } else if (file.startsWith('packages/cli/')) {
      selected.add('cli');
    } else if (
      file === 'package.json' ||
      file === 'yarn.lock' ||
      file === 'scripts/release-packages.mjs' ||
      file === '.github/workflows/publish-packages.yml'
    ) {
      for (const key of packageOrder) {
        selected.add(key);
      }
    }
  }

  return expandDependents(selected);
}

function updateInternalDependency(packageJson, dependencyName, version) {
  for (const field of ['dependencies', 'devDependencies', 'peerDependencies']) {
    if (packageJson[field]?.[dependencyName]) {
      packageJson[field][dependencyName] = version;
    }
  }
}

function writeOutput(name, value) {
  const line = `${name}=${value}\n`;
  if (process.env.GITHUB_OUTPUT) {
    writeFileSync(process.env.GITHUB_OUTPUT, line, { flag: 'a' });
  } else {
    process.stdout.write(line);
  }
}

function shellQuote(value) {
  return `'${String(value).replaceAll("'", "'\\''")}'`;
}

function commitReleaseChanges(message, shouldPush) {
  const files = [
    'types/package.json',
    'packages/core/package.json',
    'packages/cli/package.json',
    'yarn.lock',
  ].filter((file) => existsSync(path.join(root, file)));

  execSync(`git add -- ${files.map(shellQuote).join(' ')}`, { cwd: root, stdio: 'inherit' });

  try {
    execSync('git diff --cached --quiet', { cwd: root, stdio: 'ignore' });
    process.stdout.write('No version or dependency files changed.\n');
    return;
  } catch {
    execSync('git config user.name "github-actions[bot]"', { cwd: root, stdio: 'inherit' });
    execSync('git config user.email "41898282+github-actions[bot]@users.noreply.github.com"', {
      cwd: root,
      stdio: 'inherit',
    });
    execSync(`git commit -m ${shellQuote(message)}`, { cwd: root, stdio: 'inherit' });
  }

  if (shouldPush) {
    execSync('git push', { cwd: root, stdio: 'inherit' });
  }
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const commitMessage = args['commit-message'] ?? 'chore(release): bump Illustry packages [skip ci]';

  if (booleanArg(args['commit-only'])) {
    commitReleaseChanges(commitMessage, booleanArg(args.push));
    return;
  }

  const event = args.event ?? process.env.GITHUB_EVENT_NAME ?? 'workflow_dispatch';
  const bump = args.bump ?? 'minor';
  const target = args.package ?? (event === 'push' ? 'auto' : 'all');
  const before = args.before ?? process.env.GITHUB_EVENT_BEFORE;
  const after = args.after ?? process.env.GITHUB_SHA ?? 'HEAD';

  const files = event === 'push' || target === 'auto' ? changedFiles(before, after) : [];
  const selected = target === 'auto' ? detectPackages(files) : packageSet(target);

  if (selected.length === 0) {
    writeOutput('has_changes', 'false');
    writeOutput('package_dirs', '');
    writeOutput('package_names', '');
    writeOutput('changed_files', files.join(' '));
    return;
  }

  const packageJsonByKey = new Map();
  for (const key of packageOrder) {
    const packageJsonFile = path.join(packages[key].dir, 'package.json');
    if (!existsSync(path.join(root, packageJsonFile))) {
      throw new Error(`Missing ${packageJsonFile}.`);
    }
    packageJsonByKey.set(key, readJson(packageJsonFile));
  }

  const nextVersions = new Map();
  for (const key of selected) {
    const packageJson = packageJsonByKey.get(key);
    const nextVersion = bumpVersion(packageJson.version, bump);
    packageJson.version = nextVersion;
    nextVersions.set(key, nextVersion);
  }

  if (nextVersions.has('types')) {
    updateInternalDependency(packageJsonByKey.get('core'), packages.types.name, nextVersions.get('types'));
  }
  if (nextVersions.has('core')) {
    updateInternalDependency(packageJsonByKey.get('cli'), packages.core.name, nextVersions.get('core'));
  }

  if (bump !== 'none') {
    for (const key of packageOrder) {
      writeJson(path.join(packages[key].dir, 'package.json'), packageJsonByKey.get(key));
    }
  }

  writeOutput('has_changes', 'true');
  writeOutput('package_dirs', selected.map((key) => packages[key].dir).join(' '));
  writeOutput('package_names', selected.map((key) => packages[key].name).join(' '));
  writeOutput('versions', selected.map((key) => `${packages[key].name}@${packageJsonByKey.get(key).version}`).join(' '));
  writeOutput('changed_files', files.join(' '));

  if (booleanArg(args.commit)) {
    commitReleaseChanges(commitMessage, booleanArg(args.push));
  }
}

main();
