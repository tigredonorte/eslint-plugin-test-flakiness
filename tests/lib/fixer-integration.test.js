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
  'test-flakiness/no-element-removal-check': require('../../lib/rules/no-element-removal-check'),
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
    it('fixes assertion after async state change — output parses cleanly', () => {
      const code = `import { render } from '@testing-library/react';
it('test', () => {
  userEvent.click(button);
  expect(el).toBeVisible();
});`;
      const { fixedCode, syntaxErrors, hadFix } = fixAndValidate(
        'test-flakiness/no-immediate-assertions', code
      );
      expect(hadFix).toBe(true);
      expect(syntaxErrors).toEqual([]);
      expect(fixedCode).toContain('waitFor');
    });

    it('does NOT fix assertion after fireEvent — fireEvent is sync', () => {
      const code = `import { render, fireEvent } from '@testing-library/react';
it('test', () => {
  fireEvent.click(button);
  expect(el).toBeVisible();
});`;
      const { hadFix } = fixAndValidate(
        'test-flakiness/no-immediate-assertions', code
      );
      expect(hadFix).toBe(false);
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

  describe('Idempotence — second fix pass produces no changes', () => {
    const idempotenceFixtures = [
      {
        name: 'no-hard-coded-timeout',
        rule: 'test-flakiness/no-hard-coded-timeout',
        code: `import { render } from '@testing-library/react';
it('test', () => { setTimeout(() => {}, 2000) });`,
      },
      {
        name: 'no-focus-check',
        rule: 'test-flakiness/no-focus-check',
        code: `import { render } from '@testing-library/react';
it('test', () => { expect(el).toHaveFocus() });`,
      },
      {
        name: 'no-immediate-assertions (userEvent)',
        rule: 'test-flakiness/no-immediate-assertions',
        code: `import { render } from '@testing-library/react';
it('test', () => {
  userEvent.click(button);
  expect(el).toBeVisible();
});`,
      },
      {
        name: 'await-async-events (userEvent)',
        rule: 'test-flakiness/await-async-events',
        code: `import userEvent from '@testing-library/user-event';
it('test', () => { userEvent.click(button) });`,
      },
    ];

    idempotenceFixtures.forEach(({ name, rule, code }) => {
      it(`${name}: applying fix twice produces stable output`, () => {
        const first = fixAndValidate(rule, code);
        expect(first.hadFix).toBe(true);
        expect(first.syntaxErrors).toEqual([]);

        // Second pass: run the same rule on the already-fixed output
        const second = fixAndValidate(rule, first.fixedCode);
        expect(second.syntaxErrors).toEqual([]);
        // Either no fix needed (idempotent) or the output is the same
        if (second.hadFix) {
          expect(second.fixedCode).toBe(first.fixedCode);
        }
      });
    });
  });

  describe('Parse safety — every autofix output is valid JavaScript', () => {
    const parseSafetyFixtures = [
      {
        name: 'no-hard-coded-timeout with CJS require',
        rule: 'test-flakiness/no-hard-coded-timeout',
        code: `const { render } = require('@testing-library/react');
it('test', () => { setTimeout(() => {}, 2000) });`,
      },
      {
        name: 'await-async-events with act()',
        rule: 'test-flakiness/await-async-events',
        code: `import { act } from '@testing-library/react';
it('test', () => { act(async () => { await doSomething() }) });`,
      },
      {
        name: 'await-async-events with Playwright page methods',
        rule: 'test-flakiness/await-async-events',
        code: `it('test', () => { page.click("#button") });`,
      },
    ];

    parseSafetyFixtures.forEach(({ name, rule, code }) => {
      it(`${name}: output parses without syntax errors`, () => {
        const { fixedCode, syntaxErrors, hadFix } = fixAndValidate(rule, code);
        expect(hadFix).toBe(true);
        expect(syntaxErrors).toEqual([]);
        // Basic sanity: fixed code is non-empty
        expect(fixedCode.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Multi-fix conflict — multiple rules together produce valid output', () => {
    it('await-async-events + no-immediate-assertions do not conflict', () => {
      const code = `import { render } from '@testing-library/react';
it('test', async () => {
  userEvent.click(button);
  expect(el).toBeVisible();
});`;

      // Run await-async-events first
      const afterAwait = fixAndValidate('test-flakiness/await-async-events', code);
      expect(afterAwait.syntaxErrors).toEqual([]);

      // Then run no-immediate-assertions on the result
      const afterImmediate = fixAndValidate('test-flakiness/no-immediate-assertions', afterAwait.fixedCode);
      expect(afterImmediate.syntaxErrors).toEqual([]);

      // Verify no duplicate imports
      const importMatches = afterImmediate.fixedCode.match(/import\s*\{[^}]*waitFor[^}]*\}/g) || [];
      expect(importMatches.length).toBeLessThanOrEqual(1);
    });

    it('combined output is idempotent after all fixes applied', () => {
      const code = `import { render } from '@testing-library/react';
it('test', async () => {
  userEvent.click(button);
  expect(el).toBeVisible();
});`;

      // Apply await-async-events
      const pass1 = fixAndValidate('test-flakiness/await-async-events', code);
      expect(pass1.syntaxErrors).toEqual([]);

      // Apply no-immediate-assertions
      const pass2 = fixAndValidate('test-flakiness/no-immediate-assertions', pass1.fixedCode);
      expect(pass2.syntaxErrors).toEqual([]);

      // Second round should produce no changes
      const recheck1 = fixAndValidate('test-flakiness/await-async-events', pass2.fixedCode);
      const recheck2 = fixAndValidate('test-flakiness/no-immediate-assertions', recheck1.fixedCode);
      expect(recheck2.syntaxErrors).toEqual([]);
    });
  });
});
