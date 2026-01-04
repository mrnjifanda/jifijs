#!/usr/bin/env node

import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import prompts from 'prompts';
import pc from 'picocolors';

interface PromptResult {
  projectName?: string;
  shouldOverwrite?: boolean;
  includeTests?: boolean;
  includeDocker?: boolean;
  installDeps?: boolean;
}

async function init() {
  console.log();
  console.log(pc.cyan('  ╔═══════════════════════════════════╗'));
  console.log(pc.cyan('  ║                                   ║'));
  console.log(pc.cyan('  ║        ') + pc.bold(pc.white('Create JifiJs Project')) + pc.cyan('      ║'));
  console.log(pc.cyan('  ║                                   ║'));
  console.log(pc.cyan('  ╚═══════════════════════════════════╝'));
  console.log();

  let targetDir = '';

  // Get project name from command line or prompt
  const argTargetDir = process.argv[2];

  if (argTargetDir) {
    targetDir = argTargetDir.trim();
  } else {
    const result: PromptResult = await prompts({
      type: 'text',
      name: 'projectName',
      message: 'Project name:',
      initial: 'my-jifijs-app',
      validate: (name: string) => {
        if (!name) return 'Project name is required';
        if (!/^[a-z0-9-_]+$/.test(name)) {
          return 'Project name can only contain lowercase letters, numbers, hyphens and underscores';
        }
        return true;
      }
    });

    if (!result.projectName) {
      console.log(pc.red('\n✖ Operation cancelled'));
      process.exit(1);
    }

    targetDir = result.projectName;
  }

  const root = path.resolve(process.cwd(), targetDir);

  // Check if directory exists
  if (fs.existsSync(root)) {
    const result: PromptResult = await prompts({
      type: 'confirm',
      name: 'shouldOverwrite',
      message: `Directory ${pc.cyan(targetDir)} already exists. Remove existing files and continue?`,
      initial: false
    });

    if (!result.shouldOverwrite) {
      console.log(pc.red('\n✖ Operation cancelled'));
      process.exit(1);
    }

    console.log(pc.yellow(`\n  Removing existing files in ${targetDir}...`));
    fs.rmSync(root, { recursive: true, force: true });
  }

  // Ask user preferences
  const preferences = await prompts([
    {
      type: 'confirm',
      name: 'includeTests',
      message: 'Include tests?',
      initial: true
    },
    {
      type: 'confirm',
      name: 'includeDocker',
      message: 'Include docker-compose.yml?',
      initial: true
    },
    {
      type: 'confirm',
      name: 'installDeps',
      message: 'Install dependencies now?',
      initial: true
    }
  ]);

  fs.mkdirSync(root, { recursive: true });

  // Install jifijs template
  console.log(pc.green('\n✓ Downloading JifiJs template...'));
  await installTemplate(root, preferences);

  // Update package.json
  console.log(pc.green('\n✓ Configuring package.json...'));
  updatePackageJson(root, targetDir, preferences);

  // Create .env from .env.example
  console.log(pc.green('\n✓ Creating .env file...'));
  createEnvFile(root);

  // Install dependencies
  if (preferences.installDeps) {
    console.log(pc.green('\n✓ Installing dependencies...'));
    console.log(pc.dim('  This might take a few minutes...'));
    await installDependencies(root);
  } else {
    console.log(pc.yellow('\n⊘ Skipping dependency installation'));
  }

  // Initialize git
  console.log(pc.green('\n✓ Initializing git repository...'));
  await initGit(root);

  // Success message
  printSuccessMessage(targetDir, preferences.installDeps, preferences);
}

async function installTemplate(root: string, preferences: PromptResult): Promise<void> {

  return new Promise((resolve, reject) => {
    const install = spawn('npm', ['install', 'jifijs', '--no-save'], {
      cwd: root,
      stdio: 'pipe'
    });

    install.on('close', (code) => {
      if (code !== 0) {
        reject(new Error('Failed to download template'));
        return;
      }

      // Copy template files from node_modules/jifijs to root
      const templatePath = path.join(root, 'node_modules', 'jifijs');

      if (!fs.existsSync(templatePath)) {
        reject(new Error('Template not found'));
        return;
      }

      // Copy all files except node_modules and dist
      copyTemplateFiles(templatePath, root, preferences);

      // Remove node_modules/jifijs
      fs.rmSync(path.join(root, 'node_modules'), { recursive: true, force: true });

      resolve();
    });

    install.on('error', reject);
  });
}

