/**
 * @fileoverview Integration tests verifying that auto-fixers produce valid, parseable JavaScript.
 *
 * Uses ESLint's Linter API to run a rule, apply the fix, and re-parse the output.
 * This guarantees the "fixer contract": autofixes must not produce syntactically invalid (unparsable) code.
 */
'use strict';

const semver = require('semver');
const { Linter } = require('eslint');
const eslintVersion = semver.major(require('eslint/package.json').version);

// Rules that have auto-fixers which add imports or modify async
const ruleFiles = {
  'test-flakiness/no-hard-coded-timeout': require('../../lib/rules/no-hard-coded-timeout'),
  'test-flakiness/no-focus-check': require('../../lib/rules/no-focus-check'),
  'test-flakiness/no-immediate-assertions': require('../../lib/rules/no-immediate-assertions'),
  'test-flakiness/no-unconditional-wait': require('../../lib/rules/no-unconditional-wait'),
  'test-flakiness/await-async-events': require('../../lib/rules/await-async-events'),
};

/**
 * Run a rule, apply fixes, and return the fixed output.
 * Works with both ESLint 7/8 (legacy) and ESLint 9+ (flat config).
 */
function fixAndValidate(ruleName, code, ruleOptions = []) {
  const linter = new Linter(eslintVersion >= 9 ? { configType: 'flat' } : undefined);
  const shortName = ruleName.split('/')[1];
  const ecmaVersion = eslintVersion >= 8 ? 2022 : 2020;

  let config, parseConfig;

  if (eslintVersion >= 9) {
    config = [{
      plugins: { 'test-flakiness': { rules: { [shortName]: ruleFiles[ruleName] } } },
      rules: { [ruleName]: ['error', ...ruleOptions] },
      languageOptions: { ecmaVersion, sourceType: 'module' },
    }];
    parseConfig = [{ languageOptions: { ecmaVersion, sourceType: 'module' } }];
  } else {
    linter.defineRule(ruleName, ruleFiles[ruleName]);
    config = {
      rules: { [ruleName]: ['error', ...ruleOptions] },
      parserOptions: { ecmaVersion, sourceType: 'module' },
    };
    parseConfig = { parserOptions: { ecmaVersion, sourceType: 'module' } };
  }

  const result = linter.verifyAndFix(code, config, { filename: 'test.spec.js' });
  const fixedCode = result.output;

  const parseErrors = linter.verify(fixedCode, parseConfig, { filename: 'test.spec.js' });
  const syntaxErrors = parseErrors.filter(m => m.fatal);

  return { fixedCode, syntaxErrors, hadFix: result.fixed };
}

