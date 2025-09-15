/**
 * @fileoverview Tests for no-element-removal-check rule
 * @author eslint-plugin-test-flakiness
 */
'use strict';

const rule = require('../../../lib/rules/no-element-removal-check');
const { RuleTester } = require('eslint');

const ruleTester = new RuleTester({
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module'
  }
});

ruleTester.run('no-element-removal-check', rule, {
  valid: [
    // Non-test files should be ignored
    {
      code: 'expect(element).not.toBeInTheDocument()',
      filename: 'src/app.js'
    },
    {
      code: 'expect(queryByText("Loading")).toBeNull()',
      filename: 'src/component.js'
    },

    // Positive assertions are fine
    {
      code: 'expect(element).toBeInTheDocument()',
      filename: 'Component.test.js'
    },
    {
      code: 'expect(screen.getByText("Hello")).toBeVisible()',
      filename: 'Visibility.test.js'
    },
    {
      code: 'expect(queryByRole("button")).toBeTruthy()',
      filename: 'Button.test.js'
    },

    // Properly wrapped in waitFor
    {
      code: 'await waitFor(() => { expect(element).not.toBeInTheDocument() })',
      filename: 'Wrapped.test.js'
    },
    {
      code: 'waitFor(() => expect(screen.queryByText("Loading")).not.toBeInTheDocument())',
      filename: 'WaitFor.test.js'
    },
    {
      code: 'await waitForElementToBeRemoved(() => screen.queryByText("Loading"))',
      filename: 'ProperRemoval.test.js'
    },

    // waitForElementToBeRemoved with proper timeout
    {
      code: 'await waitForElementToBeRemoved(() => screen.queryByText("Loading"), { timeout: 5000 })',
      filename: 'TimeoutOk.test.js'
    },
    {
      code: 'waitForElementToBeRemoved(() => queryByTestId("spinner"))',
      filename: 'NoTimeout.test.js'
    },

    // Non-DOM related null checks
    {
      code: 'expect(result).toBeNull()',
      filename: 'Result.test.js'
    },
    {
      code: 'expect(data).toBeUndefined()',
      filename: 'Data.test.js'
    },
    {
      code: 'expect(value).toBeFalsy()',
      filename: 'Value.test.js'
    },

    // Not using query methods
    {
      code: 'expect(getByText("Hello")).toBeNull()',
      filename: 'GetBy.test.js'
    },
    {
      code: 'expect(findByRole("button")).toBeUndefined()',
      filename: 'FindBy.test.js'
    },

    // document.contains with positive check
    {
      code: 'document.contains(element)',
      filename: 'Contains.test.js'
    },
    {
      code: 'expect(document.contains(element)).toBe(true)',
      filename: 'ContainsTrue.test.js'
    },

    // Different patterns that don't match
    {
      code: 'element.not.visible',
      filename: 'Property.test.js'
    },
    {
      code: 'notToBeInTheDocument()',
      filename: 'Function.test.js'
    }
  ],

  invalid: [
    // .not.toBeInTheDocument() without waitFor
    {
      code: 'expect(element).not.toBeInTheDocument()',
      filename: 'Element.test.js',
      errors: [{
        messageId: 'avoidNotInDocument'
      }],
      output: 'await waitForElementToBeRemoved(() => screen.queryByTestId(\'element\'))'
    },
    {
      code: 'expect(screen.queryByText("Loading")).not.toBeInTheDocument()',
      filename: 'Loading.test.js',
      errors: [{
        messageId: 'avoidNotInDocument'
      }],
      output: 'await waitForElementToBeRemoved(() => screen.queryByTestId(\'element\'))'
    },
    {
      code: 'expect(queryByRole("dialog")).not.toBeInTheDocument()',
      filename: 'Dialog.test.js',
      errors: [{
        messageId: 'avoidNotInDocument'
      }],
      output: 'await waitForElementToBeRemoved(() => screen.queryByTestId(\'element\'))'
    },

    // Query methods with null/undefined/falsy checks
    {
      code: 'expect(queryByText("Loading")).toBeNull()',
      filename: 'QueryNull.test.js',
      errors: [{
        messageId: 'useWaitForRemoval'
      }],
      output: 'await waitForElementToBeRemoved(() => queryByText("Loading"))'
    },
    {
      code: 'expect(screen.queryByRole("alert")).toBeNull()',
      filename: 'AlertNull.test.js',
      errors: [{
        messageId: 'useWaitForRemoval'
      }],
      output: 'await waitForElementToBeRemoved(() => screen.queryByRole("alert"))'
    },
    {
      code: 'expect(queryByTestId("spinner")).toBeUndefined()',
      filename: 'SpinnerUndefined.test.js',
      errors: [{
        messageId: 'useWaitForRemoval'
      }],
      output: 'await waitForElementToBeRemoved(() => queryByTestId("spinner"))'
    },
    {
      code: 'expect(queryByLabelText("Email")).toBeFalsy()',
      filename: 'EmailFalsy.test.js',
      errors: [{
        messageId: 'useWaitForRemoval'
      }],
      output: 'await waitForElementToBeRemoved(() => queryByLabelText("Email"))'
    },

    // waitForElementToBeRemoved with too short timeout
    {
      code: 'waitForElementToBeRemoved(() => screen.queryByText("Loading"), { timeout: 500 })',
      filename: 'ShortTimeout.test.js',
      errors: [{
        messageId: 'avoidRemovalCheck'
      }]
    },
    {
      code: 'await waitForElementToBeRemoved(() => queryByRole("progressbar"), { timeout: 100 })',
      filename: 'VeryShortTimeout.test.js',
      errors: [{
        messageId: 'avoidRemovalCheck'
      }]
    },

    // !document.contains(element) pattern
    {
      code: '!document.contains(element)',
      filename: 'DocumentContains.test.js',
      errors: [{
        messageId: 'avoidRemovalCheck'
      }]
    },
    {
      code: 'expect(!document.contains(modal)).toBe(true)',
      filename: 'DocumentContainsExpect.test.js',
      errors: [{
        messageId: 'avoidRemovalCheck'
      }]
    },
    {
      code: 'if (!document.contains(popup)) { console.log("removed") }',
      filename: 'DocumentContainsIf.test.js',
      errors: [{
        messageId: 'avoidRemovalCheck'
      }]
    },

    // Multiple violations
    {
      code: `
        expect(element).not.toBeInTheDocument();
        expect(queryByText("Loading")).toBeNull();
        !document.contains(modal);
      `,
      filename: 'Multiple.test.js',
      errors: [
        { messageId: 'avoidNotInDocument' },
        { messageId: 'useWaitForRemoval' },
        { messageId: 'avoidRemovalCheck' }
      ]
    },

    // Different test file extensions
    {
      code: 'expect(element).not.toBeInTheDocument()',
      filename: 'Component.spec.js',
      errors: [{
        messageId: 'avoidNotInDocument'
      }],
      output: 'await waitForElementToBeRemoved(() => screen.queryByTestId(\'element\'))'
    },
    {
      code: 'expect(queryByText("Loading")).toBeNull()',
      filename: 'test/loading.test.ts',
      errors: [{
        messageId: 'useWaitForRemoval'
      }],
      output: 'await waitForElementToBeRemoved(() => queryByText("Loading"))'
    },
    {
      code: '!document.contains(element)',
      filename: '__tests__/removal.js',
      errors: [{
        messageId: 'avoidRemovalCheck'
      }]
    },

    // Nested patterns
    {
      code: 'it("should remove", () => { expect(element).not.toBeInTheDocument() })',
      filename: 'TestCase.test.js',
      errors: [{
        messageId: 'avoidNotInDocument'
      }]
    },
    {
      code: 'const isRemoved = !document.contains(element)',
      filename: 'Variable.test.js',
      errors: [{
        messageId: 'avoidRemovalCheck'
      }]
    },

    // Complex query patterns
    {
      code: 'expect(container.querySelector(".modal")).toBeNull()',
      filename: 'QuerySelector.test.js',
      errors: [{
        messageId: 'useWaitForRemoval'
      }],
      output: 'await waitForElementToBeRemoved(() => container.querySelector(".modal"))'
    },
    {
      code: 'expect(queryAllByRole("listitem")[0]).toBeUndefined()',
      filename: 'QueryAll.test.js',
      errors: [{
        messageId: 'useWaitForRemoval'
      }],
      output: 'await waitForElementToBeRemoved(() => queryAllByRole("listitem")[0])'
    }
  ]
});