function copyTemplateFiles(src: string, dest: string, preferences: PromptResult) {
  const entries = fs.readdirSync(src, { withFileTypes: true });

  // Files to always exclude
  const excludedFiles = [
    'dist',
    'coverage',
    'node_modules',
    'package-lock.json',
    'CHANGELOG.md',
    'CONTRIBUTING.md',
    'SECURITY.md',
    '.npmignore'
  ];

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    // Skip excluded files
    if (excludedFiles.includes(entry.name)) {
      continue;
    }

    // Skip tests if user doesn't want them
    if (!preferences.includeTests && (entry.name === 'tests' || entry.name === 'jest.config.js')) {
      continue;
    }

    // Skip docker-compose if user doesn't want it
    if (!preferences.includeDocker && entry.name === 'docker-compose.yml') {
      continue;
    }

    if (entry.isDirectory()) {
      fs.mkdirSync(destPath, { recursive: true });
      copyTemplateFiles(srcPath, destPath, preferences);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

function updatePackageJson(root: string, projectName: string, preferences: PromptResult) {
  const pkgPath = path.join(root, 'package.json');
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));

  // Update package.json for user's project
  pkg.name = projectName;
  pkg.version = '1.0.0';
  delete pkg.bin;

  // Remove scripts that are only for template development
  if (pkg.scripts) {
    delete pkg.scripts.prepublishOnly;

    if (!preferences.includeTests) {
      delete pkg.scripts.test;
      delete pkg.scripts["test:watch"];
      delete pkg.scripts["test:coverage"];
      delete pkg.scripts["test:verbose"];
    }
  }

  fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n');
}

function createEnvFile(root: string) {
  const envExamplePath = path.join(root, '.env.example');
  const envPath = path.join(root, '.env');

  if (fs.existsSync(envExamplePath)) {
    fs.copyFileSync(envExamplePath, envPath);
  }
}

async function installDependencies(root: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const install = spawn('npm', ['install'], {
      cwd: root,
      stdio: 'inherit'
    });

    install.on('close', (code) => {
      if (code !== 0) {
        reject(new Error('Failed to install dependencies'));
        return;
      }
      resolve();
    });

    install.on('error', reject);
  });
}

async function initGit(root: string): Promise<void> {
  return new Promise((resolve) => {
    const git = spawn('git', ['init'], {
      cwd: root,
      stdio: 'pipe'
    });

    git.on('close', () => {
      // Add initial commit
      const add = spawn('git', ['add', '.'], { cwd: root, stdio: 'pipe' });
      add.on('close', () => {
        const commit = spawn('git', ['commit', '-m', 'Initial commit from create-jifijs'], {
          cwd: root,
          stdio: 'pipe'
        });
        commit.on('close', () => resolve());
        commit.on('error', () => resolve()); // Don't fail if git commit fails
      });
      add.on('error', () => resolve());
    });

    git.on('error', () => resolve()); // Don't fail if git is not installed
  });
}

function printSuccessMessage(projectName: string, depsInstalled: boolean = true, preferences: PromptResult) {
  console.log();
  console.log(pc.green('  ✓ ') + pc.bold('Project created successfully!'));
  console.log();
  console.log(pc.cyan('  Next steps:'));
  console.log();
  console.log('  1. Navigate to your project:');
  console.log(pc.dim('     $ ') + pc.cyan(`cd ${projectName}`));
  console.log();

  if (!depsInstalled) {
    console.log('  2. Install dependencies:');
    console.log(pc.dim('     $ ') + pc.cyan('npm install'));
    console.log();
    console.log('  3. Configure your environment:');
  } else {
    console.log('  2. Configure your environment:');
  }

  console.log(pc.dim('     $ ') + pc.cyan('nano .env'));
  console.log(pc.dim('     ') + pc.dim('(Update MongoDB, Redis, JWT secrets, etc.)'));
  console.log();
  console.log(`  ${!depsInstalled ? '4' : '3'}. Start development server:`);
  console.log(pc.dim('     $ ') + pc.cyan('npm run dev'));
  console.log();
  console.log(pc.cyan('  Documentation:'));
  console.log(pc.dim('     ') + pc.underline('https://jifijs.njifanda.com'));
  console.log();
  console.log(pc.cyan('  Available commands:'));
  console.log(pc.dim('     $ ') + 'npm run dev' + pc.dim('         - Start development server'));
  console.log(pc.dim('     $ ') + 'npm run build' + pc.dim('       - Build for production'));
  console.log(pc.dim('     $ ') + 'npm start' + pc.dim('           - Run production server'));

  if (preferences.includeTests) {
    console.log(pc.dim('     $ ') + 'npm test' + pc.dim('            - Run tests'));
  }

  console.log(pc.dim('     $ ') + 'npm run g resource <name>' + pc.dim(' - Generate code'));
  console.log();
  console.log(pc.green('  Happy coding! 🚀'));
  console.log();
}

// Run
init().catch((error) => {
  console.error(pc.red('\n✖ Error:'), error.message);
  process.exit(1);
});
