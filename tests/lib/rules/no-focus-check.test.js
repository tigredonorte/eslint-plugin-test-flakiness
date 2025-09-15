/**
 * @fileoverview Tests for no-focus-check rule
 * @author eslint-plugin-test-flakiness
 */
'use strict';

const rule = require('../../../lib/rules/no-focus-check');
const { RuleTester } = require('eslint');

const ruleTester = new RuleTester({
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module'
  }
});

ruleTester.run('no-focus-check', rule, {
  valid: [
    // Non-test files should be ignored
    {
      code: 'expect(document.activeElement).toBe(input)',
      filename: 'src/app.js'
    },
    {
      code: 'expect(element).toHaveFocus()',
      filename: 'src/component.js'
    },

    // Non-focus related checks
    {
      code: 'expect(element).toBeVisible()',
      filename: 'Visibility.test.js'
    },
    {
      code: 'expect(element).toBeInTheDocument()',
      filename: 'Document.test.js'
    },
    {
      code: 'expect(element.value).toBe("test")',
      filename: 'Value.test.js'
    },

    // Using waitFor for focus checks (valid pattern)
    {
      code: 'await waitFor(() => expect(element).toHaveFocus())',
      filename: 'WaitForFocus.test.js'
    },
    {
      code: 'waitFor(() => { expect(document.activeElement).toBe(input) })',
      filename: 'WaitForActive.test.js'
    },

    // Different property checks
    {
      code: 'expect(element.className).toBe("focused")',
      filename: 'ClassName.test.js'
    },
    {
      code: 'expect(element.dataset.focused).toBe("true")',
      filename: 'Dataset.test.js'
    },

    // Non-focus method names
    {
      code: 'element.blur()',
      filename: 'Blur.test.js'
    },
    {
      code: 'component.setFocus(element)',
      filename: 'SetFocus.test.js'
    }
  ],

  invalid: [
    // Direct focus checks
    {
      code: 'expect(element).toHaveFocus()',
      filename: 'Focus.test.js',
      errors: [{
        messageId: 'avoidFocusCheck'
      }],
      output: 'await waitFor(() => expect(element).toHaveFocus())'
    },
    {
      code: 'expect(input).toHaveFocus()',
      filename: 'Input.test.js',
      errors: [{
        messageId: 'avoidFocusCheck'
      }],
      output: 'await waitFor(() => expect(input).toHaveFocus())'
    },
    {
      code: 'expect(button).not.toHaveFocus()',
      filename: 'NotFocus.test.js',
      errors: [{
        messageId: 'avoidFocusCheck'
      }],
      output: 'await waitFor(() => expect(button).not.toHaveFocus())'
    },

    // document.activeElement checks
    {
      code: 'expect(document.activeElement).toBe(input)',
      filename: 'ActiveElement.test.js',
      errors: [{
        messageId: 'avoidActiveElementCheck'
      }],
      output: 'await waitFor(() => expect(document.activeElement).toBe(input))'
    },
    {
      code: 'expect(document.activeElement).toEqual(element)',
      filename: 'ActiveEqual.test.js',
      errors: [{
        messageId: 'avoidActiveElementCheck'
      }],
      output: 'await waitFor(() => expect(document.activeElement).toEqual(element))'
    },
    {
      code: 'expect(document.activeElement.id).toBe("myInput")',
      filename: 'ActiveId.test.js',
      errors: [{
        messageId: 'avoidActiveElementCheck'
      }],
      output: 'await waitFor(() => expect(document.activeElement.id).toBe("myInput"))'
    },

    // :focus pseudo-selector checks
    {
      code: 'expect(element.matches(":focus")).toBe(true)',
      filename: 'Matches.test.js',
      errors: [{
        messageId: 'avoidFocusSelector'
      }]
    },
    {
      code: 'expect(document.querySelector(":focus")).toBe(input)',
      filename: 'QueryFocus.test.js',
      errors: [{
        messageId: 'avoidFocusSelector'
      }]
    },
    {
      code: 'const focused = document.querySelector(":focus")',
      filename: 'FocusVariable.test.js',
      errors: [{
        messageId: 'avoidFocusSelector'
      }]
    },

    // element.focus() without proper waiting
    {
      code: 'element.focus(); expect(element).toHaveFocus()',
      filename: 'FocusAndCheck.test.js',
      errors: [
        { messageId: 'wrapFocusCall' },
        { messageId: 'avoidFocusCheck' }
      ],
      output: 'await act(async () => { element.focus() }); await waitFor(() => expect(element).toHaveFocus())'
    },
    {
      code: 'input.focus()',
      filename: 'InputFocus.test.js',
      errors: [{
        messageId: 'wrapFocusCall'
      }],
      output: 'await act(async () => { input.focus() })'
    },

    // Multiple violations
    {
      code: `
        element.focus();
        expect(document.activeElement).toBe(element);
        expect(element).toHaveFocus();
      `,
      filename: 'Multiple.test.js',
      errors: [
        { messageId: 'wrapFocusCall' },
        { messageId: 'avoidActiveElementCheck' },
        { messageId: 'avoidFocusCheck' }
      ]
    },

    // Different test file extensions
    {
      code: 'expect(element).toHaveFocus()',
      filename: 'Focus.spec.js',
      errors: [{
        messageId: 'avoidFocusCheck'
      }],
      output: 'await waitFor(() => expect(element).toHaveFocus())'
    },
    {
      code: 'expect(document.activeElement).toBe(input)',
      filename: 'test/active.test.ts',
      errors: [{
        messageId: 'avoidActiveElementCheck'
      }],
      output: 'await waitFor(() => expect(document.activeElement).toBe(input))'
    },

    // Focus within other assertions
    {
      code: 'expect(element).toHaveFocus() && expect(element.value).toBe("test")',
      filename: 'Compound.test.js',
      errors: [{
        messageId: 'avoidFocusCheck'
      }]
    },
    {
      code: 'const hasFocus = expect(element).toHaveFocus()',
      filename: 'Variable.test.js',
      errors: [{
        messageId: 'avoidFocusCheck'
      }],
      output: 'const hasFocus = await waitFor(() => expect(element).toHaveFocus())'
    },

    // Cypress/Playwright focus checks (if applicable)
    {
      code: 'cy.focused().should("have.id", "myInput")',
      filename: 'cypress.cy.js',
      errors: [{
        messageId: 'avoidFocusCheck'
      }]
    },
    {
      code: 'await expect(page.locator(":focus")).toHaveId("myInput")',
      filename: 'playwright.spec.js',
      errors: [{
        messageId: 'avoidFocusSelector'
      }]
    }
  ]
});