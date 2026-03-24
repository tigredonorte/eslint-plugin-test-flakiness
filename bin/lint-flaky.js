#!/usr/bin/env node

'use strict';

const { execSync } = require('child_process');
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
let format = null;
const eslintArgs = [];

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--severity' && args[i + 1]) {
    severity = args[i + 1];
    i++;
  } else if (args[i] === '--format' && args[i + 1]) {
    format = args[i + 1];
    i++;
  } else {
    eslintArgs.push(args[i]);
  }
}

const ruleConfig = rules.reduce((acc, rule) => {
  acc[`test-flakiness/${rule}`] = severity;
  return acc;
}, {});

const globalRoot = execSync('npm root -g', { encoding: 'utf8' }).trim();

const cmd = [
  'eslint',
  '--no-eslintrc',
  '--parser', '@typescript-eslint/parser',
  '--plugin', 'test-flakiness',
  '--rule', JSON.stringify(ruleConfig),
];

if (format) {
  cmd.push('--format', format);
}

cmd.push(...eslintArgs);

try {
  execSync(cmd.join(' '), {
    stdio: 'inherit',
    env: { ...process.env, NODE_PATH: globalRoot },
  });
} catch (e) {
  process.exit(e.status || 1);
}
