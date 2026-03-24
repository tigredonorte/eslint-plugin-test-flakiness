#!/usr/bin/env node

'use strict';

const path = require('path');
const fs = require('fs');

// Dynamically discover all rules from the plugin
const rulesDir = path.join(__dirname, '..', 'lib', 'rules');
let rules = [];
if (fs.existsSync(rulesDir)) {
  rules = fs.readdirSync(rulesDir)
    .filter(f => f.endsWith('.js'))
    .map(f => f.replace(/\.js$/, ''));
}

if (rules.length === 0) {
  console.error('Error: No rules found in eslint-plugin-test-flakiness');
  process.exit(1);
}

const args = process.argv.slice(2);

if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
  console.log('Usage: lint-flaky [options] <glob-pattern>');
  console.log('');
  console.log('Lint test files for flaky test patterns.');
  console.log('');
  console.log('Examples:');
  console.log('  lint-flaky "app/e2e/specs/**/*.spec.ts"');
  console.log('  lint-flaky --fix "tests/**/*.test.ts"');
  console.log('  lint-flaky --severity error "**/*.spec.ts"');
  console.log('');
  console.log('Options:');
  console.log('  --fix              Automatically fix problems');
  console.log('  --severity <level> Set rule severity: warn (default) or error');
  console.log('  --format <name>    Use a specific ESLint formatter');
  console.log('  -h, --help         Show this help message');
  console.log('');
  console.log(`Available rules (${rules.length}):`);
  rules.sort().forEach(r => console.log(`  test-flakiness/${r}`));
  process.exit(args.length === 0 ? 1 : 0);
}

// Parse custom options
let severity = 'warn';
let format = 'stylish';
let fix = false;
const filePatterns = [];

const validSeverities = ['warn', 'error', 'off'];

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--severity' && args[i + 1]) {
    severity = args[i + 1];
    if (!validSeverities.includes(severity)) {
      console.error(`Error: Invalid severity "${severity}". Must be one of: ${validSeverities.join(', ')}`);
      process.exit(1);
    }
    i++;
  } else if (args[i] === '--format' && args[i + 1]) {
    format = args[i + 1];
    i++;
  } else if (args[i] === '--fix') {
    fix = true;
  } else {
    filePatterns.push(args[i]);
  }
}

if (filePatterns.length === 0) {
  console.error('Error: No file patterns specified');
  console.error('Usage: lint-flaky <glob-pattern>');
  process.exit(1);
}

const ruleConfig = rules.reduce((acc, rule) => {
  acc[`test-flakiness/${rule}`] = severity;
  return acc;
}, {});

// Detect ESLint version to use the right approach
let eslintMajor;
try {
  const eslintPkg = require('eslint/package.json');
  eslintMajor = parseInt(eslintPkg.version.split('.')[0], 10);
} catch (_e) {
  console.error('Error: ESLint not found. Install it with: npm i -g eslint');
  process.exit(1);
}

// Resolve cwd to the common parent of all file patterns so ESLint
// doesn't reject files as "outside of base path"
function resolveCommonDir(patterns) {
  const resolved = patterns.map(p => path.resolve(p));
  return resolved.reduce((dir, p) => {
    const d = path.dirname(p);
    while (!d.startsWith(dir)) {
      dir = path.dirname(dir);
    }
    return dir;
  }, path.dirname(resolved[0]));
}

async function formatAndExit(eslint, results) {
  if (fix) {
    const ESLintClass = eslint.constructor;
    await ESLintClass.outputFixes(results);
  }

  const formatter = await eslint.loadFormatter(format);
  const output = formatter.format
    ? formatter.format(results)
    : await formatter.format(results);
  if (output) {
    console.log(output);
  }

  const hasErrors = results.some(r => r.errorCount > 0);
  if (hasErrors) process.exit(1);
}

async function runWithNodeAPI() {
  const plugin = require(path.join(__dirname, '..', 'lib', 'index.js'));
  const { ESLint } = require('eslint');

  let parser;
  try {
    parser = require('@typescript-eslint/parser');
  } catch (_e) {
    parser = undefined;
  }

  const commonDir = resolveCommonDir(filePatterns);
  let eslint;

  if (eslintMajor >= 9) {
    // ESLint v9+ flat config via Node API
    const overrideConfig = {
      plugins: { 'test-flakiness': plugin },
      rules: ruleConfig,
    };

    if (parser) {
      overrideConfig.languageOptions = { parser };
    }

    eslint = new ESLint({
      overrideConfigFile: true,
      overrideConfig,
      fix,
      cwd: commonDir,
    });
  } else {
    // ESLint v7/v8 Node API
    const overrideConfig = {
      plugins: ['test-flakiness'],
      rules: ruleConfig,
    };

    if (parser) {
      overrideConfig.parser = require.resolve('@typescript-eslint/parser');
    }

    eslint = new ESLint({
      useEslintrc: false,
      overrideConfig,
      fix,
      cwd: commonDir,
      plugins: { 'test-flakiness': plugin },
    });
  }

  const results = await eslint.lintFiles(filePatterns);
  await formatAndExit(eslint, results);
}

runWithNodeAPI().catch((err) => {
  console.error('Error:', err.message);
  process.exit(1);
});