describe('Fixer integration — output must parse cleanly', () => {
  describe('no-hard-coded-timeout', () => {
    it('fixes setTimeout with named import present', () => {
      const code = `import { render } from '@testing-library/react';
it('test', () => { setTimeout(() => {}, 2000) });`;
      const { fixedCode, syntaxErrors, hadFix } = fixAndValidate(
        'test-flakiness/no-hard-coded-timeout', code
      );
      expect(hadFix).toBe(true);
      expect(syntaxErrors).toEqual([]);
      expect(fixedCode).toContain('waitFor');
      expect(fixedCode).toContain('import');
    });

    it('fixes setTimeout with default import only (userEvent)', () => {
      const code = `import userEvent from '@testing-library/user-event';
it('test', () => { setTimeout(() => {}, 2000) });`;
      const { fixedCode, syntaxErrors, hadFix } = fixAndValidate(
        'test-flakiness/no-hard-coded-timeout', code
      );
      expect(hadFix).toBe(true);
      expect(syntaxErrors).toEqual([]);
      expect(fixedCode).toContain('waitFor');
      // user-event doesn't export waitFor — must import from @testing-library/react
      expect(fixedCode).toContain('import userEvent from \'@testing-library/user-event\'');
      expect(fixedCode).toContain('import { waitFor } from \'@testing-library/react\'');
    });

    it('fixes setTimeout with namespace import', () => {
      const code = `import * as RTL from '@testing-library/react';
it('test', () => { setTimeout(() => {}, 2000) });`;
      const { fixedCode, syntaxErrors, hadFix } = fixAndValidate(
        'test-flakiness/no-hard-coded-timeout', code
      );
      expect(hadFix).toBe(true);
      expect(syntaxErrors).toEqual([]);
      expect(fixedCode).toContain('waitFor');
      expect(fixedCode).toContain('import * as RTL from \'@testing-library/react\'');
      expect(fixedCode).toContain('import { waitFor } from \'@testing-library/react\'');
    });

    it('fixes setTimeout with no @testing-library import at all', () => {
      const code = `import React from 'react';
it('test', () => { setTimeout(() => {}, 2000) });`;
      const { fixedCode, syntaxErrors, hadFix } = fixAndValidate(
        'test-flakiness/no-hard-coded-timeout', code
      );
      expect(hadFix).toBe(true);
      expect(syntaxErrors).toEqual([]);
      expect(fixedCode).toContain('waitFor');
      expect(fixedCode).toContain('import { waitFor } from \'@testing-library/react\'');
    });

    it('fixes setTimeout — function becomes async', () => {
      const code = `import { render } from '@testing-library/react';
it('test', () => { setTimeout(() => {}, 2000) });`;
      const { fixedCode, syntaxErrors } = fixAndValidate(
        'test-flakiness/no-hard-coded-timeout', code
      );
      expect(syntaxErrors).toEqual([]);
      expect(fixedCode).toContain('async');
      expect(fixedCode).toContain('await waitFor');
    });

    it('skips autofix for Promise-wrapped setTimeout with identifier callback', () => {
      const code = `import { render } from '@testing-library/react';
async function test() { await new Promise(resolve => setTimeout(resolve, 3000)) }`;
      const { hadFix } = fixAndValidate(
        'test-flakiness/no-hard-coded-timeout', code
      );
      expect(hadFix).toBe(false);
    });

    it('fixes Promise-wrapped setTimeout with function callback — produces valid output', () => {
      const code = `import { render } from '@testing-library/react';
async function test() { await new Promise(resolve => setTimeout(() => resolve(), 3000)) }`;
      const { fixedCode, syntaxErrors, hadFix } = fixAndValidate(
        'test-flakiness/no-hard-coded-timeout', code
      );
      expect(hadFix).toBe(true);
      expect(syntaxErrors).toEqual([]);
      expect(fixedCode).toContain('waitFor');
    });
  });

  describe('no-focus-check', () => {
    it('fixes toHaveFocus assertion — output parses cleanly', () => {
      const code = `import { render } from '@testing-library/react';
it('test', () => { expect(el).toHaveFocus() });`;
      const { fixedCode, syntaxErrors, hadFix } = fixAndValidate(
        'test-flakiness/no-focus-check', code
      );
      expect(hadFix).toBe(true);
      expect(syntaxErrors).toEqual([]);
      expect(fixedCode).toContain('waitFor');
    });
  });

  describe('no-immediate-assertions', () => {
    it('fixes assertion after state change — output parses cleanly', () => {
      const code = `import { render, fireEvent } from '@testing-library/react';
it('test', () => {
  fireEvent.click(button);
  expect(el).toBeVisible();
});`;
      const { fixedCode, syntaxErrors, hadFix } = fixAndValidate(
        'test-flakiness/no-immediate-assertions', code
      );
      expect(hadFix).toBe(true);
      expect(syntaxErrors).toEqual([]);
      expect(fixedCode).toContain('waitFor');
    });
  });

  describe('await-async-events', () => {
    it('adds await to userEvent — output parses cleanly', () => {
      const code = `import userEvent from '@testing-library/user-event';
it('test', () => { userEvent.click(button) });`;
      const { fixedCode, syntaxErrors, hadFix } = fixAndValidate(
        'test-flakiness/await-async-events', code
      );
      expect(hadFix).toBe(true);
      expect(syntaxErrors).toEqual([]);
      expect(fixedCode).toContain('await');
      expect(fixedCode).toContain('async');
    });
  });

  describe('Import fixer contract: no undefined identifiers', () => {
    it('every waitFor usage has a corresponding import', () => {
      const code = `import React from 'react';
it('test', () => { setTimeout(() => {}, 2000) });`;
      const { fixedCode, syntaxErrors } = fixAndValidate(
        'test-flakiness/no-hard-coded-timeout', code
      );
      expect(syntaxErrors).toEqual([]);
      if (fixedCode.includes('waitFor(')) {
        const hasImport = /import\s*\{[^}]*waitFor[^}]*\}\s*from/.test(fixedCode);
        expect(hasImport).toBe(true);
      }
    });

    it('does not duplicate waitFor import when already present', () => {
      const code = `import { render, waitFor } from '@testing-library/react';
it('test', () => { setTimeout(() => {}, 2000) });`;
      const { fixedCode, syntaxErrors } = fixAndValidate(
        'test-flakiness/no-hard-coded-timeout', code
      );
      expect(syntaxErrors).toEqual([]);
      const importMatches = fixedCode.match(/import\s*\{[^}]*waitFor[^}]*\}/g) || [];
      expect(importMatches.length).toBe(1);
    });
  });
});
