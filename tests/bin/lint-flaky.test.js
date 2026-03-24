/* eslint-disable test-flakiness/no-unmocked-fs, test-flakiness/no-test-isolation */
'use strict';

const { execFile } = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('os');

// lint-flaky CLI requires ESLint 9+ (uses flat config Node API)
const eslintMajor = parseInt(require('eslint/package.json').version.split('.')[0], 10);
const describeIfEslint9 = eslintMajor >= 9 ? describe : describe.skip;

const BIN_PATH = path.join(__dirname, '..', '..', 'bin', 'lint-flaky.js');
const FIXTURES_DIR = path.join(os.tmpdir(), 'lint-flaky-test-fixtures');

function run(args = [], options = {}) {
  return new Promise((resolve) => {
    execFile(process.execPath, [BIN_PATH, ...args], {
      timeout: 30000,
      ...options,
    }, (error, stdout, stderr) => {
      resolve({
        exitCode: error ? error.code : 0,
        stdout: stdout.toString(),
        stderr: stderr.toString(),
      });
    });
  });
}

beforeAll(() => {
  fs.mkdirSync(FIXTURES_DIR, { recursive: true });

  // A clean file with no flaky patterns
  fs.writeFileSync(
    path.join(FIXTURES_DIR, 'clean.test.js'),
    `describe('clean tests', () => {
  it('should pass', () => {
    expect(true).toBe(true);
  });
});
`
  );

  // A file with a flaky pattern (hard-coded timeout)
  fs.writeFileSync(
    path.join(FIXTURES_DIR, 'flaky.test.js'),
    `describe('flaky tests', () => {
  it('should wait', async () => {
    await new Promise(resolve => setTimeout(resolve, 5000));
  });
});
`
  );
});

afterAll(() => {
  fs.rmSync(FIXTURES_DIR, { recursive: true, force: true });
});

describeIfEslint9('lint-flaky CLI', () => {
  describe('help and usage', () => {
    it('shows help with --help flag', async () => {
      const { stdout, exitCode } = await run(['--help']);
      expect(exitCode).toBe(0);
      expect(stdout).toContain('Usage: lint-flaky');
      expect(stdout).toContain('--fix');
      expect(stdout).toContain('--severity');
      expect(stdout).toContain('--format');
      expect(stdout).toContain('Available rules');
    });

    it('shows help with -h flag', async () => {
      const { stdout, exitCode } = await run(['-h']);
      expect(exitCode).toBe(0);
      expect(stdout).toContain('Usage: lint-flaky');
    });

    it('shows usage and exits with code 1 when no args', async () => {
      const { stdout, exitCode } = await run([]);
      expect(exitCode).toBe(1);
      expect(stdout).toContain('Usage: lint-flaky');
    });

    it('lists all available rules in help', async () => {
      const { stdout } = await run(['--help']);
      expect(stdout).toContain('test-flakiness/no-hard-coded-timeout');
      expect(stdout).toContain('test-flakiness/no-unconditional-wait');
      expect(stdout).toContain('test-flakiness/await-async-events');
      expect(stdout).toContain('test-flakiness/no-test-focus');
    });
  });

  describe('severity validation', () => {
    it('rejects invalid severity', async () => {
      const { stderr, exitCode } = await run(['--severity', 'invalid', 'file.js']);
      expect(exitCode).toBe(1);
      expect(stderr).toContain('Invalid severity "invalid"');
      expect(stderr).toContain('warn, error, off');
    });

    it('accepts warn severity', async () => {
      const { stderr } = await run(['--severity', 'warn', path.join(FIXTURES_DIR, 'clean.test.js')]);
      expect(stderr).not.toContain('Invalid severity');
    });

    it('accepts error severity', async () => {
      const { stderr } = await run(['--severity', 'error', path.join(FIXTURES_DIR, 'clean.test.js')]);
      expect(stderr).not.toContain('Invalid severity');
    });

    it('accepts off severity', async () => {
      const { stderr } = await run(['--severity', 'off', path.join(FIXTURES_DIR, 'clean.test.js')]);
      expect(stderr).not.toContain('Invalid severity');
    });
  });

  describe('argument parsing', () => {
    it('treats non-option args as file patterns', async () => {
      // Should not show "no file patterns" error
      const { stderr } = await run([path.join(FIXTURES_DIR, 'clean.test.js')]);
      expect(stderr).not.toContain('No file patterns specified');
    });

    it('parses --fix flag without error', async () => {
      const { stderr } = await run(['--fix', path.join(FIXTURES_DIR, 'clean.test.js')]);
      expect(stderr).not.toContain('No file patterns specified');
    });

    it('parses --format option', async () => {
      const { stderr } = await run(['--format', 'json', path.join(FIXTURES_DIR, 'clean.test.js')]);
      expect(stderr).not.toContain('No file patterns specified');
    });

    it('parses multiple options together', async () => {
      const { stderr } = await run([
        '--severity', 'error',
        '--fix',
        '--format', 'json',
        path.join(FIXTURES_DIR, 'clean.test.js'),
      ]);
      expect(stderr).not.toContain('Invalid severity');
      expect(stderr).not.toContain('No file patterns specified');
    });
  });

  describe('linting behavior', () => {
    it('exits 0 for a clean file with no flaky patterns', async () => {
      const { exitCode } = await run([
        '--severity', 'off',
        path.join(FIXTURES_DIR, 'clean.test.js'),
      ]);
      expect(exitCode).toBe(0);
    });

    it('detects flaky patterns in test files', async () => {
      const { stdout } = await run([
        '--format', 'json',
        path.join(FIXTURES_DIR, 'flaky.test.js'),
      ]);
      const results = JSON.parse(stdout);
      expect(results).toBeInstanceOf(Array);
      expect(results.length).toBeGreaterThan(0);

      const messages = results[0].messages;
      expect(messages.length).toBeGreaterThan(0);

      const ruleIds = messages.map(m => m.ruleId).filter(Boolean);
      expect(ruleIds.some(id => id.startsWith('test-flakiness/'))).toBe(true);
    });

    it('reports errors when severity is error', async () => {
      const { exitCode, stdout } = await run([
        '--severity', 'error',
        '--format', 'json',
        path.join(FIXTURES_DIR, 'flaky.test.js'),
      ]);
      expect(exitCode).toBe(1);

      const results = JSON.parse(stdout);
      const messages = results[0].messages;
      expect(messages.some(m => m.severity === 2)).toBe(true);
    });

    it('reports no issues when severity is off', async () => {
      const { stdout } = await run([
        '--severity', 'off',
        '--format', 'json',
        path.join(FIXTURES_DIR, 'flaky.test.js'),
      ]);
      const results = JSON.parse(stdout);
      const messages = results[0].messages.filter(m => m.ruleId !== null);
      expect(messages.length).toBe(0);
    });
  });
});
