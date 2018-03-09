import { execSync } from 'child_process';
import { readFileSync, statSync, writeFileSync } from 'fs';
import * as path from 'path';

const projectName: string = 'proj';

export function runNgNew(command?: string, silent?: boolean): string {
  return execSync(`../node_modules/.bin/ng new proj ${command}`, {
    cwd: `./tmp`,
    ...(silent ? { stdio: ['ignore', 'ignore', 'ignore'] } : {})
  }).toString();
}

export function newProject(): void {
  cleanup();
  if (!directoryExists('./tmp/proj_backup')) {
    // TODO delete the try catch after 0.8.0 is released
    try {
      runNgNew('--collection=@nrwl/schematics --npmScope=proj', true);
    } catch (e) {}
    copyMissingPackages();
    execSync('npm run postinstall', { cwd: './tmp/proj' });
    execSync('mv ./tmp/proj ./tmp/proj_backup');
  }
  execSync('cp -a ./tmp/proj_backup ./tmp/proj');
}

export function newBazelProject(): void {
  cleanup();
  // TODO delete the try catch after 0.8.0 is released
  try {
    runNgNew('--collection=@nrwl/bazel --npmScope=proj --yarn', true);
  } catch (e) {}
  copyMissingPackages();
  execSync('npm run postinstall', { cwd: './tmp/proj' });
}

export function createNxWorkspace(command: string): string {
  cleanup();
  return execSync(
    `node ../node_modules/@nrwl/schematics/bin/create-nx-workspace.js --yarn ${command}`,
    { cwd: `./tmp` }
  ).toString();
}

export function copyMissingPackages(): void {
  const modulesToCopy = [
    '@ngrx',
    'jasmine-marbles',
    '@nrwl',
    'angular',
    '@angular/upgrade'
  ];
  modulesToCopy.forEach(m => copyNodeModule(projectName, m));
}

function copyNodeModule(path: string, name: string) {
  execSync(`rm -rf tmp/${path}/node_modules/${name}`);
  execSync(`cp -a node_modules/${name} tmp/${path}/node_modules/${name}`);
}

export function runCLI(
  command?: string,
  opts = {
    silenceError: false
  }
): string {
  try {
    return execSync(`./node_modules/.bin/ng ${command}`, {
      cwd: `./tmp/${projectName}`
    })
      .toString()
      .replace(
        /[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g,
        ''
      );
  } catch (e) {
    if (opts.silenceError) {
      return e.stdout.toString();
    } else {
      console.log(e.stdout.toString(), e.stderr.toString());
      throw e;
    }
  }
}

export function newApp(name: string, schematics?: string): string {
  return runCLI(`generate app ${name} ${schematics}`);
}

export function newABazelpp(name: string): string {
  return runCLI(
    `generate app ${name} --collection=@nrwl/bazel --npmScope=proj`
  );
}

export function newLib(name: string, collection?: string): string {
  const collectionFlag = collection ? `--collection=${collection}` : '';

  return runCLI(`generate lib ${name} ${collectionFlag}`);
}

export function newComponent(name: string, collection?: string): string {
  const collectionFlag = collection ? `--collection=${collection}` : '';

  return runCLI(`generate component ${name} ${collectionFlag}`);
}

export function runSchematic(command: string): string {
  return execSync(`./node_modules/.bin/schematics ${command}`, {
    cwd: `./tmp/${projectName}`
  }).toString();
}

export function runCommand(command: string): string {
  return execSync(command, { cwd: `./tmp/${projectName}` }).toString();
}

export function updateFile(f: string, content: string): void {
  writeFileSync(path.join(getCwd(), 'tmp', 'proj', f), content);
}

export function checkFilesExist(...expectedFiles: string[]) {
  expectedFiles.forEach(f => {
    const ff = f.startsWith('/')
      ? f
      : path.join(getCwd(), 'tmp', projectName, f);
    if (!exists(ff)) {
      throw new Error(`File '${ff}' does not exist`);
    }
  });
}

export function readFile(f: string) {
  const ff = f.startsWith('/') ? f : path.join(getCwd(), 'tmp', projectName, f);
  return readFileSync(ff).toString();
}

export function cleanup() {
  execSync('rm -rf ./tmp/proj');
}

export function purge() {
  execSync('rm -rf ./tmp');
}

export function getCwd(): string {
  return process.cwd();
}

export function directoryExists(filePath: string): boolean {
  try {
    return statSync(filePath).isDirectory();
  } catch (err) {
    return false;
  }
}

export function fileExists(filePath: string): boolean {
  try {
    return statSync(filePath).isFile();
  } catch (err) {
    return false;
  }
}

export function exists(filePath: string): boolean {
  return directoryExists(filePath) || fileExists(filePath);
}
