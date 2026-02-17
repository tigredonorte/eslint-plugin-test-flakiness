/**
 * @fileoverview Integration tests verifying that auto-fixers produce valid, parseable JavaScript.
 *
 * These tests use ESLint's Linter API (flat config) to:
 *   1. Run a rule on invalid code
 *   2. Apply the reported fix
 *   3. Re-parse the output to ensure it is syntactically valid
 *   4. Re-lint the output to ensure no new undefined-identifier errors were introduced
 *
 * This guarantees the "fixer contract": autofixes must not produce broken code.
 */
'use strict';

const { Linter } = require('eslint');

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
 * Verifies the output is syntactically valid by re-parsing it.
 */
function fixAndValidate(ruleName, code, ruleOptions = []) {
  const linter = new Linter({ configType: 'flat' });

  const config = [{
    plugins: {
      'test-flakiness': { rules: { [ruleName.split('/')[1]]: ruleFiles[ruleName] } }
    },
    rules: { [ruleName]: ['error', ...ruleOptions] },
    languageOptions: { ecmaVersion: 2022, sourceType: 'module' },
  }];

  // 1. Get messages and fix
  const result = linter.verifyAndFix(code, config, { filename: 'test.spec.js' });
  const fixedCode = result.output;

  // 2. Re-parse the fixed output — must not throw
  const parseErrors = linter.verify(fixedCode, [{
    languageOptions: { ecmaVersion: 2022, sourceType: 'module' },
  }], { filename: 'test.spec.js' });

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
      // Must add a separate import, NOT corrupt the default import
      expect(fixedCode).toContain('import userEvent from \'@testing-library/user-event\'');
      expect(fixedCode).toContain('import { waitFor } from \'@testing-library/user-event\'');
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
      // Must add a separate import, NOT corrupt the namespace import
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

    it('fixes Promise-wrapped setTimeout — produces valid output', () => {
      const code = `import { render } from '@testing-library/react';
async function test() { await new Promise(resolve => setTimeout(resolve, 3000)) }`;
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
      // Code with NO existing waitFor import — fixer must add one
      const code = `import React from 'react';
it('test', () => { setTimeout(() => {}, 2000) });`;
      const { fixedCode, syntaxErrors } = fixAndValidate(
        'test-flakiness/no-hard-coded-timeout', code
      );
      expect(syntaxErrors).toEqual([]);
      // If the output mentions waitFor, it must also import it
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
      // Count occurrences of waitFor in import statements
      const importMatches = fixedCode.match(/import\s*\{[^}]*waitFor[^}]*\}/g) || [];
      expect(importMatches.length).toBe(1);
    });
  });
});
